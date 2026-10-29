"use client";

import { useState } from "react";
import { countByStatus } from "@/lib/calc";
import type { RowDTO } from "@/lib/data";
import { REPORT_STATUSES, STATUS_LABEL, type ReportStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

export function StatusBreakdown({ rows }: { rows: RowDTO[] }) {
  const [open, setOpen] = useState<ReportStatus | null>(null);
  const counts = countByStatus(rows);
  const list = open ? rows.filter((r) => r.status === open) : [];

  return (
    <div className="mt-3 rounded-lg border bg-white p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</h4>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {REPORT_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setOpen(open === s ? null : s)}
            aria-pressed={open === s}
            className={cn(
              "rounded-lg border px-3 py-2 text-left transition-colors hover:bg-slate-50",
              open === s && "border-slate-900 bg-slate-50",
            )}
          >
            <div className="text-xs text-slate-600">{STATUS_LABEL[s]}</div>
            <div className="text-xl font-bold tabular-nums">{counts[s]}</div>
          </button>
        ))}
      </div>

      {open && (
        <div className="mt-3 overflow-x-auto">
          <h5 className="mb-1 text-sm font-semibold">
            {STATUS_LABEL[open]} · {counts[open]} {counts[open] === 1 ? "report" : "reports"}
          </h5>
          {list.length === 0 ? (
            <p className="py-2 text-sm text-slate-400">No reports in this status</p>
          ) : (
            <>
            <ul className="divide-y sm:hidden">
              {list.map((r) => (
                <li key={r.id} className="py-2 text-sm">
                  <div className="font-medium">{r.clientName || "—"}</div>
                  <div className="text-slate-600">{r.reportName || "—"}</div>
                  <div className="mt-0.5 flex justify-between text-xs text-slate-500">
                    <span>{r.employeeName ?? "Unassigned"}</span>
                    <span>{STATUS_LABEL[r.status]}</span>
                  </div>
                </li>
              ))}
            </ul>
            <table className="hidden w-full text-sm sm:table">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="py-1 font-medium">Client name</th>
                  <th className="py-1 font-medium">Report name</th>
                  <th className="py-1 font-medium">Assigned employee</th>
                  <th className="py-1 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-1.5 font-medium">{r.clientName || "—"}</td>
                    <td className="py-1.5">{r.reportName || "—"}</td>
                    <td className="py-1.5">{r.employeeName ?? "Unassigned"}</td>
                    <td className="py-1.5">{STATUS_LABEL[r.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
