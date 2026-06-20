import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** List events for the index, optionally filtered by org / type / status / search. */
export async function getEvents(filter?: {
  search?: string;
  organizationId?: string;
  type?: string;
  status?: string;
}) {
  const and: Prisma.EventWhereInput[] = [];

  if (filter?.search) {
    and.push({
      OR: [
        { title: { contains: filter.search, mode: "insensitive" } },
        { venue: { contains: filter.search, mode: "insensitive" } },
        {
          organization: {
            name: { contains: filter.search, mode: "insensitive" },
          },
        },
      ],
    });
  }
  if (filter?.organizationId) and.push({ organizationId: filter.organizationId });
  if (filter?.type)
    and.push({ eventType: filter.type as Prisma.EnumEventTypeFilter["equals"] });
  if (filter?.status)
    and.push({ status: filter.status as Prisma.EnumEventStatusFilter["equals"] });

  return prisma.event.findMany({
    where: and.length ? { AND: and } : undefined,
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    include: {
      organization: { select: { id: true, name: true, type: true } },
      trainers: { include: { trainer: { select: { id: true, name: true } } } },
      _count: { select: { documents: true, activities: true } },
    },
  });
}

/** Full event profile: org, trainers, host, documents, timeline. */
export async function getEventProfile(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      organization: true,
      trainers: {
        include: { trainer: true },
        orderBy: { createdAt: "asc" },
      },
      documents: { orderBy: { uploadedAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });
}
