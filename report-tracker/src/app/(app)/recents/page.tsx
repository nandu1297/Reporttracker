import Link from "next/link";
import { db } from "@/lib/db";
import { getMonthFull } from "@/lib/data";
import { fmtShort, monthLabel } from "@/lib/dates";
import { inr, summarizeByEmployee, type AssignmentCalc } from "@/lib/calc";
import { cn } from "@/lib/utils";
import { SummaryPanel } from "@/components/SummaryPanel";
import { MonthPicker } from "@/components/MonthPicker";
import { DeleteMonthButton, DeleteOldData } from "@/components/RecentsCleanup";
import { currentMonthIndex } from "@/lib/prune";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function Recents({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: selectedId } = await searchParams;
  const months = await db.month.findMany({ orderBy: [{ year: "desc" }, { month: "desc" }] });
  const fulls = await Promise.all(months.map((m) => getMonthFull(m.id)));
  const selIdx = months.findIndex((m) => m.id === selectedId);
  const sel = selIdx >= 0 ? fulls[selIdx] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Recents</h1>
        <MonthPicker
          value={sel ? months[selIdx].id : ""}
          options={months.map((m) => ({ id: m.id, label: monthLabel(m.year, m.month) }))}
        />
      </div>

      {months.length > 0 && (
        <DeleteOldData
          current={currentMonthIndex()}
          months={months.map((m) => ({ id: m.id, label: monthLabel(m.year, m.month), year: m.year, month: m.month, status: m.status }))}
        />
      )}

      {months.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-slate-600">
          No months yet. Create one from “+ New Month”.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {months.map((m, i) => {
            const s = fulls[i]!.monthSummary;
            return (
              <Link
                key={m.id}
                href={`/recents?month=${m.id}`}
                className={cn(
                  "rounded-xl border bg-white p-4 transition hover:border-emerald-400",
                  m.id === sel?.month.id && "border-emerald-500 ring-2 ring-emerald-200",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{monthLabel(m.year, m.month)}</span>
                  <Badge variant={m.status === "COMPLETED" ? "secondary" : "default"}>
                    {m.status === "COMPLETED" ? "Archived" : "Active"}
                  </Badge>
                </div>
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

      {sel && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{monthLabel(sel.month.year, sel.month.month)}</h2>
            <div className="flex gap-2">
              <Button nativeButton={false} render={<Link href={`/months/${sel.month.id}`} />} variant="outline" className="h-10">
                Open month
              </Button>
              <DeleteMonthButton id={sel.month.id} label={monthLabel(sel.month.year, sel.month.month)} />
            </div>
          </div>

          {sel.weeks.map((w) => (
            <SummaryPanel
              key={w.id}
              title={`W${w.number} summary · ${fmtShort(w.startDate)} – ${fmtShort(w.endDate)}`}
              s={w.summary}
              byEmployee={summarizeByEmployee(w.rows as AssignmentCalc[])}
            />
          ))}

          <section className="rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-4">
            <h2 className="text-lg font-bold">Monthly summary — {monthLabel(sel.month.year, sel.month.month)}</h2>
            <SummaryPanel
              title={`All weeks · ${fmtShort(sel.weeks[0].startDate)} – ${fmtShort(sel.weeks[sel.weeks.length - 1].endDate)}`}
              s={sel.monthSummary}
              byEmployee={summarizeByEmployee(sel.weeks.flatMap((w) => w.rows) as AssignmentCalc[])}
            />
          </section>
        </div>
      )}
    </div>
  );
}
