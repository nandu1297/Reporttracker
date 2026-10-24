"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { clientTotal, employeeTotal, DEFAULT_CLIENT_RATE, DEFAULT_EMPLOYEE_RATE } from "@/lib/calc";
import { weekRanges } from "@/lib/dates";
import { KEEP_OPTIONS, currentMonthIndex, monthsToPrune } from "@/lib/prune";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const refresh = () => revalidatePath("/", "layout");
const fail = (e: unknown): { ok: false; error: string } => {
  if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Invalid input" };
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
    return { ok: false, error: "That name already exists" };
  return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
};

const int = (label: string, min = 0) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(10_000_000);

// ---------- clients & employees ----------
const clientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required").max(120),
  notes: z.string().trim().max(500).optional(),
  rate: int("Rate").default(DEFAULT_CLIENT_RATE),
  defaultReports: int("Default reports", 1).default(1),
});

export async function addClient(
  input: unknown,
): Promise<Result<{ client: { id: string; name: string; rate: number } }>> {
  try {
    const d = clientSchema.parse(input);
    const dup = await db.client.findFirst({ where: { name: { equals: d.name, mode: "insensitive" } } });
    if (dup) return { ok: false, error: "A client with this name already exists" };
    const client = await db.client.create({ data: { name: d.name, notes: d.notes || null, rate: d.rate, defaultReports: d.defaultReports } });
    refresh();
    return { ok: true, client: { id: client.id, name: client.name, rate: client.rate } };
  } catch (e) {
    return fail(e);
  }
}

const employeeSchema = z.object({
  name: z.string().trim().min(1, "Employee name is required").max(120),
  contact: z.string().trim().max(200).optional(),
});

export async function addEmployee(
  input: unknown,
): Promise<Result<{ employee: { id: string; name: string } }>> {
  try {
    const d = employeeSchema.parse(input);
    const dup = await db.employee.findFirst({ where: { name: { equals: d.name, mode: "insensitive" } } });
    if (dup) return { ok: false, error: "An employee with this name already exists" };
    const employee = await db.employee.create({ data: { name: d.name, contact: d.contact || null } });
    refresh();
    return { ok: true, employee: { id: employee.id, name: employee.name } };
  } catch (e) {
    return fail(e);
  }
}

