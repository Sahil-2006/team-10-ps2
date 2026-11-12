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
    <header className="sticky top-0 z-50 glass border-b border-slate-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-blue-500 opacity-20 rounded-full"></div>
              <span className="relative text-4xl">📦</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Restocker</h1>
              <p className="text-xs text-slate-400">FreshMart Velachery</p>
            </div>
          </div>
        </div>
        
        <nav className="flex items-center gap-2">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                  active 
                    ? "text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {active && (
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg"></span>
                )}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
          <button 
            onClick={logout} 
            className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 border border-slate-800 hover:border-red-500/30"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
