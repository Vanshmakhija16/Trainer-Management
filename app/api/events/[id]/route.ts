import { NextResponse } from "next/server";
import { getEventProfile } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { toEventData } from "@/lib/event-data";
import { eventSchema, firstError } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const event = await getEventProfile(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  try {
    const event = await prisma.event.update({
      where: { id },
      data: toEventData(parsed.data) as Parameters<
        typeof prisma.event.update
      >[0]["data"],
    });
    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "Could not update event." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  try {
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete event." }, { status: 500 });
  }
}
