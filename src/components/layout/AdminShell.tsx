"use client";

import { APP_NAME, COMPANY_LEGAL } from "@/lib/constants";
import { initials } from "@/lib/utils";
import type { SessionUser } from "@/types";
import { adminNav } from "@/components/layout/nav";
import { Menu, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { post } from "@/lib/client";

export function AdminShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await post("/api/auth/logout", {});
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-navy text-white lg:flex">
        <div className="px-6 pb-4 pt-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">Fiber Operations</p>
          <h1 className="mt-2 text-xl font-bold">{APP_NAME}</h1>
          <p className="mt-1 text-xs text-blue-100/70">{COMPANY_LEGAL}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
          {adminNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold ${
                  active ? "bg-white text-navy" : "text-blue-50 hover:bg-white/10"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-navy text-white">
          <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button className="rounded-2xl p-2 hover:bg-white/10 lg:hidden" onClick={() => setOpen((v) => !v)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <p className="text-sm font-bold">{APP_NAME}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-blue-100/70">Administrator</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-brand text-sm font-bold">
                {initials(user.name)}
              </div>
              <button onClick={logout} className="rounded-2xl p-2 hover:bg-white/10" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {open ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-navy p-4 text-white">
              {adminNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-3 py-3 text-sm font-semibold hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <main className="px-4 pb-28 pt-5 md:px-6 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
          {adminNav.slice(0, 5).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2 text-[11px] font-semibold ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.short}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
