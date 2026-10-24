"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { deleteMonth, setMonthStatus } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/Confirm";

export function MonthActions({ id, archived, showComplete }: { id: string; archived: boolean; showComplete?: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const setStatus = (status: "ACTIVE" | "COMPLETED") =>
    start(async () => {
      const r = await setMonthStatus(id, status);
      if (!r.ok) return void toast.error(r.error);
      toast.success(status === "COMPLETED" ? "Month completed and moved to Recents" : "Month reopened");
      if (status === "COMPLETED") router.push("/recents");
    });

  const remove = () =>
    start(async () => {
      const r = await deleteMonth(id);
      if (!r.ok) return void toast.error(r.error);
      toast.success("Month deleted");
      router.push("/");
    });

  if (showComplete) {
    return (
      <Confirm
        title="Mark this month complete?"
        description="All data is kept. The month moves to Recents and becomes read-only until you reopen it."
        action="Mark complete"
        onConfirm={() => setStatus("COMPLETED")}
      >
        <Button disabled={pending} className="h-11 bg-emerald-600 hover:bg-emerald-700">
          <CheckCircle2 /> Mark Month Complete
        </Button>
      </Confirm>
    );
  }

  return (
    <div className="flex gap-2">
      {archived && (
        <Button variant="outline" className="h-10" disabled={pending} onClick={() => setStatus("ACTIVE")}>
          <RotateCcw /> Reopen to edit
        </Button>
      )}
      <Confirm
        title="Delete this month permanently?"
        description="All assignments and payment records in this month will be deleted. This cannot be undone."
        action="Delete month"
        destructive
        onConfirm={remove}
      >
        <Button variant="outline" className="h-10 text-red-600" disabled={pending}>
          <Trash2 /> Delete
        </Button>
      </Confirm>
    </div>
  );
}
