import type { ReportStatus } from "./status";

export const DEFAULT_CLIENT_RATE = 2000;
export const DEFAULT_EMPLOYEE_RATE = 400;

export const clientTotal = (reports: number, rate: number) => reports * rate;
export const employeeTotal = (rate: number, qty: number) => rate * qty;

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export type AssignmentCalc = {
  reportsReceived: number;
  clientTotal: number;
  employeeId: string | null;
  employeeName?: string | null; // kept on the row after an employee is deleted
  employeeTotal: number;
  employeeQty?: number; // falls back to reportsReceived
  isSelf?: boolean; // done by me: no employee payment owed
  clientPaid: number;
  employeePaid: number;
};

export type Summary = {
  reportsReceived: number;
  reportsAssigned: number;
  reportsPending: number;
  clientAmount: number;
  clientReceived: number;
  clientPending: number;
  employeeTotal: number;
  employeePaid: number;
  employeePending: number;
  profit: number;
  selfReports: number; // reports I did myself
  selfSaved: number; // what those would have cost if given to an employee
};

// Each assignment is counted once; payments are capped at the row total.
export function summarize(rows: AssignmentCalc[]): Summary {
  const s: Summary = {
    reportsReceived: 0, reportsAssigned: 0, reportsPending: 0,
    clientAmount: 0, clientReceived: 0, clientPending: 0,
    employeeTotal: 0, employeePaid: 0, employeePending: 0, profit: 0,
    selfReports: 0, selfSaved: 0,
  };
  for (const r of rows) {
    s.reportsReceived += r.reportsReceived;
    if (r.employeeId || r.employeeName) s.reportsAssigned += r.reportsReceived;
    s.clientAmount += r.clientTotal;
    s.clientReceived += Math.min(r.clientPaid, r.clientTotal);
    if (r.isSelf) {
      s.selfReports += r.employeeQty ?? r.reportsReceived;
      s.selfSaved += r.employeeTotal;
      continue;
    }
    s.employeeTotal += r.employeeTotal;
    s.employeePaid += Math.min(r.employeePaid, r.employeeTotal);
  }
  s.reportsPending = s.reportsReceived - s.reportsAssigned;
  s.clientPending = s.clientAmount - s.clientReceived;
  s.employeePending = s.employeeTotal - s.employeePaid;
  s.profit = s.clientAmount - s.employeeTotal;
  return s;
}

// Reports (not rows) per status: a row with 3 reports received counts as 3.
export function countByStatus(rows: { status: ReportStatus; reportsReceived: number }[]): Record<ReportStatus, number> {
  const c: Record<ReportStatus, number> = { ASSIGNED: 0, UNDER_REVIEW: 0, READY_TO_SEND: 0, SENT: 0 };
  for (const r of rows) c[r.status] += r.reportsReceived;
  return c;
}

export type EmployeeLine = {
  key: string;
  name: string;
  reports: number;
  total: number;
  paid: number;
  pending: number;
  status: "paid" | "partial" | "pending";
};

// One line per employee (self and unassigned rows excluded). Unpaid employees come first.
export function summarizeByEmployee(rows: AssignmentCalc[]): EmployeeLine[] {
  const map = new Map<string, EmployeeLine>();
  for (const r of rows) {
    if (r.isSelf || !(r.employeeId || r.employeeName)) continue;
    const key = r.employeeId ?? `name:${r.employeeName}`;
    const l = map.get(key) ?? { key, name: r.employeeName ?? "Employee", reports: 0, total: 0, paid: 0, pending: 0, status: "paid" as const };
    l.reports += r.employeeQty ?? r.reportsReceived;
    l.total += r.employeeTotal;
    l.paid += Math.min(r.employeePaid, r.employeeTotal);
    map.set(key, l);
  }
  const lines = [...map.values()];
  for (const l of lines) {
    l.pending = l.total - l.paid;
    l.status = l.pending <= 0 ? "paid" : l.paid > 0 ? "partial" : "pending";
  }
  return lines.sort((a, b) => Number(b.pending > 0) - Number(a.pending > 0) || a.name.localeCompare(b.name));
}
