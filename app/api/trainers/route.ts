import { NextResponse } from "next/server";
import type { AssignmentStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getTrainers } from "@/lib/trainers";
import { firstError, trainerSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await getTrainers({
    page: Number(searchParams.get("page")) || 1,
    search: searchParams.get("search") || undefined,
    city: searchParams.get("city") || undefined,
    status: (searchParams.get("status") as AssignmentStatus) || undefined,
    organizationId:
      searchParams.get("organizationId") ||
      searchParams.get("universityId") ||
      undefined,
    minExperience: searchParams.get("minExperience")
      ? Number(searchParams.get("minExperience"))
      : undefined,
    sort: (searchParams.get("sort") as "recent" | "name" | "experience") || undefined,
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = trainerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;

  try {
    const trainer = await prisma.trainer.create({
      data: {
        name: `${data.firstName} ${data.lastName}`.trim(),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        city: data.location,
        location: data.location,
        experience: data.totalTrainingExperience,
        totalTrainingExperience: data.totalTrainingExperience,
        industryExperience: data.industryExperience,
        linkedin: data.linkedin,
        skills: data.areasOfExpertise.join(", "),
        primaryRole: data.primaryRole,
        areasOfExpertise: data.areasOfExpertise,
        detailedExpertise: data.detailedExpertise,
        trainingTypesDelivered: data.trainingTypesDelivered,
        availability: data.availability,
        expectedChargesPerDay: data.expectedChargesPerDay,
        languages: data.languages,
        declarationAccepted: data.declarationAccepted,
      },
    });
    return NextResponse.json(trainer, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
      return NextResponse.json(
        { error: "A trainer with this email already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Could not create trainer." }, { status: 500 });
  }
}
