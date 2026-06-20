import Link from "next/link";
import type { AssignmentStatus } from "@/app/generated/prisma/enums";
import { AvatarLightbox } from "@/app/_components/avatar-lightbox";
import { getTrainerCities, getTrainers, PAGE_SIZE } from "@/lib/trainers";
import { prisma } from "@/lib/prisma";
import {
  assignmentStatuses,
  statusDotClasses,
  statusLabels,
} from "@/lib/status";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildQueryString(
  base: Record<string, string | undefined>,
  overrides: Record<string, string | number | undefined>,
) {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== "" && value !== null) {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export default async function TrainersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const search = one(sp.search)?.trim() || undefined;
  const city = one(sp.city) || undefined;
  const status = (one(sp.status) as AssignmentStatus | undefined) || undefined;
  const organizationId =
    one(sp.organizationId) || one(sp.universityId) || undefined;
  const minExperienceRaw = one(sp.minExperience);
  const minExperience = minExperienceRaw ? Number(minExperienceRaw) : undefined;
  const sort = (one(sp.sort) as "recent" | "name" | "experience") || "recent";
  const page = Number(one(sp.page)) || 1;

  const [{ trainers, total, pageCount }, cities, organizations] =
    await Promise.all([
      getTrainers({
        page,
        search,
        city,
        status,
        organizationId,
        minExperience: Number.isFinite(minExperience) ? minExperience : undefined,
        sort,
      }),
      getTrainerCities(),
      prisma.organization.findMany({ orderBy: { name: "asc" } }),
    ]);

  const baseQuery = {
    search,
    city,
    status,
    organizationId,
    minExperience: minExperienceRaw || undefined,
    sort,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-teal-700">Trainers</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            All Trainers
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            {total} trainer{total === 1 ? "" : "s"} in the pipeline.
          </p>
        </div>
        <Link
          href="/trainers/new"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
        >
          Add Trainer
        </Link>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-6"
      >
        <input
          name="search"
          defaultValue={search}
          placeholder="Search name, email, skills…"
          className="md:col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
        <select
          name="city"
          defaultValue={city ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {assignmentStatuses.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
        <select
          name="organizationId"
          defaultValue={organizationId ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">All organizations</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <input
          name="minExperience"
          type="number"
          min="0"
          defaultValue={minExperienceRaw}
          placeholder="Min exp (yrs)"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <div className="flex gap-2 md:col-span-6">
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="recent">Most recent</option>
            <option value="name">Name (A–Z)</option>
            <option value="experience">Experience (high–low)</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Apply
          </button>
          <Link
            href="/trainers"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
          >
            Reset
          </Link>
        </div>
      </form>

      {trainers.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {trainers.map((trainer) => {
            const latest = trainer.assignments[0];
            return (
              <div
                key={trainer.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg"
              >
                {/* Stretched overlay link — whole card navigates to the profile.
                    Sits below the avatar/actions so those stay interactive. */}
                <Link
                  href={`/trainers/${trainer.id}`}
                  aria-label={`Open ${trainer.name}'s profile`}
                  className="absolute inset-0 z-0"
                />

                {/* Tinted header band gives the photo something to sit on */}
                <div className="h-20 bg-gradient-to-br from-teal-500/15 via-teal-400/10 to-sky-400/10" />

                {/* Avatar overlaps the band — the signature profile-card move */}
                <div className="relative z-10 -mt-12 flex justify-center">
                  <div className="rounded-full bg-white p-1 shadow-sm ring-1 ring-zinc-200/70">
                    <AvatarLightbox
                      name={trainer.name}
                      src={trainer.photoUrl}
                      rounded="rounded-full"
                      className="size-20 text-2xl"
                    />
                  </div>
                </div>

                {/* Identity */}
                <div className="pointer-events-none relative z-10 mt-3 px-5 text-center">
                  <p className="truncate text-base font-semibold text-zinc-950 group-hover:text-teal-700">
                    {trainer.name}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-zinc-500">
                    {trainer.primaryRole ?? "Trainer"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-400">
                    {trainer.city ?? "Location not set"}
                  </p>
                </div>

                {/* Stats strip */}
                <div className="relative z-10 mx-5 mt-4 grid grid-cols-2 divide-x divide-zinc-100 rounded-xl bg-zinc-50 py-2.5 text-center">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {trainer.experience ?? 0}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                      Years
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {trainer._count.assignments}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                      Assignments
                    </p>
                  </div>
                </div>

                {/* Status — dot + label, tied together */}
                <div className="relative z-10 mt-4 flex items-center justify-center gap-2 px-5">
                  <span
                    className={`size-2 rounded-full ${
                      latest ? statusDotClasses[latest.status] : "bg-zinc-300"
                    }`}
                  />
                  <span className="text-xs font-medium text-zinc-600">
                    {latest ? statusLabels[latest.status] : "Unassigned"}
                  </span>
                </div>

                {/* Quick actions — what people do most, revealed on hover */}
                <div className="relative z-10 mt-4 flex items-center gap-2 border-t border-zinc-100 p-3">
                  <Link
                    href={`/trainers/${trainer.id}/edit`}
                    className="flex-1 rounded-lg border border-zinc-300 bg-white py-2 text-center text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/assignments?trainerId=${trainer.id}`}
                    className="flex-1 rounded-lg bg-zinc-950 py-2 text-center text-xs font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Assign
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm text-zinc-500">
          No trainers match these filters.
        </div>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-500">
            Page {page} of {pageCount} · {PAGE_SIZE} per page
          </p>
          <div className="flex gap-2">
            <Link
              aria-disabled={page <= 1}
              href={`/trainers${buildQueryString(baseQuery, { page: page - 1 })}`}
              className={`rounded-md border px-3 py-1.5 font-semibold ${
                page <= 1
                  ? "pointer-events-none border-zinc-200 text-zinc-300"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              Previous
            </Link>
            <Link
              aria-disabled={page >= pageCount}
              href={`/trainers${buildQueryString(baseQuery, { page: page + 1 })}`}
              className={`rounded-md border px-3 py-1.5 font-semibold ${
                page >= pageCount
                  ? "pointer-events-none border-zinc-200 text-zinc-300"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
