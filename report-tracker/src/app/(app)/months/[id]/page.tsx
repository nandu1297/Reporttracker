import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getMonthFull } from "@/lib/data";
import { fmtShort, monthLabel } from "@/lib/dates";
import { SummaryPanel } from "@/components/SummaryPanel";
import { WeekSection } from "@/components/WeekSection";
import { BulkReceived } from "@/components/BulkReceived";
import { MonthActions } from "@/components/MonthActions";
import { Badge } from "@/components/ui/badge";

export default async function MonthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [full, clients, employees] = await Promise.all([
    getMonthFull(id),
    db.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, rate: true } }),
    db.employee.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!full) notFound();
  const { month, weeks, monthSummary } = full;
  const archived = month.status === "COMPLETED";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">{monthLabel(month.year, month.month)}</h1>
            <p className="text-sm text-slate-500">
              {fmtShort(weeks[0].startDate)} – {fmtShort(weeks[3].endDate)}
            </p>
          </div>
          <Badge variant={archived ? "secondary" : "default"}>{archived ? "Archived" : "Active"}</Badge>
        </div>
        <MonthActions id={month.id} archived={archived} />
      </div>
      {archived && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          This month is archived and read-only. Use “Reopen to edit” to make changes.
        </div>
      )}

      {weeks.map((w) => (
        <WeekSection
          key={w.id}
          week={{ id: w.id, number: w.number, startDate: w.startDate.toISOString().slice(0, 10), endDate: w.endDate.toISOString().slice(0, 10) }}
          rows={w.rows}
          clients={clients}
          employees={employees}
          readOnly={archived}
          nextWeekDays={(() => {
            const n = weeks.find((x) => x.number === w.number + 1);
            return n ? Math.round((+n.endDate - +n.startDate) / 864e5) + 1 : null;
          })()}
        />
      ))}

      <section className="rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-4">
        <h2 className="text-lg font-bold">Monthly summary — {monthLabel(month.year, month.month)}</h2>
        <SummaryPanel
          title={`W1 + W2 + W3 + W4 · ${fmtShort(weeks[0].startDate)} – ${fmtShort(weeks[3].endDate)}`}
          s={monthSummary}
          bulk={
            <BulkReceived
              scope={{ monthId: month.id }}
              reports={monthSummary.reportsReceived}
              checked={weeks.some((w) => w.rows.length > 0) && weeks.every((w) => w.rows.every((r) => r.clientPaid >= r.clientTotal))}
              disabled={archived}
            />
          }
        />
        {!archived && (
          <div className="mt-4">
            <MonthActions id={month.id} archived={false} showComplete />
          </div>
        )}
      </section>
    </div>
  );
}
