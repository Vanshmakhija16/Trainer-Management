import { EventStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";
import { getMonthlyRevenue, getTrainerAnalytics } from "@/lib/analytics";

const RECENT_LIMIT = 6;

/**
 * Global dashboard data. Aggregates the whole platform in a single round of
 * parallel queries, following the established Promise.all pattern.
 */
export async function getDashboardData() {
  const now = new Date();

  const [
    totalOrganizations,
    totalTrainers,
    totalEvents,
    revenueAgg,
    statusGroups,
    upcomingEvents,
    recentEvents,
    recentActivities,
    monthlyRevenue,
    topTrainers,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.trainer.count(),
    prisma.event.count(),
    prisma.event.aggregate({ _sum: { revenue: true, profit: true } }),
    prisma.event.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.event.findMany({
      where: {
        eventDate: { gte: now },
        status: { in: [EventStatus.PLANNED, EventStatus.CONFIRMED] },
      },
      orderBy: { eventDate: "asc" },
      take: RECENT_LIMIT,
      include: { organization: { select: { id: true, name: true } } },
    }),
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      include: { organization: { select: { id: true, name: true } } },
    }),
    prisma.eventActivity.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            organization: { select: { name: true } },
          },
        },
      },
    }),
    getMonthlyRevenue(6),
    getTrainerAnalytics(5),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const group of statusGroups) {
    statusCounts[group.status] = group._count._all;
  }

  return {
    totals: {
      organizations: totalOrganizations,
      trainers: totalTrainers,
      events: totalEvents,
      revenue: toNumber(revenueAgg._sum.revenue),
      profit: toNumber(revenueAgg._sum.profit),
      upcoming:
        (statusCounts[EventStatus.PLANNED] ?? 0) +
        (statusCounts[EventStatus.CONFIRMED] ?? 0),
      completed: statusCounts[EventStatus.COMPLETED] ?? 0,
      cancelled: statusCounts[EventStatus.CANCELLED] ?? 0,
    },
    upcomingEvents,
    recentEvents,
    recentActivities,
    monthlyRevenue,
    topTrainers,
  };
}
