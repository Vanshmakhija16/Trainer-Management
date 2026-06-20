import { prisma } from "@/lib/prisma";

/**
 * Global search across organizations, events, trainers, and contacts.
 * Each entity is queried in parallel and capped so the results page stays fast.
 */
export async function globalSearch(query: string) {
  const q = query.trim();
  if (!q) {
    return { organizations: [], events: [], trainers: [], contacts: [] };
  }

  const contains = { contains: q, mode: "insensitive" as const };

  const [organizations, events, trainers, contacts] = await Promise.all([
    prisma.organization.findMany({
      where: {
        OR: [{ name: contains }, { city: contains }, { industry: contains }],
      },
      take: 10,
      select: { id: true, name: true, type: true, city: true },
    }),
    prisma.event.findMany({
      where: {
        OR: [
          { title: contains },
          { venue: contains },
          { organization: { name: contains } },
        ],
      },
      take: 10,
      include: { organization: { select: { name: true } } },
    }),
    prisma.trainer.findMany({
      where: {
        OR: [{ name: contains }, { email: contains }, { skills: contains }],
      },
      take: 10,
      select: { id: true, name: true, email: true, city: true },
    }),
    prisma.organizationContact.findMany({
      where: {
        OR: [{ name: contains }, { designation: contains }, { email: contains }],
      },
      take: 10,
      include: { organization: { select: { id: true, name: true } } },
    }),
  ]);

  return { organizations, events, trainers, contacts };
}
