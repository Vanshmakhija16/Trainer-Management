import Link from "next/link";

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
            Recruitment Operations
          </p>
          <p className="text-sm font-medium text-zinc-900">
            Trainer hiring and university placements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Search"
            title="Search"
            className="grid size-10 place-items-center rounded-lg border border-zinc-300 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
          <Link
            href="/trainers/new"
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
          >
            Add Trainer
          </Link>
        </div>
      </div>
    </header>
  );
}
