import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTrainerById } from "@/lib/trainers";
import { firstError, trainerSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const trainer = await getTrainerById(id);
  if (!trainer) {
    return NextResponse.json({ error: "Trainer not found." }, { status: 404 });
  }
  return NextResponse.json(trainer);
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = trainerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;

  try {
    const trainer = await prisma.trainer.update({
      where: { id },
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
    return NextResponse.json(trainer);
  } catch {
    return NextResponse.json({ error: "Could not update trainer." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  try {
    await prisma.assignment.deleteMany({ where: { trainerId: id } });
    await prisma.trainer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete trainer." }, { status: 500 });
  }
}
