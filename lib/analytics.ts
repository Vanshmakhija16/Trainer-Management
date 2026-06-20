import { EventStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";

/**
 * Trainer analytics: events conducted, organizations served, revenue generated
 * (summed from the events they were on), and average rating. Powers the
 * "Most Active Trainers" / trainer analytics views.
 */
export async function getTrainerAnalytics(limit = 10) {
  const trainers = await prisma.trainer.findMany({
    include: {
      eventTrainers: {
        include: {
          event: {
            select: {
              revenue: true,
              feedbackRating: true,
              organizationId: true,
              status: true,
            },
          },
        },
      },
    },
  });

  const rows = trainers.map((trainer) => {
    const events = trainer.eventTrainers.map((et) => et.event);
    const orgIds = new Set(events.map((e) => e.organizationId));
    const ratings = events
      .map((e) => e.feedbackRating)
      .filter((r): r is number => typeof r === "number");
    const revenue = events.reduce((sum, e) => sum + toNumber(e.revenue), 0);

    return {
      id: trainer.id,
      name: trainer.name,
      totalEvents: events.length,
      organizationsServed: orgIds.size,
      revenue,
      averageRating: ratings.length
        ? Number(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1),
          )
        : null,
    };
  });

  return rows
    .sort((a, b) => b.totalEvents - a.totalEvents)
    .slice(0, limit)
    .filter((r) => r.totalEvents > 0);
}

/**
 * Monthly revenue trend for the last `months` months — used by the global
 * dashboard chart. Returns ascending chronological buckets.
 */
export async function getMonthlyRevenue(months = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const events = await prisma.event.findMany({
    where: { eventDate: { gte: since } },
    select: { eventDate: true, revenue: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(since);
    d.setMonth(since.getMonth() + i);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }

  for (const event of events) {
    if (!event.eventDate) continue;
    const key = `${event.eventDate.getFullYear()}-${event.eventDate.getMonth()}`;
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + toNumber(event.revenue));
    }
  }

  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
  });

  return Array.from(buckets.entries()).map(([key, revenue]) => {
    const [year, month] = key.split("-").map(Number);
    return {
      label: monthLabel.format(new Date(year, month, 1)),
      revenue,
    };
  });
}

export { EventStatus };
