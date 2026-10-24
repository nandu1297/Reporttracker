"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string; isSelf?: boolean };

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
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; list: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // The list is drawn in a portal so the table's scroll box can't clip it; it flips upward when space below is short.
  const place = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom;
    const up = below < 340 && r.top > below;
    // Shrink the list on short screens so the search box and "+ Add" stay reachable.
    const room = (up ? r.top : below) - 16;
    const list = Math.max(96, Math.min(208, room - 100));
    setPos({ left: r.left, width: r.width, list, ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }) });
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false);
    };
    // Keep the list attached to its field. Closing here would shut it instantly on phones, where the keyboard scrolls the page.
    const onScroll = (e: Event) => {
      if (!popRef.current?.contains(e.target as Node)) place();
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  const filtered = options.filter((o) => o.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setQ("");
          place();
          setOpen((o) => !o);
        }}
        className="flex h-10 w-full items-center justify-between gap-1 rounded-lg border bg-white px-3 text-left text-sm disabled:opacity-60 lg:h-9"
      >
        <span className={cn("truncate", !label && "text-slate-400")}>{label || placeholder}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-slate-400" />
      </button>
      {open && pos && createPortal(
        <div
          ref={popRef}
          style={{ position: "fixed", left: pos.left, top: pos.top, bottom: pos.bottom, width: Math.max(pos.width, 224) }}
          className="z-50 rounded-lg border bg-white shadow-lg"
        >
          <input
            // No autofocus on touch screens: the keyboard would cover the list.
            autoFocus={!window.matchMedia("(pointer: coarse)").matches}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-t-lg border-b px-3 py-2 text-base outline-none lg:text-sm"
          />
          <ul style={{ maxHeight: pos.list }} className="overflow-y-auto overscroll-contain py-1">
            {value && (
              <li>
                <button
                  type="button"
                  className="w-full px-3 py-3 text-left text-sm text-slate-500 hover:bg-slate-50 lg:py-2"
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
                  className={cn("min-w-0 flex-1 truncate px-3 py-3 text-left text-base lg:py-2 lg:text-sm", o.id === value && "bg-emerald-50 font-medium")}
                  onClick={() => {
                    onSelect(o.id);
                    setOpen(false);
                  }}
                >
                  {o.name}
                </button>
                {onDelete && !o.isSelf && (
                  <button
                    type="button"
                    aria-label={`Delete ${o.name}`}
                    className="p-3 text-slate-400 hover:text-red-600 lg:p-2"
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
        </div>,
        document.body,
      )}
    </div>
  );
}
