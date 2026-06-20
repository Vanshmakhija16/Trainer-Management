import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { firstError, organizationContactSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId") || undefined;
  const contacts = await prisma.organizationContact.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(contacts);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = organizationContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  const contact = await prisma.organizationContact.create({ data: parsed.data });
  return NextResponse.json(contact, { status: 201 });
}
