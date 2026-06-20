import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventProfile } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/money";
import {
  activityTypeLabels,
  activityTypes,
  documentTypeLabels,
  eventStatusBadgeClasses,
  eventStatusLabels,
  eventTrainerRoleLabels,
  eventTrainerRoles,
  eventTypeLabels,
} from "@/lib/status";
import {
  addActivity,
  addEventTrainer,
  deleteEvent,
  removeEventTrainer,
} from "../actions";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const inputClass =
  "rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-teal-600";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  );
}

export default async function EventProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, allTrainers] = await Promise.all([
    getEventProfile(id),
    prisma.trainer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!event) notFound();

  const assignedIds = new Set(event.trainers.map((t) => t.trainerId));
  const availableTrainers = allTrainers.filter((t) => !assignedIds.has(t.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Link href="/events" className="text-sm font-semibold text-teal-700">
            ← Back to events
          </Link>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            {event.title}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {eventTypeLabels[event.eventType]} ·{" "}
            <Link
              href={`/organizations/${event.organization.id}`}
              className="text-teal-700 hover:underline"
            >
              {event.organization.name}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${eventStatusBadgeClasses[event.status]}`}
          >
            {eventStatusLabels[event.status]}
          </span>
          <form action={deleteEvent}>
            <input type="hidden" name="id" value={event.id} />
            <button
              type="submit"
              className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      {/* Core info */}
      <section className="grid gap-5 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:grid-cols-3 xl:grid-cols-4">
        <Detail
          label="Date"
          value={
            event.eventDate
              ? event.endDate &&
                event.endDate.getTime() !== event.eventDate.getTime()
                ? `${dateFormatter.format(event.eventDate)} – ${dateFormatter.format(event.endDate)}`
                : dateFormatter.format(event.eventDate)
              : "—"
          }
        />
        <Detail
          label="Time"
          value={
            [event.startTime, event.endTime].filter(Boolean).join(" – ") || "—"
          }
        />
        <Detail label="Venue" value={event.venue ?? "—"} />
        <Detail
          label="Participants"
          value={
            event.actualParticipants != null
              ? `${event.actualParticipants}${event.expectedParticipants ? ` / ${event.expectedParticipants}` : ""}`
              : event.expectedParticipants != null
                ? `~${event.expectedParticipants} expected`
                : "—"
          }
        />
        <Detail label="Revenue" value={formatCurrency(event.revenue)} />
        <Detail label="Expenses" value={formatCurrency(event.expenses)} />
        <Detail label="Profit" value={formatCurrency(event.profit)} />
        <Detail
          label="Feedback"
          value={event.feedbackRating != null ? `${event.feedbackRating}★` : "—"}
        />
        <Detail label="Lead Source" value={event.leadSource ?? "—"} />
        <Detail label="Lead Owner" value={event.leadOwner ?? "—"} />
        <Detail
          label="Host"
          value={
            [event.hostName, event.hostPhone].filter(Boolean).join(" · ") || "—"
          }
        />
      </section>

      {(event.description || event.clientFeedback || event.internalNotes) && (
        <section className="grid gap-4 lg:grid-cols-3">
          {event.description ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-950">Description</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">
                {event.description}
              </p>
            </div>
          ) : null}
          {event.clientFeedback ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-950">
                Client Feedback
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">
                {event.clientFeedback}
              </p>
            </div>
          ) : null}
          {event.internalNotes ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-950">
                Internal Notes
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">
                {event.internalNotes}
              </p>
            </div>
          ) : null}
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Trainers */}
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-zinc-950">Trainers</h3>
          <div className="mt-4 space-y-2">
            {event.trainers.length ? (
              event.trainers.map((et) => (
                <div
                  key={et.id}
                  className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/trainers/${et.trainer.id}`}
                      className="text-sm font-semibold text-zinc-900 hover:text-teal-700"
                    >
                      {et.trainer.name}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {eventTrainerRoleLabels[et.role]}
                      {et.payout != null
                        ? ` · ${formatCurrency(et.payout)}`
                        : ""}
                    </p>
                  </div>
                  <form action={removeEventTrainer}>
                    <input type="hidden" name="id" value={et.id} />
                    <input type="hidden" name="eventId" value={event.id} />
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
              <p className="text-sm text-zinc-500">No trainers assigned yet.</p>
            )}
          </div>

          {availableTrainers.length ? (
            <form
              action={addEventTrainer}
              className="mt-4 grid gap-2 border-t border-zinc-100 pt-4 sm:grid-cols-[1fr_auto_auto_auto]"
            >
              <input type="hidden" name="eventId" value={event.id} />
              <select name="trainerId" required className={inputClass}>
                <option value="" disabled>
                  Select trainer
                </option>
                {availableTrainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <select name="role" defaultValue="LEAD" className={inputClass}>
                {eventTrainerRoles.map((r) => (
                  <option key={r} value={r}>
                    {eventTrainerRoleLabels[r]}
                  </option>
                ))}
              </select>
              <input
                name="payout"
                type="number"
                min="0"
                step="0.01"
                placeholder="Payout"
                className={`${inputClass} w-28`}
              />
              <button
                type="submit"
                className="rounded-md bg-zinc-950 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Add
              </button>
            </form>
          ) : null}
        </section>

        {/* Documents */}
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-zinc-950">Documents</h3>
          <div className="mt-4 space-y-2">
            {event.documents.length ? (
              event.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm transition hover:bg-zinc-50"
                >
                  <span className="truncate font-medium text-zinc-800">
                    {doc.fileName}
                  </span>
                  <span className="ml-3 shrink-0 text-xs text-zinc-500">
                    {documentTypeLabels[doc.documentType]}
                  </span>
                </a>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No documents uploaded yet.</p>
            )}
          </div>
        </section>
      </div>

      {/* Timeline */}
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-zinc-950">
          Activity Timeline
        </h3>

        <form
          action={addActivity}
          className="mt-4 grid gap-2 sm:grid-cols-[auto_1fr_auto]"
        >
          <input type="hidden" name="eventId" value={event.id} />
          <select name="activityType" defaultValue="NOTE" className={inputClass}>
            {activityTypes.map((a) => (
              <option key={a} value={a}>
                {activityTypeLabels[a]}
              </option>
            ))}
          </select>
          <input
            name="description"
            placeholder="What happened?"
            className={inputClass}
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-950 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Add
          </button>
        </form>

        <ol className="mt-5 space-y-4 border-l border-zinc-200 pl-4">
          {event.activities.length ? (
            event.activities.map((activity) => (
              <li key={activity.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-teal-500" />
                <p className="text-sm font-medium text-zinc-900">
                  {activityTypeLabels[activity.activityType]}
                </p>
                {activity.description ? (
                  <p className="text-sm text-zinc-600">{activity.description}</p>
                ) : null}
                <p className="text-xs text-zinc-400">
                  {dateTimeFormatter.format(activity.createdAt)}
                  {activity.createdBy ? ` · ${activity.createdBy}` : ""}
                </p>
              </li>
            ))
          ) : (
            <li className="text-sm text-zinc-500">No activity yet.</li>
          )}
        </ol>
      </section>
    </div>
  );
}
