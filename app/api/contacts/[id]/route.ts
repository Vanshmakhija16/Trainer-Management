import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { firstError, organizationContactSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = organizationContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  try {
    const contact = await prisma.organizationContact.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(contact);
  } catch {
    return NextResponse.json({ error: "Could not update contact." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  try {
    await prisma.organizationContact.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete contact." }, { status: 500 });
  }
}
