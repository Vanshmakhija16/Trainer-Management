"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ActivityType,
  type EventTrainerRole,
} from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { toEventData } from "@/lib/event-data";
import {
  eventActivitySchema,
  eventSchema,
  eventTrainerSchema,
  firstError,
} from "@/lib/validation";

export type FormState = { message: string; success: boolean };

type EventData = Parameters<typeof prisma.event.create>[0]["data"];

export async function createEvent(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    eventType: formData.get("eventType"),
    organizationId: formData.get("organizationId"),
    description: formData.get("description"),
    eventDate: formData.get("eventDate"),
    endDate: formData.get("endDate"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    venue: formData.get("venue"),
    expectedParticipants: formData.get("expectedParticipants"),
    actualParticipants: formData.get("actualParticipants"),
    status: formData.get("status"),
    revenue: formData.get("revenue"),
    expenses: formData.get("expenses"),
    feedbackRating: formData.get("feedbackRating"),
    clientFeedback: formData.get("clientFeedback"),
    internalNotes: formData.get("internalNotes"),
    hostName: formData.get("hostName"),
    hostPhone: formData.get("hostPhone"),
    hostEmail: formData.get("hostEmail"),
    leadSource: formData.get("leadSource"),
    leadOwner: formData.get("leadOwner"),
  });
  if (!parsed.success) {
    return { message: firstError(parsed.error), success: false };
  }

  let id: string;
  try {
    const created = await prisma.event.create({
      data: toEventData(parsed.data) as EventData,
    });
    id = created.id;
    // Seed the timeline.
    await prisma.eventActivity.create({
      data: {
        eventId: id,
        activityType: ActivityType.LEAD_RECEIVED,
        description: "Event record created.",
      },
    });
  } catch (error) {
    console.error("[createEvent] failed:", error);
    return { message: "Event could not be saved.", success: false };
  }

  revalidatePath("/events");
  revalidatePath("/");
  redirect(`/events/${id}`);
}

export async function deleteEvent(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  await prisma.event.delete({ where: { id } });
  revalidatePath("/events");
  revalidatePath("/");
  redirect("/events");
}

export async function addEventTrainer(formData: FormData) {
  const parsed = eventTrainerSchema.safeParse({
    eventId: formData.get("eventId"),
    trainerId: formData.get("trainerId"),
    role: formData.get("role"),
    payout: formData.get("payout"),
  });
  if (!parsed.success) return;

  try {
    await prisma.$transaction([
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
  } catch {
    // Likely a duplicate (trainer already on event) — ignore.
  }
  revalidatePath(`/events/${parsed.data.eventId}`);
}

export async function removeEventTrainer(formData: FormData) {
  const id = formData.get("id");
  const eventId = formData.get("eventId");
  if (typeof id !== "string" || !id) return;
  await prisma.eventTrainer.delete({ where: { id } });
  if (typeof eventId === "string") revalidatePath(`/events/${eventId}`);
}

export async function addActivity(formData: FormData) {
  const parsed = eventActivitySchema.safeParse({
    eventId: formData.get("eventId"),
    activityType: formData.get("activityType"),
    description: formData.get("description"),
    createdBy: formData.get("createdBy"),
  });
  if (!parsed.success) return;

  await prisma.eventActivity.create({
    data: {
      eventId: parsed.data.eventId,
      activityType: parsed.data.activityType as ActivityType,
      description: parsed.data.description,
      createdBy: parsed.data.createdBy,
    },
  });
  revalidatePath(`/events/${parsed.data.eventId}`);
}
