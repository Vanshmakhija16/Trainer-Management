import { NextResponse } from "next/server";
import type { EventTrainerRole } from "@/app/generated/prisma/enums";
import { ActivityType } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { eventTrainerSchema, firstError } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = eventTrainerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }

  try {
    const [link] = await prisma.$transaction([
      prisma.eventTrainer.create({
        data: {
          eventId: parsed.data.eventId,
          trainerId: parsed.data.trainerId,
          role: parsed.data.role as EventTrainerRole,
          payout: parsed.data.payout,
        },
      }),
      prisma.eventActivity.create({
        data: {
          eventId: parsed.data.eventId,
          activityType: ActivityType.TRAINER_ASSIGNED,
          description: "Trainer assigned to event.",
        },
      }),
    ]);
    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
      return NextResponse.json(
        { error: "This trainer is already on this event." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Could not assign trainer." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }
  try {
    await prisma.eventTrainer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not remove trainer." }, { status: 500 });
  }
}
