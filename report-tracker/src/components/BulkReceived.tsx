"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setClientPaidBulk } from "@/app/actions";
import { cn } from "@/lib/utils";

export function BulkReceived({
  scope,
  checked,
  reports,
  disabled,
  onOptimistic,
}: {
  scope: { weekId: string } | { monthId: string };
  checked: boolean;
  reports: number;
  disabled?: boolean;
  onOptimistic?: (paid: boolean) => void;
}) {
  const [pending, start] = useTransition();

  const toggle = (next: boolean) =>
    start(async () => {
      onOptimistic?.(next);
      const r = await setClientPaidBulk(scope, next);
      if (!r.ok) toast.error(r.error);
      else toast.success(next ? "All client payments marked received" : "Client payments reset to pending");
    });

  return (
    <label
      className={cn(
        "mt-3 flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3",
        checked ? "border-emerald-300 bg-emerald-50" : "border-orange-200 bg-orange-50",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        type="checkbox"
        className="size-6 shrink-0 accent-emerald-600"
        checked={checked}
        disabled={disabled || pending || reports === 0}
        onChange={(e) => toggle(e.target.checked)}
      />
      <span className="text-base font-semibold">Received payment for all ({reports} reports)</span>
    </label>
  );
}
