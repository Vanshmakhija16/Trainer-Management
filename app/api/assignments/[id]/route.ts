import { NextResponse } from "next/server";
import type { AssignmentStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { assignmentUpdateSchema, firstError } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { trainer: true, organization: true },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  }
  return NextResponse.json(assignment);
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = assignmentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  try {
    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        status: parsed.data.status as AssignmentStatus,
        remarks: parsed.data.remarks,
        interviewDate: parsed.data.interviewDate,
      },
    });
    return NextResponse.json(assignment);
  } catch {
    return NextResponse.json({ error: "Could not update assignment." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  try {
    await prisma.assignment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete assignment." }, { status: 500 });
  }
}
