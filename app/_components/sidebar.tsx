"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "Dashboard", icon: "D" },
  { href: "/organizations", label: "Organizations", icon: "O" },
  { href: "/events", label: "Events", icon: "E" },
  { href: "/trainers", label: "Trainers", icon: "T" },
  { href: "/assignments", label: "Assignments", icon: "A" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-zinc-200 bg-white lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-zinc-200 px-6 py-5">
          <Link href="/" className="block">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              CRM
            </p>
            <h1 className="mt-1 text-xl font-semibold text-zinc-950">
              Event & Relationship Hub
            </h1>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-5">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid size-7 place-items-center rounded-md text-xs font-semibold",
                    isActive ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-500",
                  ].join(" ")}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
