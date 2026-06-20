import { NextResponse } from "next/server";
import type { ActivityType } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { eventActivitySchema, firstError } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId") || undefined;
  const activities = await prisma.eventActivity.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(activities);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = eventActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  const activity = await prisma.eventActivity.create({
    data: {
      eventId: parsed.data.eventId,
      activityType: parsed.data.activityType as ActivityType,
      description: parsed.data.description,
      createdBy: parsed.data.createdBy,
    },
  });
  return NextResponse.json(activity, { status: 201 });
}
