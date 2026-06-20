import type { Prisma } from "@/app/generated/prisma/client";
import { EventStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";

/**
 * List organizations for the index page, with lightweight rollups (event count,
 * total revenue, last event date) so cards can show signal without N+1 queries.
 */
export async function getOrganizations(filter?: {
  search?: string;
  type?: string;
}) {
  const where: Prisma.OrganizationWhereInput = {};
  const and: Prisma.OrganizationWhereInput[] = [];

  if (filter?.search) {
    and.push({
      OR: [
        { name: { contains: filter.search, mode: "insensitive" } },
        { city: { contains: filter.search, mode: "insensitive" } },
        { industry: { contains: filter.search, mode: "insensitive" } },
      ],
    });
  }
  if (filter?.type) {
    and.push({ type: filter.type as Prisma.EnumOrganizationTypeFilter["equals"] });
  }
  if (and.length) where.AND = and;

  const organizations = await prisma.organization.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { events: true, contacts: true } },
      events: {
        select: { revenue: true, eventDate: true, status: true },
      },
    },
  });

  return organizations.map((org) => {
    const revenue = org.events.reduce((sum, e) => sum + toNumber(e.revenue), 0);
    const lastEventDate = org.events
      .map((e) => e.eventDate)
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    const completed = org.events.filter(
      (e) => e.status === EventStatus.COMPLETED,
    ).length;

    return {
      id: org.id,
      name: org.name,
      type: org.type,
      city: org.city,
      industry: org.industry,
      eventCount: org._count.events,
      contactCount: org._count.contacts,
      completedEvents: completed,
      revenue,
      lastEventDate: lastEventDate ?? null,
    };
  });
}

/** Full organization profile: details, contacts, events, trainer history. */
export async function getOrganizationProfile(id: string) {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { createdAt: "asc" } },
      events: {
        orderBy: { eventDate: "desc" },
        include: {
          trainers: { include: { trainer: true } },
          _count: { select: { documents: true } },
        },
      },
    },
  });
  if (!org) return null;

  const totalRevenue = org.events.reduce(
    (sum, e) => sum + toNumber(e.revenue),
    0,
  );
  const totalProfit = org.events.reduce(
    (sum, e) => sum + toNumber(e.profit),
    0,
  );
  const completed = org.events.filter(
    (e) => e.status === EventStatus.COMPLETED,
  ).length;
  const successRate = org.events.length
    ? Math.round((completed / org.events.length) * 100)
    : 0;

  // Trainer history across all of this org's events, with utilisation counts.
  const trainerMap = new Map<
    string,
    { id: string; name: string; events: number }
  >();
  for (const event of org.events) {
    for (const et of event.trainers) {
      const existing = trainerMap.get(et.trainerId);
      if (existing) existing.events += 1;
      else
        trainerMap.set(et.trainerId, {
          id: et.trainer.id,
          name: et.trainer.name,
          events: 1,
        });
    }
  }
  const trainerHistory = Array.from(trainerMap.values()).sort(
    (a, b) => b.events - a.events,
  );

  return {
    organization: org,
    stats: {
      totalEvents: org.events.length,
      completedEvents: completed,
      totalRevenue,
      totalProfit,
      successRate,
    },
    trainerHistory,
  };
}
