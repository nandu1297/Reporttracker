"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, LayoutDashboard, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new-month", label: "+ New Month", icon: PlusCircle },
  { href: "/recents", label: "Recents", icon: History },
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
              horizontal ? "min-h-11 flex-1 justify-center" : "min-h-10",
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
