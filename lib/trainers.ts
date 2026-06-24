import type { Prisma } from "@/app/generated/prisma/client";
import type { AssignmentStatus, TrainerType } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const PAGE_SIZE = 12;

export type TrainerSort = "recent" | "name" | "experience" | "charges_asc" | "charges_desc";

export type TrainerQuery = {
  page?: number;
  search?: string;
  city?: string;
  status?: AssignmentStatus;
  organizationId?: string;
  minExperience?: number;
  sort?: TrainerSort;
  // Yoga-specific filters
  trainerType?: TrainerType;
  yogaStyle?: string;
  certification?: string;
  onboardedYear?: number;
  maxCharges?: number;
  minCharges?: number;
};

function buildWhere(query: TrainerQuery): Prisma.TrainerWhereInput {
  const where: Prisma.TrainerWhereInput = {};
  const and: Prisma.TrainerWhereInput[] = [];

  if (query.trainerType) {
    and.push({ trainerType: query.trainerType });
  }

  if (query.search) {
    and.push({
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { skills: { contains: query.search, mode: "insensitive" } },
        { city: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }

  if (query.city) {
    and.push({ city: { equals: query.city, mode: "insensitive" } });
  }

  if (typeof query.minExperience === "number") {
    and.push({ experience: { gte: query.minExperience } });
  }

  // Yoga-specific filters
  if (query.yogaStyle) {
    and.push({ yogaStyles: { has: query.yogaStyle } });
  }

  if (query.certification) {
    and.push({ certification: { equals: query.certification, mode: "insensitive" } });
  }

  if (query.onboardedYear) {
    and.push({ onboardedYear: { equals: query.onboardedYear } });
  }

  if (typeof query.minCharges === "number") {
    and.push({ chargesPerDay: { gte: query.minCharges } });
  }

  if (typeof query.maxCharges === "number") {
    and.push({ chargesPerDay: { lte: query.maxCharges } });
  }

  const assignmentFilter: Prisma.AssignmentWhereInput = {};
  if (query.status) assignmentFilter.status = query.status;
  if (query.organizationId) assignmentFilter.organizationId = query.organizationId;
  if (Object.keys(assignmentFilter).length) {
    and.push({ assignments: { some: assignmentFilter } });
  }

  if (and.length) where.AND = and;
  return where;
}

function buildOrderBy(sort: TrainerSort | undefined): Prisma.TrainerOrderByWithRelationInput {
  switch (sort) {
    case "name":        return { name: "asc" };
    case "experience":  return { experience: "desc" };
    case "charges_asc": return { chargesPerDay: "asc" };
    case "charges_desc":return { chargesPerDay: "desc" };
    default:            return { createdAt: "desc" };
  }
}

export async function getTrainers(query: TrainerQuery) {
  const page = Math.max(1, query.page ?? 1);
  const where = buildWhere(query);

  const [total, trainers] = await Promise.all([
    prisma.trainer.count({ where }),
    prisma.trainer.findMany({
      where,
      orderBy: buildOrderBy(query.sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { assignments: true } },
        assignments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { organization: true },
        },
      },
    }),
  ]);

  return {
    trainers,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/** Distinct cities for the city filter dropdown. */
export async function getTrainerCities(trainerType?: TrainerType) {
  const rows = await prisma.trainer.findMany({
    where: {
      city: { not: null },
      ...(trainerType ? { trainerType } : {}),
    },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  return rows.map((row) => row.city).filter((city): city is string => !!city);
}

/** All distinct yoga styles across all yoga trainers */
export async function getYogaStyles(): Promise<string[]> {
  const rows = await prisma.trainer.findMany({
    where: { trainerType: "YOGA", yogaStyles: { isEmpty: false } },
    select: { yogaStyles: true },
  });
  const all = rows.flatMap((r) => r.yogaStyles);
  return [...new Set(all)].sort();
}

/** All distinct certifications across yoga trainers */
export async function getYogaCertifications(): Promise<string[]> {
  const rows = await prisma.trainer.findMany({
    where: { trainerType: "YOGA", certification: { not: null } },
    select: { certification: true },
    distinct: ["certification"],
    orderBy: { certification: "asc" },
  });
  return rows.map((r) => r.certification).filter((c): c is string => !!c);
}

/** All distinct onboarded years */
export async function getOnboardedYears(trainerType?: TrainerType): Promise<number[]> {
  const rows = await prisma.trainer.findMany({
    where: {
      onboardedYear: { not: null },
      ...(trainerType ? { trainerType } : {}),
    },
    select: { onboardedYear: true },
    distinct: ["onboardedYear"],
    orderBy: { onboardedYear: "desc" },
  });
  return rows.map((r) => r.onboardedYear).filter((y): y is number => !!y);
}

export async function getTrainerById(id: string) {
  return prisma.trainer.findUnique({
    where: { id },
    include: {
      assignments: {
        orderBy: { createdAt: "desc" },
        include: { organization: true },
      },
    },
  });
}
