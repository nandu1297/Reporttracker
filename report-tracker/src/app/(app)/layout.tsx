import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { logout } from "@/app/auth-actions";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const authOn = !!process.env.APP_PASSWORD;
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-white p-4 lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="size-5 text-emerald-600" /> Report Tracker
        </Link>
        <Nav />
        {authOn && (
          <form action={logout} className="mt-auto">
            <button className="text-sm text-slate-500 hover:text-slate-900">Log out</button>
          </form>
        )}
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b bg-white p-3 lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <BarChart3 className="size-5 text-emerald-600" /> Report Tracker
            </Link>
            {authOn && (
              <form action={logout}>
                <button className="text-sm text-slate-500">Log out</button>
              </form>
            )}
          </div>
          <Nav horizontal />
        </header>
        <main className="mx-auto max-w-[1400px] p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
