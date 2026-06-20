import { NextResponse } from "next/server";
import type { AssignmentStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { assignmentSchema, firstError } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assignments = await prisma.assignment.findMany({
    where: {
      trainerId: searchParams.get("trainerId") || undefined,
      organizationId:
        searchParams.get("organizationId") ||
        searchParams.get("universityId") ||
        undefined,
      status: (searchParams.get("status") as AssignmentStatus) || undefined,
    },
    orderBy: { createdAt: "desc" },
    include: { trainer: true, organization: true },
  });
  return NextResponse.json(assignments);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }

  try {
    const assignment = await prisma.assignment.create({
      data: {
        trainerId: parsed.data.trainerId,
        organizationId: parsed.data.organizationId,
        status: parsed.data.status as AssignmentStatus,
        remarks: parsed.data.remarks,
        interviewDate: parsed.data.interviewDate,
      },
    });
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
      return NextResponse.json(
        { error: "This trainer is already assigned to that organization." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Could not create assignment." }, { status: 500 });
  }
}
