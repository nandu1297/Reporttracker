"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

// Searchable dropdown with an "+ Add" entry pinned to the bottom.
export function Combobox({
  options,
  value,
  label,
  placeholder,
  addLabel,
  onSelect,
  onAdd,
  onDelete,
  disabled,
}: {
  options: Option[];
  value: string | null;
  label: string | null; // stored name, so renamed/removed records still display
  placeholder: string;
  addLabel: string;
  onSelect: (id: string | null) => void;
  onAdd: () => void;
  onDelete?: (option: Option) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const filtered = options.filter((o) => o.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setQ("");
          setOpen((o) => !o);
        }}
        className="flex h-10 w-full items-center justify-between gap-1 rounded-lg border bg-white px-3 text-left text-sm disabled:opacity-60 lg:h-9"
      >
        <span className={cn("truncate", !label && "text-slate-400")}>{label || placeholder}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-slate-400" />
      </button>
      {open && (
        <div className="absolute left-0 z-40 mt-1 w-full min-w-56 rounded-lg border bg-white shadow-lg">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-t-lg border-b px-3 py-2 text-sm outline-none"
          />
          <ul className="max-h-52 overflow-y-auto py-1">
            {value && (
              <li>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
                  onClick={() => {
                    onSelect(null);
                    setOpen(false);
                  }}
                >
                  Clear selection
                </button>
              </li>
            )}
            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">No matches</li>}
            {filtered.map((o) => (
              <li key={o.id} className="flex items-center hover:bg-slate-50">
                <button
                  type="button"
                  className={cn("min-w-0 flex-1 truncate px-3 py-2 text-left text-sm", o.id === value && "bg-emerald-50 font-medium")}
                  onClick={() => {
                    onSelect(o.id);
                    setOpen(false);
                  }}
                >
                  {o.name}
                </button>
                {onDelete && (
                  <button
                    type="button"
                    aria-label={`Delete ${o.name}`}
                    className="p-2 text-slate-400 hover:text-red-600"
                    onClick={() => {
                      setOpen(false);
                      onDelete(o);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="flex w-full items-center gap-1.5 rounded-b-lg border-t px-3 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            onClick={() => {
              setOpen(false);
              onAdd();
            }}
          >
            <Plus className="size-4" /> {addLabel}
          </button>
        </div>
      )}
    </div>
  );
}