// Past assignments keep the stored name, so history and totals are unchanged.
export async function deleteClient(id: string): Promise<Result> {
  try {
    await db.client.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteEmployee(id: string): Promise<Result> {
  try {
    const emp = await db.employee.findUnique({ where: { id } });
    if (emp?.isSelf) throw new Error("“Self” is built in and cannot be deleted");
    await db.employee.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- months ----------
export async function createMonth(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date");
    const { startDate, endDate } = z.object({ startDate: iso, endDate: iso }).parse(input);
    const start = new Date(startDate + "T00:00:00Z");
    const end = new Date(endDate + "T00:00:00Z");
    if (isNaN(+start) || isNaN(+end)) return { ok: false, error: "Pick a valid date" };
    const days = Math.round((+end - +start) / 864e5) + 1;
    if (days < 4) return { ok: false, error: "The range must cover at least 4 days (one per week)" };
    if (days > 62) return { ok: false, error: "The range can be at most 62 days" };
    const year = start.getUTCFullYear();
    const month = start.getUTCMonth() + 1;
    const existing = await db.month.findUnique({ where: { year_month: { year, month } } });
    if (existing) return { ok: false, error: "A tracker already exists for the month of the start date" };
    const m = await db.month.create({
      data: { year, month, weeks: { create: weekRanges(start, end) } },
    });
    refresh();
    return { ok: true, id: m.id };
  } catch (e) {
    return fail(e);
  }
}

export async function setMonthStatus(id: string, status: "ACTIVE" | "COMPLETED"): Promise<Result> {
  try {
    await db.month.update({
      where: { id },
      data: { status, completedAt: status === "COMPLETED" ? new Date() : null },
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMonth(id: string): Promise<Result> {
  try {
    await db.month.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// Deletes archived months older than the last `keep` months. Active months are never touched.
export async function deleteOldMonths(keep: number): Promise<Result<{ deleted: number }>> {
  try {
    if (!(KEEP_OPTIONS as readonly number[]).includes(keep)) throw new Error("Invalid period");
    const all = await db.month.findMany({ select: { id: true, year: true, month: true, status: true } });
    const ids = monthsToPrune(all, keep, currentMonthIndex()).map((m) => m.id);
    if (ids.length) await db.month.deleteMany({ where: { id: { in: ids }, status: "COMPLETED" } });
    refresh();
    return { ok: true, deleted: ids.length };
  } catch (e) {
    return fail(e);
  }
}

// ---------- assignments ----------
async function assertEditable(weekId: string) {
  const week = await db.week.findUnique({ where: { id: weekId }, include: { month: true } });
  if (!week) throw new Error("Week not found");
  if (week.month.status === "COMPLETED") throw new Error("This month is archived. Reopen it to edit.");
  return week;
}

export async function addAssignment(weekId: string, date: string): Promise<Result> {
  try {
    const week = await assertEditable(weekId);
    const d = new Date(date + "T00:00:00Z");
    if (isNaN(+d) || d < week.startDate || d > week.endDate) throw new Error("Date is outside this week");
    const count = await db.assignment.count({ where: { weekId, date: d } });
    await db.assignment.create({
      data: {
        weekId,
        date: d,
        sortOrder: count,
        clientName: "",
        reportsReceived: 1,
        clientRate: DEFAULT_CLIENT_RATE,
        clientTotal: DEFAULT_CLIENT_RATE,
        employeeRate: DEFAULT_EMPLOYEE_RATE,
        employeeQty: 1,
        employeeTotal: DEFAULT_EMPLOYEE_RATE,
      },
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const patchSchema = z.object({
  clientId: z.string().nullable().optional(),
  reportName: z.string().trim().max(300).optional(),
  reportsReceived: int("Reports received").optional(),
  clientRate: int("Client rate").optional(),
  employeeId: z.string().nullable().optional(),
  employeeRate: int("Employee rate").optional(),
  employeeQty: int("Payment quantity").optional(),
});

export async function updateAssignment(id: string, input: unknown): Promise<Result> {
  try {
    const patch = patchSchema.parse(input);
    // Reads run in parallel and the write is a single statement: far fewer round trips to the remote DB.
    const [cur, client, employee] = await Promise.all([
      db.assignment.findUnique({
        relationLoadStrategy: "join",
        where: { id },
        include: { week: { include: { month: true } } },
      }),
      patch.clientId ? db.client.findUnique({ where: { id: patch.clientId } }) : null,
      patch.employeeId ? db.employee.findUnique({ where: { id: patch.employeeId } }) : null,
    ]);
    if (!cur) throw new Error("Row not found");
    if (cur.week.month.status === "COMPLETED") throw new Error("This month is archived. Reopen it to edit.");
    const data: Prisma.AssignmentUncheckedUpdateInput = {};
    let clientRate = patch.clientRate ?? cur.clientRate;
    if (patch.clientId !== undefined) {
      if (patch.clientId) {
        if (!client) throw new Error("Client not found");
        data.clientId = client.id;
        data.clientName = client.name;
        if (patch.clientRate === undefined) clientRate = client.rate;
      } else {
        data.clientId = null;
        data.clientName = "";
      }
    }
    if (patch.employeeId !== undefined) {
      if (patch.employeeId) {
        if (!employee) throw new Error("Employee not found");
        data.employeeId = employee.id;
        data.employeeName = employee.name;
        data.isSelf = employee.isSelf;
        // Nothing is owed for work done by me, so drop any payment recorded earlier.
        if (employee.isSelf) data.employeePayments = { deleteMany: {} };
      } else {
        data.employeeId = null;
        data.employeeName = null;
        data.isSelf = false;
      }
    }
    if (patch.reportName !== undefined) data.reportName = patch.reportName;
    // Picking a client fills in that client's usual report count (unless one was typed in the same edit).
    const reports =
      patch.reportsReceived ?? (patch.clientId && client ? client.defaultReports : cur.reportsReceived);
    const eRate = patch.employeeRate ?? cur.employeeRate;
    const eQty = patch.employeeQty ?? cur.employeeQty;
    Object.assign(data, {
      reportsReceived: reports,
      clientRate,
      clientTotal: clientTotal(reports, clientRate),
      employeeRate: eRate,
      employeeQty: eQty,
      employeeTotal: employeeTotal(eRate, eQty),
    });
    await db.assignment.update({ where: { id }, data });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteAssignment(id: string): Promise<Result> {
  try {
    const a = await db.assignment.findUnique({ where: { id } });
    if (!a) throw new Error("Row not found");
    await assertEditable(a.weekId);
    await db.assignment.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- payments ----------
// One read + one write (no interactive transaction) keeps round trips to the remote DB low.
const ARCHIVED = "This month is archived. Reopen it to edit.";

export async function setPayment(id: string, kind: "client" | "employee", paid: boolean): Promise<Result> {
  try {
    const a = await db.assignment.findUnique({
      relationLoadStrategy: "join",
      where: { id },
      include: { week: { include: { month: true } }, clientPayments: true, employeePayments: true },
    });
    if (!a) throw new Error("Row not found");
    if (a.week.month.status === "COMPLETED") throw new Error(ARCHIVED);
    if (kind === "client") {
      const existing = a.clientPayments.reduce((s, p) => s + p.amount, 0);
      if (!paid) await db.clientPayment.deleteMany({ where: { assignmentId: id } });
      else if (a.clientTotal > existing)
        await db.clientPayment.create({ data: { assignmentId: id, amount: a.clientTotal - existing } });
    } else {
      if (a.isSelf) throw new Error("Self reports have no employee payment");
      const existing = a.employeePayments.reduce((s, p) => s + p.amount, 0);
      if (!paid) await db.employeePayment.deleteMany({ where: { assignmentId: id } });
      else if (a.employeeTotal > existing)
        await db.employeePayment.create({ data: { assignmentId: id, amount: a.employeeTotal - existing } });
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// Bulk: mark every client payment in a week (or a whole month) received, or reset them to pending.
export async function setClientPaidBulk(
  scope: { weekId: string } | { monthId: string },
  paid: boolean,
): Promise<Result> {
  try {
    const where = "weekId" in scope ? { weekId: scope.weekId } : { week: { monthId: scope.monthId } };
    const rows = await db.assignment.findMany({
      relationLoadStrategy: "join",
      where,
      include: { week: { include: { month: true } }, clientPayments: true },
    });
    if (rows.some((r) => r.week.month.status === "COMPLETED")) throw new Error(ARCHIVED);
    if (!paid) {
      await db.clientPayment.deleteMany({ where: { assignment: where } });
    } else {
      const data = rows
        .map((r) => ({ assignmentId: r.id, amount: r.clientTotal - r.clientPayments.reduce((s, p) => s + p.amount, 0) }))
        .filter((p) => p.amount > 0);
      if (data.length) await db.clientPayment.createMany({ data });
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// Bulk: mark every employee payment in a week (or a whole month) paid, or reset them to pending.
// Self and unassigned rows owe nothing, so they are left alone.
export async function setEmployeePaidBulk(
  scope: { weekId: string } | { monthId: string },
  paid: boolean,
): Promise<Result> {
  try {
    const base = "weekId" in scope ? { weekId: scope.weekId } : { week: { monthId: scope.monthId } };
    const where = { ...base, isSelf: false, OR: [{ employeeId: { not: null } }, { employeeName: { not: null } }] };
    const rows = await db.assignment.findMany({
      relationLoadStrategy: "join",
      where,
      include: { week: { include: { month: true } }, employeePayments: true },
    });
    if (rows.some((r) => r.week.month.status === "COMPLETED")) throw new Error(ARCHIVED);
    if (!paid) {
      await db.employeePayment.deleteMany({ where: { assignment: where } });
    } else {
      const data = rows
        .map((r) => ({ assignmentId: r.id, amount: r.employeeTotal - r.employeePayments.reduce((s, p) => s + p.amount, 0) }))
        .filter((p) => p.amount > 0);
      if (data.length) await db.employeePayment.createMany({ data });
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- week boundary ----------
// +1: this week takes the first day of the next week (with that day's assignments).
// -1: this week gives its last day back to the next week. The month's overall range never changes.
export async function extendWeek(weekId: string, delta: 1 | -1): Promise<Result> {
  try {
    const week = await db.week.findUnique({
      where: { id: weekId },
      include: { month: { include: { weeks: { include: { assignments: true }, orderBy: { number: "asc" } } } } },
    });
    if (!week) throw new Error("Week not found");
    if (week.month.status === "COMPLETED") throw new Error("This month is archived. Reopen it to edit.");
    const own = week.month.weeks.find((w) => w.id === weekId)!;
    const next = week.month.weeks.find((w) => w.number === week.number + 1);
    if (!next) throw new Error("The last week has no next week to borrow days from");
    const len = (w: { startDate: Date; endDate: Date }) => Math.round((+w.endDate - +w.startDate) / 864e5) + 1;
    const day = 864e5;

    if (delta === 1) {
      if (len(next) < 2) throw new Error("The next week must keep at least 1 day");
      await db.$transaction([
        db.assignment.updateMany({ where: { weekId: next.id, date: next.startDate }, data: { weekId } }),
        db.week.update({ where: { id: weekId }, data: { endDate: new Date(+own.endDate + day) } }),
        db.week.update({ where: { id: next.id }, data: { startDate: new Date(+next.startDate + day) } }),
      ]);
    } else {
      if (len(own) < 2) throw new Error("A week must keep at least 1 day");
      await db.$transaction([
        db.assignment.updateMany({ where: { weekId, date: own.endDate }, data: { weekId: next.id } }),
        db.week.update({ where: { id: weekId }, data: { endDate: new Date(+own.endDate - day) } }),
        db.week.update({ where: { id: next.id }, data: { startDate: new Date(+next.startDate - day) } }),
      ]);
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
