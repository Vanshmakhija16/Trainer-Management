"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "Dashboard" },
  { href: "/organizations", label: "Organizations" },
  { href: "/events", label: "Events" },
  { href: "/trainers", label: "Trainers" },
  { href: "/assignments", label: "Assignments" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="flex h-14 items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5 mr-2">
          <span className="grid size-7 place-items-center rounded-md bg-zinc-950 text-xs font-bold text-white">
            E
          </span>
          <span className="hidden text-sm font-semibold text-zinc-950 sm:block">
            Event Hub
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5 flex-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "px-3 py-1.5 rounded-md text-sm font-medium transition",
                  isActive
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/search"
            aria-label="Search"
            className="grid size-8 place-items-center rounded-md border border-zinc-200 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
          <Link
            href="/trainers/new"
            className="rounded-md bg-zinc-950 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            + Add Trainer
          </Link>
        </div>
      </div>
    </header>
  );
}
