"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "lucide-react";
import { extendWeek, addAssignment, deleteClient, deleteEmployee, deleteAssignment, setPayment, updateAssignment } from "@/app/actions";
import { fmtDay, fmtShort } from "@/lib/dates";
import { clientTotal, employeeTotal, inr, summarize, type AssignmentCalc } from "@/lib/calc";
import type { RowDTO } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/Combobox";
import { Confirm } from "@/components/Confirm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddClientDialog, AddEmployeeDialog } from "@/components/QuickAdd";
import { BulkReceived } from "@/components/BulkReceived";
import { SummaryPanel } from "@/components/SummaryPanel";

type Opt = { id: string; name: string };
type Week = { id: string; number: number; startDate: string; endDate: string };

const GRID =
  "lg:grid-cols-[minmax(150px,1.2fr)_minmax(150px,1.4fr)_70px_minmax(140px,1.1fr)_80px_64px_90px_110px_110px_44px]";

function days(start: string, end: string) {
  const out: Date[] = [];
  for (let d = new Date(start + "T00:00:00Z"); d <= new Date(end + "T00:00:00Z"); d = new Date(+d + 864e5)) out.push(d);
  return out;
}

export function WeekSection({
  week,
  rows: serverRows,
  clients,
  employees,
  readOnly,
  nextWeekDays,
}: {
  week: Week;
  rows: RowDTO[];
  clients: (Opt & { rate: number })[];
  employees: Opt[];
  readOnly: boolean;
  nextWeekDays: number | null; // null for the last week
}) {
  const [, start] = useTransition();
  const [rows, applyOpt] = useOptimistic(serverRows, (cur: RowDTO[], a: Opt2) => reduce(cur, a, clients, employees));
  const summary = summarize(rows as AssignmentCalc[]);
  const [removing, setRemoving] = useState<{ kind: "client" | "employee"; id: string; name: string } | null>(null);
  const [adding, setAdding] = useState<{ rowId: string; kind: "client" | "employee" } | null>(null);

  const run = (act: () => Promise<{ ok: boolean; error?: string }>, okMsg?: string, opt?: Opt2) =>
    start(async () => {
      if (opt) applyOpt(opt);
      const r = await act();
      if (!r.ok) toast.error(r.error ?? "Failed");
      else if (okMsg) toast.success(okMsg);
    });

  const dayList = days(week.startDate, week.endDate);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white">
        <div>
          <h1 className="text-3xl font-extrabold">W{week.number} — Week {week.number}</h1>
        <p className="text-sm text-slate-300">
          {fmtShort(dayList[0])} – {fmtShort(dayList[dayList.length - 1])} ({dayList.length} days)
        </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <div className="lg:min-w-[1150px]">
          <div className={cn("hidden gap-2 border-b bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-500 lg:grid", GRID)}>
            <span>Client</span><span>Report name</span><span>Received</span><span>Employee</span>
            <span>Rate ₹</span><span>Qty</span><span>Emp. total</span><span>Client pay</span><span>Employee pay</span><span />
          </div>

          {dayList.map((d) => {
            const iso = d.toISOString().slice(0, 10);
            const dayRows = rows.filter((r) => r.date === iso);
            return (
              <div key={iso} className="border-b last:border-b-0">
                <div className="flex items-center justify-between bg-slate-100/70 px-3 py-1.5">
                  <span className="text-sm font-semibold">{fmtDay(d)}</span>
                  {!readOnly && (
                    <Button size="sm" variant="ghost" className="h-8 text-emerald-700" onClick={() => run(() => addAssignment(week.id, iso))}>
                      <Plus /> Add Report Assignment
                    </Button>
                  )}
                </div>
                {dayRows.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No reports assigned</p>}
                {dayRows.map((r) => (
                  <Row
                    key={r.id}
                    row={r}
                    clients={clients}
                    employees={employees}
                    readOnly={readOnly}
                    onPatch={(patch) => run(() => updateAssignment(r.id, patch), undefined, { t: "patch", id: r.id, patch })}
                    onPay={(kind, paid) => run(() => setPayment(r.id, kind, paid), undefined, { t: "pay", id: r.id, kind, paid })}
                    onDelete={() => run(() => deleteAssignment(r.id), "Row deleted", { t: "del", id: r.id })}
                    onAdd={(kind) => setAdding({ rowId: r.id, kind })}
                    onRemove={(kind, o) => setRemoving({ kind, ...o })}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {!readOnly && nextWeekDays !== null && (
        <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
          {dayList.length > 1 && (
            <Button
              size="sm"
              variant="outline"
              className="h-10"
              onClick={() => run(() => extendWeek(week.id, -1), "Last day given back to next week")}
            >
              <Minus /> Give back last day
            </Button>
          )}
          {nextWeekDays > 1 && (
            <Button
              size="sm"
              className="h-10 bg-slate-900 hover:bg-slate-800"
              onClick={() => run(() => extendWeek(week.id, 1), "Added next week's first day to this week")}
            >
              <Plus /> Extend W{week.number} (add next week&apos;s first day)
            </Button>
          )}
        </div>
      )}

      <SummaryPanel
        title={`W${week.number} summary · ${fmtShort(dayList[0])} – ${fmtShort(dayList[dayList.length - 1])}`}
        s={summary}
        bulk={
          <BulkReceived
            scope={{ weekId: week.id }}
            reports={summary.reportsReceived}
            checked={rows.length > 0 && rows.every((r) => r.clientPaid >= r.clientTotal)}
            disabled={readOnly}
            onOptimistic={(paid) => applyOpt({ t: "bulk", paid })}
          />
        }
      />

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {removing?.kind} “{removing?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be removed from the dropdown. Past assignments keep their name and amounts, so your records and totals do not change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!removing) return;
                const { kind, id, name } = removing;
                run(() => (kind === "client" ? deleteClient(id) : deleteEmployee(id)), `${name} deleted`);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddClientDialog
        open={adding?.kind === "client"}
        onOpenChange={(o) => !o && setAdding(null)}
        onCreated={(id) => adding && run(() => updateAssignment(adding.rowId, { clientId: id }))}
      />
      <AddEmployeeDialog
        open={adding?.kind === "employee"}
        onOpenChange={(o) => !o && setAdding(null)}
        onCreated={(id) => adding && run(() => updateAssignment(adding.rowId, { employeeId: id }))}
      />
    </section>
  );
}

function Row({
  row,
  clients,
  employees,
  readOnly,
  onPatch,
  onPay,
  onDelete,
  onAdd,
  onRemove,
}: {
  row: RowDTO;
  clients: (Opt & { rate: number })[];
  employees: Opt[];
  readOnly: boolean;
  onPatch: (p: Record<string, unknown>) => void;
  onPay: (kind: "client" | "employee", paid: boolean) => void;
  onDelete: () => void;
  onAdd: (kind: "client" | "employee") => void;
  onRemove: (kind: "client" | "employee", o: Opt) => void;
}) {
  const [reportName, setReportName] = useState(row.reportName);
  const [received, setReceived] = useState(String(row.reportsReceived));
  const [cRate, setCRate] = useState(String(row.clientRate));
  const [eRate, setERate] = useState(String(row.employeeRate));
  const [qty, setQty] = useState(String(row.employeeQty));
  const sig = [row.reportName, row.reportsReceived, row.clientRate, row.employeeRate, row.employeeQty].join("|");
  const [lastSig, setLastSig] = useState(sig);
  if (sig !== lastSig) {
    setLastSig(sig);
    setReportName(row.reportName);
    setReceived(String(row.reportsReceived));
    setCRate(String(row.clientRate));
    setERate(String(row.employeeRate));
    setQty(String(row.employeeQty));
  }

  const commit = (key: string, val: string, orig: string | number) => {
    if (val !== String(orig)) onPatch({ [key]: val });
  };
  const num = "h-10 px-2 lg:h-9";
  const lbl = "mb-0.5 block text-[11px] font-medium uppercase text-slate-400 lg:hidden";

  const payBtn = (kind: "client" | "employee") => {
    const paid = kind === "client" ? row.clientPaid : row.employeePaid;
    const total = kind === "client" ? row.clientTotal : row.employeeTotal;
    const done = total > 0 && paid >= total;
    const partial = !done && paid > 0;
    const text = done ? (kind === "client" ? "Received" : "Paid") : partial ? `Partial ${inr(paid)}` : "Pending";
    return (
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onPay(kind, !done)}
        className={cn(
          "h-10 w-full rounded-lg border px-2 text-xs font-semibold lg:h-9",
          done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-orange-200 bg-orange-50 text-orange-700",
          readOnly && "cursor-default",
        )}
      >
        {text}
      </button>
    );
  };

  return (
    <div className={cn("grid grid-cols-2 items-end gap-2 border-t px-3 py-3 first:border-t-0 lg:items-center lg:py-2", GRID)}>
      <div className="col-span-2 lg:col-span-1">
        <span className={lbl}>Client</span>
        <Combobox
          options={clients}
          value={row.clientId}
          label={row.clientName}
          placeholder="Select client"
          addLabel="+ Add Client"
          disabled={readOnly}
          onSelect={(id) => onPatch({ clientId: id })}
          onAdd={() => onAdd("client")}
          onDelete={(o) => onRemove("client", o)}
        />
      </div>
      <div className="col-span-2 lg:col-span-1">
        <span className={lbl}>Report name</span>
        <Input
          className={num}
          value={reportName}
          disabled={readOnly}
          placeholder="Exact report name"
          onChange={(e) => setReportName(e.target.value)}
          onBlur={() => commit("reportName", reportName, row.reportName)}
        />
      </div>
      <div>
        <span className={lbl}>Reports received</span>
        <Input
          className={num}
          type="number"
          min={0}
          inputMode="numeric"
          value={received}
          disabled={readOnly}
          onChange={(e) => setReceived(e.target.value)}
          onBlur={() => commit("reportsReceived", received, row.reportsReceived)}
        />
      </div>
      <div className="col-span-2 lg:col-span-1">
        <span className={lbl}>Assigned employee</span>
        <Combobox
          options={employees}
          value={row.employeeId}
          label={row.employeeName}
          placeholder="Select employee"
          addLabel="+ Add Employee"
          disabled={readOnly}
          onSelect={(id) => onPatch({ employeeId: id })}
          onAdd={() => onAdd("employee")}
          onDelete={(o) => onRemove("employee", o)}
        />
      </div>
      <div>
        <span className={lbl}>Employee rate ₹</span>
        <Input
          className={num}
          type="number"
          min={0}
          inputMode="numeric"
          value={eRate}
          disabled={readOnly}
          onChange={(e) => setERate(e.target.value)}
          onBlur={() => commit("employeeRate", eRate, row.employeeRate)}
        />
      </div>
      <div>
        <span className={lbl}>Payment qty</span>
        <Input
          className={num}
          type="number"
          min={0}
          inputMode="numeric"
          value={qty}
          disabled={readOnly}
          onChange={(e) => setQty(e.target.value)}
          onBlur={() => commit("employeeQty", qty, row.employeeQty)}
        />
      </div>
      <div>
        <span className={lbl}>Employee total</span>
        <div className="text-sm font-semibold tabular-nums">{inr(row.employeeTotal)}</div>
      </div>
      <div>
        <span className={lbl}>Client payment · {inr(row.clientTotal)}</span>
        {payBtn("client")}
        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
          {inr(row.clientTotal)} @
          <Input
            className="h-6 w-16 px-1 text-xs"
            type="number"
            min={0}
            inputMode="numeric"
            value={cRate}
            disabled={readOnly}
            onChange={(e) => setCRate(e.target.value)}
            onBlur={() => commit("clientRate", cRate, row.clientRate)}
          />
        </div>
      </div>
      <div>
        <span className={lbl}>Employee payment</span>
        {payBtn("employee")}
      </div>
      <div className="col-span-2 flex justify-end lg:col-span-1">
        {!readOnly && (
          <Confirm
            title="Delete this assignment?"
            description="The row and its payment records will be removed."
            action="Delete"
            destructive
            onConfirm={onDelete}
          >
            <Button variant="ghost" size="icon" aria-label="Delete row" className="text-red-600">
              <Trash2 />
            </Button>
          </Confirm>
        )}
      </div>
    </div>
  );
}

type Opt2 =
  | { t: "pay"; id: string; kind: "client" | "employee"; paid: boolean }
  | { t: "bulk"; paid: boolean }
  | { t: "del"; id: string }
  | { t: "patch"; id: string; patch: Record<string, unknown> };

// Applies an edit to local rows immediately; the server result replaces it a moment later.
function reduce(cur: RowDTO[], a: Opt2, clients: (Opt & { rate: number })[], employees: Opt[]): RowDTO[] {
  if (a.t === "bulk") return cur.map((r) => ({ ...r, clientPaid: a.paid ? r.clientTotal : 0 }));
  if (a.t === "del") return cur.filter((r) => r.id !== a.id);
  return cur.map((r) => {
    if (r.id !== a.id) return r;
    if (a.t === "pay")
      return a.kind === "client"
        ? { ...r, clientPaid: a.paid ? r.clientTotal : 0 }
        : { ...r, employeePaid: a.paid ? r.employeeTotal : 0 };
    const p = a.patch;
    const n = { ...r };
    if (p.clientId !== undefined) {
      const c = clients.find((x) => x.id === p.clientId);
      n.clientId = c?.id ?? null;
      n.clientName = c?.name ?? "";
      if (c && p.clientRate === undefined) n.clientRate = c.rate;
    }
    if (p.employeeId !== undefined) {
      const e = employees.find((x) => x.id === p.employeeId);
      n.employeeId = e?.id ?? null;
      n.employeeName = e?.name ?? null;
    }
    if (p.reportName !== undefined) n.reportName = String(p.reportName);
    if (p.reportsReceived !== undefined) n.reportsReceived = Number(p.reportsReceived) || 0;
    if (p.clientRate !== undefined) n.clientRate = Number(p.clientRate) || 0;
    if (p.employeeRate !== undefined) n.employeeRate = Number(p.employeeRate) || 0;
    if (p.employeeQty !== undefined) n.employeeQty = Number(p.employeeQty) || 0;
    n.clientTotal = clientTotal(n.reportsReceived, n.clientRate);
    n.employeeTotal = employeeTotal(n.employeeRate, n.employeeQty);
    return n;
  });
}
