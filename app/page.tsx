import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/money";
import {
  activityTypeLabels,
  eventStatusBadgeClasses,
  eventStatusLabels,
  eventTypeLabels,
} from "@/lib/status";

// Live, DB-backed dashboard — never statically prerendered.
export const dynamic = "force-dynamic";

const numberFormatter = new Intl.NumberFormat("en-IN");
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
      {label}
    </div>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const maxRevenue = Math.max(
    1,
    ...data.monthlyRevenue.map((m) => m.revenue),
  );

  const stats = [
    {
      label: "Organizations",
      value: numberFormatter.format(data.totals.organizations),
      accent: "bg-violet-500",
    },
    {
      label: "Trainers",
      value: numberFormatter.format(data.totals.trainers),
      accent: "bg-teal-500",
    },
    {
      label: "Total Events",
      value: numberFormatter.format(data.totals.events),
      accent: "bg-sky-500",
    },
    {
      label: "Revenue Generated",
      value: formatCurrency(data.totals.revenue),
      accent: "bg-emerald-500",
    },
    {
      label: "Upcoming Events",
      value: numberFormatter.format(data.totals.upcoming),
      accent: "bg-indigo-500",
    },
    {
      label: "Completed Events",
      value: numberFormatter.format(data.totals.completed),
      accent: "bg-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-teal-700">Dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            Organization & Event Overview
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Every event, trainer, and rupee of revenue across all organizations.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/events/new"
            className="inline-flex w-fit items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
          >
            Log Event
          </Link>
          <Link
            href="/organizations/new"
            className="inline-flex w-fit items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100"
          >
            Add Organization
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-zinc-950">
            Monthly Revenue
          </h3>
          <p className="mt-1 text-sm text-zinc-500">Last 6 months</p>
          <div className="mt-6 flex h-44 items-end gap-3">
            {data.monthlyRevenue.map((m) => (
              <div
                key={m.label}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-teal-600"
                    style={{
                      height: `${Math.round((m.revenue / maxRevenue) * 100)}%`,
                      minHeight: m.revenue > 0 ? "4px" : "0",
                    }}
                    title={formatCurrency(m.revenue)}
                  />
                </div>
                <span className="text-xs text-zinc-500">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-950">
              Most Active Trainers
            </h3>
            <Link href="/trainers" className="text-sm font-semibold text-teal-700">
              View all
            </Link>
          </div>
          <div className="mt-4 divide-y divide-zinc-100">
            {data.topTrainers.length ? (
              data.topTrainers.map((t) => (
                <Link
                  key={t.id}
                  href={`/trainers/${t.id}`}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {t.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {t.organizationsServed} orgs ·{" "}
                      {t.averageRating ? `${t.averageRating}★` : "no ratings"}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-zinc-700">
                    {t.totalEvents} events
                  </p>
                </Link>
              ))
            ) : (
              <EmptyState label="Trainer activity appears after events are logged with trainers." />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-950">
              Upcoming Events
            </h3>
            <Link href="/events" className="text-sm font-semibold text-teal-700">
              View all
            </Link>
          </div>
          <div className="mt-4 divide-y divide-zinc-100">
            {data.upcomingEvents.length ? (
              data.upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {event.title}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {event.organization.name} · {eventTypeLabels[event.eventType]}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-zinc-500">
                    {event.eventDate
                      ? dateFormatter.format(event.eventDate)
                      : "TBD"}
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState label="No upcoming events scheduled." />
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-zinc-950">
            Recent Activity
          </h3>
          <div className="mt-4 divide-y divide-zinc-100">
            {data.recentActivities.length ? (
              data.recentActivities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/events/${activity.event.id}`}
                  className="block py-3"
                >
                  <p className="text-sm font-medium text-zinc-900">
                    {activityTypeLabels[activity.activityType]}
                    <span className="font-normal text-zinc-500">
                      {" "}
                      · {activity.event.title}
                    </span>
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {activity.event.organization.name}
                  </p>
                </Link>
              ))
            ) : (
              <EmptyState label="Activity will show here as events progress." />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-zinc-950">Recent Events</h3>
        <div className="mt-4 divide-y divide-zinc-100">
          {data.recentEvents.length ? (
            data.recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {event.title}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {event.organization.name}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${eventStatusBadgeClasses[event.status]}`}
                >
                  {eventStatusLabels[event.status]}
                </span>
              </Link>
            ))
          ) : (
            <EmptyState label="No events logged yet." />
          )}
        </div>
      </section>

    </div>
  );
}

