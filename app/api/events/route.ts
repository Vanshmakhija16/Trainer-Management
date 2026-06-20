import { NextResponse } from "next/server";
import { getEvents } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { toEventData } from "@/lib/event-data";
import { eventSchema, firstError } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const events = await getEvents({
    search: searchParams.get("search") || undefined,
    organizationId: searchParams.get("organizationId") || undefined,
    type: searchParams.get("type") || undefined,
    status: searchParams.get("status") || undefined,
  });
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }

  const event = await prisma.event.create({
    // Type assertion: validated enums arrive as strings.
    data: toEventData(parsed.data) as Parameters<
      typeof prisma.event.create
    >[0]["data"],
  });
  return NextResponse.json(event, { status: 201 });
}
