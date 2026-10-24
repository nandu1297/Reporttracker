import Link from "next/link";
import { db } from "@/lib/db";
import { getMonthFull } from "@/lib/data";
import { monthLabel } from "@/lib/dates";
import { inr } from "@/lib/calc";

export default async function Recents() {
  const months = await db.month.findMany({
    where: { status: "COMPLETED" },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  const fulls = await Promise.all(months.map((m) => getMonthFull(m.id)));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Recents</h1>
      {months.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-slate-600">
          No completed months yet. Completed months appear here.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {months.map((m, i) => {
            const s = fulls[i]!.monthSummary;
            return (
              <Link key={m.id} href={`/months/${m.id}`} className="rounded-xl border bg-white p-4 transition hover:border-emerald-400">
                <div className="font-semibold">{monthLabel(m.year, m.month)}</div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-sm text-slate-600">
                  <span>Reports: {s.reportsReceived}</span>
                  <span>Profit: <b className="text-emerald-600">{inr(s.profit)}</b></span>
                  <span>Client pending: {inr(s.clientPending)}</span>
                  <span>Emp. pending: {inr(s.employeePending)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
