"use client";

import { useRouter } from "next/navigation";

export function MonthPicker({ value, options }: { value: string; options: { id: string; label: string }[] }) {
  const router = useRouter();
  return (
    <select
      value={value}
      onChange={(e) => router.push(e.target.value ? `/recents?month=${e.target.value}` : "/recents")}
      className="h-11 rounded-lg border bg-white px-3 text-base font-medium lg:text-sm"
      aria-label="Select month"
    >
      <option value="">Select a month…</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
