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
    <header className="sticky top-0 z-50 bg-white border-b border-black/10 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📦</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Restocker</h1>
            <p className="text-xs text-slate-500">FreshMart Velachery</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  active 
                    ? "bg-slate-900 text-white shadow-md" 
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <button 
            onClick={logout} 
            className="ml-2 px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
