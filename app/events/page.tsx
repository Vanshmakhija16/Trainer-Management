import Link from "next/link";
import { getEvents } from "@/lib/events";
import { formatCurrency } from "@/lib/money";
import {
  eventStatusBadgeClasses,
  eventStatusLabels,
  eventStatuses,
  eventTypeLabels,
  eventTypes,
} from "@/lib/status";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const search = one(sp.search)?.trim() || undefined;
  const type = one(sp.type) || undefined;
  const status = one(sp.status) || undefined;

  const events = await getEvents({ search, type, status });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-teal-700">Events</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            All Events
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            {events.length} event{events.length === 1 ? "" : "s"} recorded.
          </p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
        >
          Log Event
        </Link>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto_auto]"
      >
        <input
          name="search"
          defaultValue={search}
          placeholder="Search title, venue, organization…"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
        <select
          name="type"
          defaultValue={type ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>
              {eventTypeLabels[t]}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {eventStatuses.map((s) => (
            <option key={s} value={s}>
              {eventStatusLabels[s]}
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

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        {events.length ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/events/${event.id}`}
                      className="font-semibold text-zinc-900 hover:text-teal-700"
                    >
                      {event.title}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {eventTypeLabels[event.eventType]}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    <Link
                      href={`/organizations/${event.organization.id}`}
                      className="hover:text-teal-700"
                    >
                      {event.organization.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {event.eventDate
                      ? dateFormatter.format(event.eventDate)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatCurrency(event.revenue)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${eventStatusBadgeClasses[event.status]}`}
                    >
                      {eventStatusLabels[event.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-zinc-500">
            No events match these filters.
          </div>
        )}
      </div>
    </div>
  );
}
