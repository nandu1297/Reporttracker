"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, LayoutDashboard, PlusCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new-month", label: "+ New Month", icon: PlusCircle },
  { href: "/recents", label: "Recents", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav({ horizontal = false }: { horizontal?: boolean }) {
  const path = usePathname();
  return (
    <nav className={cn("flex gap-1", horizontal ? "flex-row" : "flex-col")}>
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
              horizontal ? "min-h-12 min-w-0 flex-1 flex-col justify-center gap-0.5 px-1 text-[11px]" : "min-h-10",
              active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-100",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
