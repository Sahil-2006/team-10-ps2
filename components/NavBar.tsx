"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/purchase-orders", label: "Purchase Orders" },
];

export default function NavBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) return null;

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 md:px-6">
        <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          📦 Restocker
        </span>
        <span className="hidden text-sm text-slate-500 sm:inline">FreshMart Velachery</span>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 font-medium transition-all duration-200 ${
                  active 
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md" 
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <button onClick={logout} className="rounded-lg px-3 py-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium">
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
