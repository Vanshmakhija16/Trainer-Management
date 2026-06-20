import { NextResponse } from "next/server";
import type { OrganizationType } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { firstError, organizationSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const type = searchParams.get("type") || undefined;

  const organizations = await prisma.organization.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
                { industry: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        type ? { type: type as OrganizationType } : {},
      ],
    },
    orderBy: { name: "asc" },
    include: { _count: { select: { events: true, contacts: true } } },
  });
  return NextResponse.json(organizations);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = organizationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  const organization = await prisma.organization.create({
    data: { ...parsed.data, type: parsed.data.type as OrganizationType },
  });
  return NextResponse.json(organization, { status: 201 });
}
