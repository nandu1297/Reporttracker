"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createMonth } from "@/app/actions";
import { fmtShort, weekRanges } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const iso = (d: Date) => d.toISOString().slice(0, 10);
// Four full weeks: the last day is 27 days after the first.
const fourWeeksEnd = (from: string) => {
  const d = new Date(from + "T00:00:00Z");
  return isNaN(+d) ? "" : iso(new Date(+d + 27 * 864e5));
};

export function NewMonthForm() {
  const now = new Date();
  const [start, setStart] = useState(iso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))));
  const [end, setEnd] = useState(fourWeeksEnd(start));
  const [pending, startT] = useTransition();
  const router = useRouter();

  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  const days = Math.round((+e - +s) / 864e5) + 1;
  const valid = !isNaN(+s) && !isNaN(+e) && days >= 4 && days <= 62;
  const weeks = valid ? weekRanges(s, e) : [];

  const submit = () =>
    startT(async () => {
      const r = await createMonth({ startDate: start, endDate: end });
      if (!r.ok) return void toast.error(r.error);
      toast.success("Month created");
      router.push(`/months/${r.id}`);
    });

  return (
    <div className="space-y-4 rounded-xl border bg-white p-5">
      <div className="space-y-1.5">
        <Label>From date</Label>
        <Input type="date" className="h-11" value={start} onChange={(ev) => {
            setStart(ev.target.value);
            setEnd(fourWeeksEnd(ev.target.value));
          }} />
      </div>
      <div className="space-y-1.5">
        <Label>To date</Label>
        <Input type="date" className="h-11" value={end} onChange={(ev) => setEnd(ev.target.value)} />
      </div>

      {valid ? (
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="mb-1 font-medium">{days} days split into 4 weeks</p>
          {weeks.map((w) => (
            <div key={w.number} className="flex justify-between py-0.5 text-slate-600">
              <span className="font-medium text-slate-900">W{w.number}</span>
              <span>
                {fmtShort(w.startDate)} – {fmtShort(w.endDate)} ({Math.round((+w.endDate - +w.startDate) / 864e5) + 1} days)
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-red-600">Pick dates covering 4 to 62 days.</p>
      )}

      <Button className="h-11 w-full" onClick={submit} disabled={pending || !valid}>
        {pending ? "Creating…" : "Create month"}
      </Button>
    </div>
  );
}
