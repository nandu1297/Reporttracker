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
};

// Each assignment is counted once; payments are capped at the row total.
export function summarize(rows: AssignmentCalc[]): Summary {
  const s: Summary = {
    reportsReceived: 0, reportsAssigned: 0, reportsPending: 0,
    clientAmount: 0, clientReceived: 0, clientPending: 0,
    employeeTotal: 0, employeePaid: 0, employeePending: 0, profit: 0,
  };
  for (const r of rows) {
    s.reportsReceived += r.reportsReceived;
    if (r.employeeId || r.employeeName) s.reportsAssigned += r.reportsReceived;
    s.clientAmount += r.clientTotal;
    s.clientReceived += Math.min(r.clientPaid, r.clientTotal);
    s.employeeTotal += r.employeeTotal;
    s.employeePaid += Math.min(r.employeePaid, r.employeeTotal);
  }
  s.reportsPending = s.reportsReceived - s.reportsAssigned;
  s.clientPending = s.clientAmount - s.clientReceived;
  s.employeePending = s.employeeTotal - s.employeePaid;
  s.profit = s.clientAmount - s.employeeTotal;
  return s;
}
