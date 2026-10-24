"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteMonth, deleteOldMonths } from "@/app/actions";
import { KEEP_OPTIONS, monthsToPrune } from "@/lib/prune";
import { Button } from "@/components/ui/button";
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

type M = { id: string; label: string; year: number; month: number; status: string };

// Free up space: delete archived months older than the last N months.
export function DeleteOldData({ months, current }: { months: M[]; current: number }) {
  const router = useRouter();
  const [keep, setKeep] = useState<number>(3);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const doomed = monthsToPrune(months, keep, current);

  const confirm = () =>
    start(async () => {
      const r = await deleteOldMonths(keep);
      setOpen(false);
      if (!r.ok) return void toast.error(r.error);
      toast.success(`${r.deleted} ${r.deleted === 1 ? "month" : "months"} deleted`);
      router.push("/recents");
    });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3">
      <span className="text-sm font-medium text-slate-700">Delete old data — keep the last</span>
      <select
        value={keep}
        onChange={(e) => setKeep(Number(e.target.value))}
        className="h-10 rounded-lg border bg-white px-3 text-base font-medium lg:text-sm"
        aria-label="Months to keep"
      >
        {KEEP_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n} {n === 1 ? "month" : "months"}
          </option>
        ))}
      </select>
      <Button
        variant="outline"
        className="h-10 text-red-600"
        onClick={() => (doomed.length ? setOpen(true) : toast.info("Nothing older than that to delete"))}
      >
        <Trash2 /> Delete older
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {doomed.length} {doomed.length === 1 ? "month" : "months"} permanently?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Keeping the last {keep} {keep === 1 ? "month" : "months"} (this month included). These archived months, with all their
              assignments and payment records, will be deleted and cannot be recovered: {doomed.map((m) => m.label).join(", ")}.
              Active months are never deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={pending} onClick={confirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Delete the month currently selected on Recents.
export function DeleteMonthButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const remove = () =>
    start(async () => {
      const r = await deleteMonth(id);
      if (!r.ok) return void toast.error(r.error);
      toast.success(`${label} deleted`);
      router.push("/recents");
    });
  return (
    <Confirm
      title={`Delete ${label} permanently?`}
      description="All assignments and payment records in this month will be deleted. This cannot be undone."
      action="Delete month"
      destructive
      onConfirm={remove}
    >
      <Button variant="outline" className="h-10 text-red-600" disabled={pending}>
        <Trash2 /> Delete month
      </Button>
    </Confirm>
  );
}
