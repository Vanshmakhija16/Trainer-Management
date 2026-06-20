import Link from "next/link";
import { globalSearch } from "@/lib/search";
import { organizationTypeLabels } from "@/lib/status";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function ResultGroup({
  title,
  children,
  count,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
        <span className="text-xs font-medium text-zinc-500">{count}</span>
      </div>
      <div className="mt-3 divide-y divide-zinc-100">{children}</div>
    </section>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = one(sp.q)?.trim() ?? "";
  const results = await globalSearch(q);

  const total =
    results.organizations.length +
    results.events.length +
    results.trainers.length +
    results.contacts.length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700">Search</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
          Global Search
        </h2>
      </div>

      <form method="get">
        <input
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Search organizations, events, trainers, contacts…"
          className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
      </form>

      {q ? (
        total ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <ResultGroup title="Organizations" count={results.organizations.length}>
              {results.organizations.map((o) => (
                <Link
                  key={o.id}
                  href={`/organizations/${o.id}`}
                  className="block py-2.5"
                >
                  <p className="text-sm font-semibold text-zinc-900">{o.name}</p>
                  <p className="text-xs text-zinc-500">
                    {organizationTypeLabels[o.type]}
                    {o.city ? ` · ${o.city}` : ""}
                  </p>
                </Link>
              ))}
            </ResultGroup>

            <ResultGroup title="Events" count={results.events.length}>
              {results.events.map((e) => (
                <Link key={e.id} href={`/events/${e.id}`} className="block py-2.5">
                  <p className="text-sm font-semibold text-zinc-900">{e.title}</p>
                  <p className="text-xs text-zinc-500">{e.organization.name}</p>
                </Link>
              ))}
            </ResultGroup>

            <ResultGroup title="Trainers" count={results.trainers.length}>
              {results.trainers.map((t) => (
                <Link
                  key={t.id}
                  href={`/trainers/${t.id}`}
                  className="block py-2.5"
                >
                  <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                  <p className="text-xs text-zinc-500">
                    {[t.city, t.email].filter(Boolean).join(" · ") || "—"}
                  </p>
                </Link>
              ))}
            </ResultGroup>

            <ResultGroup title="Contacts" count={results.contacts.length}>
              {results.contacts.map((c) => (
                <Link
                  key={c.id}
                  href={`/organizations/${c.organization.id}`}
                  className="block py-2.5"
                >
                  <p className="text-sm font-semibold text-zinc-900">{c.name}</p>
                  <p className="text-xs text-zinc-500">
                    {[c.designation, c.organization.name]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </Link>
              ))}
            </ResultGroup>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
            No results for “{q}”.
          </div>
        )
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          Type to search across the whole platform.
        </div>
      )}
    </div>
  );
}
