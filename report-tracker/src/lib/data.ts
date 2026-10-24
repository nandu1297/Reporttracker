import { db } from "./db";
import { summarize, type AssignmentCalc } from "./calc";

export type RowDTO = {
  id: string; weekId: string; date: string; clientId: string | null; clientName: string;
  reportName: string; reportsReceived: number; clientRate: number; clientTotal: number;
  employeeId: string | null; employeeName: string | null; employeeRate: number; employeeQty: number;
  employeeTotal: number; clientPaid: number; employeePaid: number;
};

export async function getMonthFull(id: string) {
  const month = await db.month.findUnique({
    relationLoadStrategy: "join",
    where: { id },
    include: {
      weeks: {
        orderBy: { number: "asc" },
        include: {
          assignments: {
            orderBy: [{ date: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
            include: { clientPayments: true, employeePayments: true },
          },
        },
      },
    },
  });
  if (!month) return null;
  const weeks = month.weeks.map((w) => {
    const rows: RowDTO[] = w.assignments.map((a) => ({
      id: a.id, weekId: a.weekId, date: a.date.toISOString().slice(0, 10),
      clientId: a.clientId, clientName: a.clientName, reportName: a.reportName,
      reportsReceived: a.reportsReceived, clientRate: a.clientRate, clientTotal: a.clientTotal,
      employeeId: a.employeeId, employeeName: a.employeeName, employeeRate: a.employeeRate,
      employeeQty: a.employeeQty, employeeTotal: a.employeeTotal,
      clientPaid: a.clientPayments.reduce((s, p) => s + p.amount, 0),
      employeePaid: a.employeePayments.reduce((s, p) => s + p.amount, 0),
    }));
    return { id: w.id, number: w.number, startDate: w.startDate, endDate: w.endDate, rows, summary: summarize(rows as AssignmentCalc[]) };
  });
  const monthSummary = summarize(weeks.flatMap((w) => w.rows as AssignmentCalc[]));
  return { month, weeks, monthSummary };
}
