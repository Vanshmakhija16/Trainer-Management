import Link from "next/link";
import { getOrganizations } from "@/lib/organizations";
import { formatCurrency } from "@/lib/money";
import {
  organizationTypeBadgeClasses,
  organizationTypeLabels,
  organizationTypes,
} from "@/lib/status";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const search = one(sp.search)?.trim() || undefined;
  const type = one(sp.type) || undefined;

  const organizations = await getOrganizations({ search, type });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-teal-700">Organizations</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            All Organizations
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            {organizations.length} organization
            {organizations.length === 1 ? "" : "s"} on record.
          </p>
        </div>
        <Link
          href="/organizations/new"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
        >
          Add Organization
        </Link>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto]"
      >
        <input
          name="search"
          defaultValue={search}
          placeholder="Search name, city, industry…"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
        <select
          name="type"
          defaultValue={type ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {organizationTypes.map((t) => (
            <option key={t} value={t}>
              {organizationTypeLabels[t]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Filter
        </button>
      </form>

      {organizations.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/organizations/${org.id}`}
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-semibold text-zinc-950">
                  {org.name}
                </p>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${organizationTypeBadgeClasses[org.type]}`}
                >
                  {organizationTypeLabels[org.type]}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {[org.city, org.industry].filter(Boolean).join(" · ") ||
                  "No location set"}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-zinc-400">Events</p>
                  <p className="font-semibold text-zinc-900">{org.eventCount}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Revenue</p>
                  <p className="font-semibold text-emerald-700">
                    {formatCurrency(org.revenue)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          No organizations match. Add your first one.
        </div>
      )}
    </div>
  );
}
