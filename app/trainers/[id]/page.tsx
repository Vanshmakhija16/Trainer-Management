import Link from "next/link";
import { notFound } from "next/navigation";
import { AvatarLightbox } from "@/app/_components/avatar-lightbox";
import { getTrainerById } from "@/lib/trainers";
import { statusBadgeClasses, statusLabels } from "@/lib/status";
import { deleteTrainer } from "../actions";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
});

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-900">{value || "—"}</dd>
    </div>
  );
}

export default async function TrainerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trainer = await getTrainerById(id);
  if (!trainer) notFound();

  const organizations = Array.from(
    new Map(
      trainer.assignments.map((a) => [a.organization.id, a.organization]),
    ).values(),
  );

  return (
    <div className="space-y-6">
      <Link href="/trainers" className="text-sm font-semibold text-teal-700">
        ← Back to trainers
      </Link>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
        {/* Left: large photo only */}
        <div className="lg:sticky lg:top-20">
          <AvatarLightbox
            name={trainer.name}
            src={trainer.photoUrl}
            rounded="rounded-2xl"
            className="aspect-square w-full text-7xl shadow-sm"
          />
        </div>

        {/* Right: everything else */}
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">
                {trainer.name}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                {trainer.primaryRole ?? "Trainer"} ·{" "}
                {trainer.experience ?? 0} yrs experience
              </p>
            </div>
            <div className="flex gap-2">
              {trainer.resumeUrl ? (
                <a
                  href={trainer.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
                >
                  View Resume
                </a>
              ) : null}
              <Link
                href={`/trainers/${trainer.id}/edit`}
                className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Edit
              </Link>
              <form action={deleteTrainer}>
                <input type="hidden" name="id" value={trainer.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-zinc-950">Details</h3>
            <dl className="mt-4 grid gap-5 sm:grid-cols-2">
          <Detail label="Email" value={trainer.email} />
          <Detail label="Phone" value={trainer.phone} />
          <Detail label="City" value={trainer.city} />
          <Detail
            label="LinkedIn"
            value={
              trainer.linkedin ? (
                <a
                  href={trainer.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 hover:underline"
                >
                  Profile
                </a>
              ) : null
            }
          />
          <Detail
            label="Industry Experience"
            value={
              trainer.industryExperience != null
                ? `${trainer.industryExperience} yrs`
                : null
            }
          />
          <Detail label="Charges / Day" value={trainer.expectedChargesPerDay} />
          <Detail label="Languages" value={trainer.languages} />
          <Detail label="Skills" value={trainer.skills} />
          <Detail
            label="Availability"
            value={trainer.availability.join(", ")}
          />
          <Detail
            label="Areas of Expertise"
            value={trainer.areasOfExpertise.join(", ")}
          />
          <Detail
            label="Training Types"
            value={trainer.trainingTypesDelivered.join(", ")}
          />
        </dl>
            {trainer.detailedExpertise ? (
              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Detailed Expertise
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">
                  {trainer.detailedExpertise}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-950">
              Assignment History
            </h3>
            <Link
              href={`/assignments?trainerId=${trainer.id}`}
              className="text-sm font-semibold text-teal-700"
            >
              Manage
            </Link>
          </div>
          <div className="mt-4 divide-y divide-zinc-100">
            {trainer.assignments.length ? (
              trainer.assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {a.organization.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {a.interviewDate
                        ? `Interview ${dateFormatter.format(a.interviewDate)}`
                        : `Added ${dateFormatter.format(a.createdAt)}`}
                      {a.remarks ? ` · ${a.remarks}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClasses[a.status]}`}
                  >
                    {statusLabels[a.status]}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-6 text-sm text-zinc-500">
                No assignments yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-zinc-950">Organizations</h3>
          <div className="mt-4 space-y-2">
            {organizations.length ? (
              organizations.map((o) => (
                <Link
                  key={o.id}
                  href={`/organizations/${o.id}`}
                  className="block rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                >
                  {o.name}
                </Link>
              ))
            ) : (
              <p className="text-sm text-zinc-500">None yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
