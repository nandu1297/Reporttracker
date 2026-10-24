import { inr, type Summary } from "@/lib/calc";
import { cn } from "@/lib/utils";

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "green" | "orange" | "plain" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          tone === "green" && "text-emerald-600",
          tone === "orange" && "text-orange-600",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      {children}
    </div>
  );
}

export function SummaryPanel({ title, s, bulk }: { title: string; s: Summary; bulk?: React.ReactNode }) {
  return (
    <section className="mt-3">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Group title="Reports">
          <Stat label="Total received" value={s.reportsReceived} />
          <Stat label="Assigned" value={s.reportsAssigned} tone="green" />
          <Stat label="Pending assignment" value={s.reportsPending} tone={s.reportsPending ? "orange" : "plain"} />
        </Group>
        <Group title="Client payment">
          <Stat label="Total amount" value={inr(s.clientAmount)} />
          <Stat label="Received" value={inr(s.clientReceived)} tone="green" />
          <Stat label="Pending" value={inr(s.clientPending)} tone={s.clientPending ? "orange" : "plain"} />
        </Group>
        <Group title="Employee payment">
          <Stat label="Total payment" value={inr(s.employeeTotal)} />
          <Stat label="Paid" value={inr(s.employeePaid)} tone="green" />
          <Stat label="Pending" value={inr(s.employeePending)} tone={s.employeePending ? "orange" : "plain"} />
        </Group>
        <Group title="Profit">
          <div className="py-2">
            <div className={cn("text-2xl font-bold tabular-nums", s.profit >= 0 ? "text-emerald-600" : "text-red-600")}>
              {inr(s.profit)}
            </div>
            <div className="text-xs text-slate-500">Client amount − employee payment</div>
          </div>
        </Group>
      </div>
      {bulk}
    </section>
  );
}

export function StatCard({ label, value, tone }: { label: string; value: string | number; tone?: "green" | "orange" }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          tone === "green" && "text-emerald-600",
          tone === "orange" && "text-orange-600",
        )}
      >
        {value}
      </div>
    </div>
  );
}
