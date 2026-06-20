import { NextResponse } from "next/server";
import type { OrganizationType } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { firstError, organizationSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      contacts: true,
      events: { include: { trainers: { include: { trainer: true } } } },
    },
  });
  if (!organization) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }
  return NextResponse.json(organization);
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = organizationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  try {
    const organization = await prisma.organization.update({
      where: { id },
      data: { ...parsed.data, type: parsed.data.type as OrganizationType },
    });
    return NextResponse.json(organization);
  } catch {
    return NextResponse.json(
      { error: "Could not update organization." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  try {
    // Assignments use RESTRICT; clear them first. Contacts/events/etc cascade.
    await prisma.assignment.deleteMany({ where: { organizationId: id } });
    await prisma.organization.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not delete organization." },
      { status: 500 },
    );
  }
}
