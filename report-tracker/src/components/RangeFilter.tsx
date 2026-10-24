"use client";

import { useRouter } from "next/navigation";
import { PRESETS } from "@/lib/range";
import { Input } from "@/components/ui/input";

export function RangeFilter({ range, from, to }: { range: string; from: string; to: string }) {
  const router = useRouter();
  const go = (r: string, f?: string, t?: string) => {
    const q = new URLSearchParams({ range: r });
    if (r === "custom") {
      if (f) q.set("from", f);
      if (t) q.set("to", t);
    }
    router.push(`/?${q}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={range}
        onChange={(e) => go(e.target.value, from, to)}
        className="h-11 rounded-lg border bg-white px-3 text-base font-medium lg:text-sm"
        aria-label="Date range"
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      {range === "custom" && (
        <>
          <Input type="date" className="h-11 w-auto" value={from} onChange={(e) => go("custom", e.target.value, to)} aria-label="From date" />
          <span className="text-slate-500">to</span>
          <Input type="date" className="h-11 w-auto" value={to} onChange={(e) => go("custom", from, e.target.value)} aria-label="To date" />
        </>
      )}
    </div>
  );
}
