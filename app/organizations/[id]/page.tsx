import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrganizationProfile } from "@/lib/organizations";
import { formatCurrency } from "@/lib/money";
import {
  eventStatusBadgeClasses,
  eventStatusLabels,
  eventTypeLabels,
  organizationTypeLabels,
} from "@/lib/status";
import { addContact, deleteContact, deleteOrganization } from "../actions";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const inputClass =
  "rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-teal-600";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

export default async function OrganizationProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getOrganizationProfile(id);
  if (!data) notFound();

  const { organization: org, stats, trainerHistory } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Link
            href="/organizations"
            className="text-sm font-semibold text-teal-700"
          >
            ← Back to organizations
          </Link>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            {org.name}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {organizationTypeLabels[org.type]}
            {org.city ? ` · ${org.city}` : ""}
            {org.industry ? ` · ${org.industry}` : ""}
          </p>
          {org.website ? (
            <a
              href={org.website}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm text-teal-700 hover:underline"
            >
              {org.website}
            </a>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/events/new?organizationId=${org.id}`}
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Log Event
          </Link>
          <form action={deleteOrganization}>
            <input type="hidden" name="id" value={org.id} />
            <button
              type="submit"
              className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Events" value={String(stats.totalEvents)} />
        <StatCard
          label="Revenue Generated"
          value={formatCurrency(stats.totalRevenue)}
        />
        <StatCard label="Profit" value={formatCurrency(stats.totalProfit)} />
        <StatCard label="Success Rate" value={`${stats.successRate}%`} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        {/* Events */}
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-4 py-3">
            <h3 className="text-base font-semibold text-zinc-950">
              Event History
            </h3>
          </div>
          {org.events.length ? (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Trainers</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {org.events.map((event) => (
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
                      {event.eventDate
                        ? dateFormatter.format(event.eventDate)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {event.trainers.length
                        ? event.trainers
                            .map((t) => t.trainer.name)
                            .join(", ")
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
            <p className="px-6 py-10 text-center text-sm text-zinc-500">
              No events recorded yet.
            </p>
          )}
        </section>

        {/* Trainer history */}
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-zinc-950">
            Most Active Trainers
          </h3>
          <div className="mt-4 space-y-2">
            {trainerHistory.length ? (
              trainerHistory.map((t) => (
                <Link
                  key={t.id}
                  href={`/trainers/${t.id}`}
                  className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm transition hover:bg-zinc-50"
                >
                  <span className="font-medium text-zinc-800">{t.name}</span>
                  <span className="text-xs text-zinc-500">{t.events} events</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No trainer history yet.</p>
            )}
          </div>
        </section>
      </div>

      {/* Contacts */}
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-zinc-950">Contacts</h3>
        <div className="mt-4 space-y-2">
          {org.contacts.length ? (
            org.contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">
                    {contact.name}
                    {contact.designation ? (
                      <span className="font-normal text-zinc-500">
                        {" "}
                        · {contact.designation}
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {[contact.phone, contact.email]
                      .filter(Boolean)
                      .join(" · ") || "No contact details"}
                  </p>
                </div>
                <form action={deleteContact}>
                  <input type="hidden" name="id" value={contact.id} />
                  <input type="hidden" name="organizationId" value={org.id} />
                  <button
                    type="submit"
                    className="text-xs font-semibold text-rose-700 hover:underline"
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500">No contacts added yet.</p>
          )}
        </div>

        <form
          action={addContact}
          className="mt-4 grid gap-2 border-t border-zinc-100 pt-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <input type="hidden" name="organizationId" value={org.id} />
          <input name="name" required placeholder="Name" className={inputClass} />
          <input
            name="designation"
            placeholder="Designation (e.g. TPO)"
            className={inputClass}
          />
          <input name="phone" placeholder="Phone" className={inputClass} />
          <input name="email" placeholder="Email" className={inputClass} />
          <button
            type="submit"
            className="rounded-md bg-zinc-950 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Add Contact
          </button>
        </form>
      </section>

      {org.notes ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-zinc-950">Notes</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">
            {org.notes}
          </p>
        </section>
      ) : null}
    </div>
  );
}
