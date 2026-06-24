import Link from "next/link";
import { Suspense } from "react";
import type { AssignmentStatus, TrainerType } from "@/app/generated/prisma/enums";
import { AvatarLightbox } from "@/app/_components/avatar-lightbox";
import {
  getTrainerCities,
  getTrainers,
  getYogaStyles,
  getYogaCertifications,
  getOnboardedYears,
  PAGE_SIZE,
} from "@/lib/trainers";
import { prisma } from "@/lib/prisma";
import { statusDotClasses, statusLabels } from "@/lib/status";
import { YogaFilters } from "./_components/yoga-filters";
import { TrainerFilters } from "./_components/trainer-filters";

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

export default async function TrainersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  const search = one(sp.search)?.trim() || undefined;
  const city = one(sp.city) || undefined;
  const status = (one(sp.status) as AssignmentStatus | undefined) || undefined;
  const organizationId = one(sp.organizationId) || one(sp.universityId) || undefined;
  const minExperienceRaw = one(sp.minExperience);
  const minExperience = minExperienceRaw ? Number(minExperienceRaw) : undefined;
  const sort = (one(sp.sort) as any) || "recent";
  const page = Number(one(sp.page)) || 1;
  const trainerType = (one(sp.trainerType) as TrainerType | undefined) || undefined;
  const yogaStyle = one(sp.yogaStyle) || undefined;
  const certification = one(sp.certification) || undefined;
  const onboardedYearRaw = one(sp.onboardedYear);
  const onboardedYear = onboardedYearRaw ? Number(onboardedYearRaw) : undefined;
  const minChargesRaw = one(sp.minCharges);
  const maxChargesRaw = one(sp.maxCharges);
  const minCharges = minChargesRaw ? Number(minChargesRaw) : undefined;
  const maxCharges = maxChargesRaw ? Number(maxChargesRaw) : undefined;

  const isYogaTab = trainerType === "YOGA";

  const [{ trainers, total, pageCount }, cities, organizations, yogaStyles, certifications, years] =
    await Promise.all([
      getTrainers({
        page, search, city, status, organizationId, sort,
        minExperience: Number.isFinite(minExperience) ? minExperience : undefined,
        trainerType,
        yogaStyle,
        certification,
        onboardedYear: Number.isFinite(onboardedYear) ? onboardedYear : undefined,
        minCharges: Number.isFinite(minCharges) ? minCharges : undefined,
        maxCharges: Number.isFinite(maxCharges) ? maxCharges : undefined,
      }),
      getTrainerCities(trainerType),
      prisma.organization.findMany({ orderBy: { name: "asc" } }),
      getYogaStyles(),
      getYogaCertifications(),
      getOnboardedYears(trainerType),
    ]);

  const baseQuery = {
    search, city, status, organizationId, sort,
    minExperience: minExperienceRaw || undefined,
    trainerType,
    yogaStyle,
    certification,
    onboardedYear: onboardedYearRaw || undefined,
    minCharges: minChargesRaw || undefined,
    maxCharges: maxChargesRaw || undefined,
  };

  return (
    <div className="flex gap-8 items-start">

      {/* ── Left: main content ── */}
      <div className="min-w-0 flex-1 space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              {isYogaTab ? "Yoga Trainers" : "Trainers"}
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              {total} trainer{total === 1 ? "" : "s"} found
            </p>
          </div>
          <Link
            href="/trainers/new"
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            + Add Trainer
          </Link>
        </div>

        {/* Type tabs */}
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 w-fit">
          {[
            { label: "All", type: undefined },
            { label: "Yoga", type: "YOGA" },
            { label: "Corporate", type: "CORPORATE" },
            { label: "Wellness", type: "WELLNESS" },
          ].map((tab) => {
            const active = (trainerType ?? undefined) === tab.type;
            const href = tab.type ? `/trainers?trainerType=${tab.type}` : "/trainers";
            return (
              <Link
                key={tab.label}
                href={href}
                className={[
                  "px-4 py-1.5 rounded-md text-sm font-medium transition",
                  active
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800",
                ].join(" ")}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Trainer list */}
        {trainers.length ? (
          <div className="space-y-3">
            {trainers.map((trainer) => {
              const latest = trainer.assignments[0];
              return (
                <div
                  key={trainer.id}
                  className="group relative flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
                >
                  <Link
                    href={`/trainers/${trainer.id}`}
                    aria-label={`Open ${trainer.name}'s profile`}
                    className="absolute inset-0 z-0 rounded-xl"
                  />

                  {/* Avatar */}
                  <div className="relative z-10 shrink-0">
                    <AvatarLightbox
                      name={trainer.name}
                      src={trainer.photoUrl}
                      rounded="rounded-full"
                      className="size-12 text-base"
                    />
                  </div>

                  {/* Name + role + city */}
                  <div className="relative z-10 min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-950 group-hover:text-teal-700">
                      {trainer.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {trainer.primaryRole ?? "Trainer"}
                      {trainer.city ? <span className="text-zinc-300 mx-1">·</span> : null}
                      {trainer.city}
                    </p>
                    {isYogaTab && (trainer as any).yogaStyles?.length > 0 && (
                      <p className="mt-1 truncate text-[11px] text-zinc-400">
                        {(trainer as any).yogaStyles.slice(0, 3).join(" · ")}
                      </p>
                    )}
                  </div>

                  {/* Exp */}
                  <div className="relative z-10 hidden shrink-0 text-center sm:block w-16">
                    <p className="text-sm font-semibold text-zinc-900">{trainer.experience ?? 0} yrs</p>
                    <p className="text-[11px] text-zinc-400 uppercase tracking-wide">Exp</p>
                  </div>

                  {/* Yoga: phone + email | Others: assignments count + status */}
                  {isYogaTab ? (
                    <div className="relative z-10 hidden shrink-0 md:flex flex-col justify-center gap-0.5 w-52 min-w-0">
                      <p className="truncate text-xs font-medium text-zinc-700">
                        {trainer.phone ?? <span className="text-zinc-300">No phone</span>}
                      </p>
                      <p className="truncate text-xs text-zinc-400">
                        {trainer.email ?? <span className="text-zinc-300">No email</span>}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="relative z-10 hidden shrink-0 text-center md:block w-20">
                        <p className="text-sm font-semibold text-zinc-900">{trainer._count.assignments}</p>
                        <p className="text-[11px] text-zinc-400 uppercase tracking-wide">Assigned</p>
                      </div>
                      <div className="relative z-10 hidden shrink-0 lg:flex items-center gap-1.5 w-28">
                        <span className={`size-2 rounded-full shrink-0 ${latest ? statusDotClasses[latest.status] : "bg-zinc-300"}`} />
                        <span className="text-xs text-zinc-600 truncate">
                          {latest ? statusLabels[latest.status] : "Unassigned"}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  <div className="relative z-10 flex shrink-0 items-center gap-2">
                    <Link
                      href={`/trainers/${trainer.id}/edit`}
                      className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/assignments?trainerId=${trainer.id}`}
                      className="rounded-md bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800"
                    >
                      Assign
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center text-sm text-zinc-500">
            No trainers match these filters.
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between text-sm pt-2">
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
                ← Prev
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
                Next →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: filters panel ── */}
      <aside className="hidden xl:block w-72 shrink-0 sticky top-20">
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Filters</p>
          </div>
          <div className="p-4">
            <Suspense>
              {isYogaTab ? (
                <YogaFilters
                  cities={cities}
                  styles={yogaStyles}
                  certifications={certifications}
                  years={years}
                />
              ) : (
                <TrainerFilters
                  cities={cities}
                  organizations={organizations}
                  trainerType={trainerType}
                />
              )}
            </Suspense>
          </div>
        </div>
      </aside>

    </div>
  );
}
