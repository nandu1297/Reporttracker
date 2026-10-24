import Link from "next/link";
import { db } from "@/lib/db";
import { inr, summarize } from "@/lib/calc";
import { fmtShort } from "@/lib/dates";
import { resolveRange } from "@/lib/range";
import { StatCard } from "@/components/SummaryPanel";
import { RangeFilter } from "@/components/RangeFilter";
import { Button } from "@/components/ui/button";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const r = resolveRange(sp.range, sp.from, sp.to);

  const [rows, activeMonth] = await Promise.all([
    db.assignment.findMany({
      relationLoadStrategy: "join",
      where: r.start && r.end ? { date: { gte: r.start, lte: r.end } } : {},
      include: { clientPayments: true, employeePayments: true },
    }),
    db.month.findFirst({ where: { status: "ACTIVE" }, orderBy: [{ year: "desc" }, { month: "desc" }] }),
  ]);

  const s = summarize(
    rows.map((a) => ({
      reportsReceived: a.reportsReceived,
      clientTotal: a.clientTotal,
      employeeId: a.employeeId,
      employeeName: a.employeeName,
      employeeTotal: a.employeeTotal,
      clientPaid: a.clientPayments.reduce((x, p) => x + p.amount, 0),
      employeePaid: a.employeePayments.reduce((x, p) => x + p.amount, 0),
    })),
  );
  const netProfit = s.clientReceived - s.employeePaid;
  const pct = s.reportsReceived ? Math.round((s.reportsAssigned / s.reportsReceived) * 100) : 0;
  const label =
    r.start && r.end
      ? `${fmtShort(r.start)} ${r.start.getUTCFullYear()} – ${fmtShort(r.end)} ${r.end.getUTCFullYear()}`
      : "All records";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RangeFilter range={r.key} from={r.from} to={r.to} />
          {activeMonth && (
            <Button
              nativeButton={false}
              render={<Link href={`/months/${activeMonth.id}`} />}
              variant="outline"
              className="h-11"
            >
              Open tracker
            </Button>
          )}
        </div>
      </div>

      {rows.length === 0 && (
        <div className="rounded-xl border bg-white p-6 text-center text-slate-600">
          No records in this range.{" "}
          {!activeMonth && (
            <Link href="/new-month" className="font-medium text-emerald-700 underline">
              Create a month
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Reports received" value={s.reportsReceived} />
        <StatCard label="Revenue collected" value={inr(s.clientReceived)} tone="green" />
        <StatCard label="Paid to employees" value={inr(s.employeePaid)} tone="orange" />
        <StatCard label="Net profit" value={inr(netProfit)} tone={netProfit >= 0 ? "green" : "orange"} />
      </div>
      <p className="-mt-3 text-xs text-slate-500">Net profit = revenue collected − paid to employees, for work dated in this period.</p>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium">
            Assignment progress ({s.reportsAssigned} of {s.reportsReceived} reports assigned)
          </span>
          <span className="tabular-nums text-slate-600">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Client payments</h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total" value={inr(s.clientAmount)} />
            <StatCard label="Received" value={inr(s.clientReceived)} tone="green" />
            <StatCard label="Pending" value={inr(s.clientPending)} tone={s.clientPending ? "orange" : undefined} />
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Employee payments</h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total" value={inr(s.employeeTotal)} />
            <StatCard label="Paid" value={inr(s.employeePaid)} tone="green" />
            <StatCard label="Pending" value={inr(s.employeePending)} tone={s.employeePending ? "orange" : undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}
