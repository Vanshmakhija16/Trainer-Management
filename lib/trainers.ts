import type { Prisma } from "@/app/generated/prisma/client";
import type { AssignmentStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const PAGE_SIZE = 10;

export type TrainerSort = "recent" | "name" | "experience";

export type TrainerQuery = {
  page?: number;
  search?: string;
  city?: string;
  status?: AssignmentStatus;
  organizationId?: string;
  minExperience?: number;
  sort?: TrainerSort;
};

function buildWhere(query: TrainerQuery): Prisma.TrainerWhereInput {
  const where: Prisma.TrainerWhereInput = {};
  const and: Prisma.TrainerWhereInput[] = [];

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

  const assignmentFilter: Prisma.AssignmentWhereInput = {};
  if (query.status) assignmentFilter.status = query.status;
  if (query.organizationId)
    assignmentFilter.organizationId = query.organizationId;
  if (Object.keys(assignmentFilter).length) {
    and.push({ assignments: { some: assignmentFilter } });
  }

  if (and.length) where.AND = and;
  return where;
}

function buildOrderBy(
  sort: TrainerSort | undefined,
): Prisma.TrainerOrderByWithRelationInput {
  switch (sort) {
    case "name":
      return { name: "asc" };
    case "experience":
      return { experience: "desc" };
    default:
      return { createdAt: "desc" };
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
export async function getTrainerCities() {
  const rows = await prisma.trainer.findMany({
    where: { city: { not: null } },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  return rows.map((row) => row.city).filter((city): city is string => !!city);
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
