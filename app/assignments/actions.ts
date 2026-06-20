"use server";

import { revalidatePath } from "next/cache";
import type { AssignmentStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  assignmentSchema,
  assignmentUpdateSchema,
  firstError,
} from "@/lib/validation";

export type AssignmentFormState = {
  message: string;
  success: boolean;
};

function revalidateAll() {
  revalidatePath("/assignments");
  revalidatePath("/");
}

export async function createAssignment(
  _previousState: AssignmentFormState,
  formData: FormData,
): Promise<AssignmentFormState> {
  const parsed = assignmentSchema.safeParse({
    trainerId: formData.get("trainerId"),
    organizationId: formData.get("organizationId"),
    status: formData.get("status"),
    remarks: formData.get("remarks"),
    interviewDate: formData.get("interviewDate"),
  });
  if (!parsed.success) {
    return { message: firstError(parsed.error), success: false };
  }

  try {
    await prisma.assignment.create({
      data: {
        trainerId: parsed.data.trainerId,
        organizationId: parsed.data.organizationId,
        status: parsed.data.status as AssignmentStatus,
        remarks: parsed.data.remarks,
        interviewDate: parsed.data.interviewDate,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
      return {
        message: "This trainer is already assigned to that organization.",
        success: false,
      };
    }
    return { message: "Assignment could not be created.", success: false };
  }

  revalidateAll();
  return { message: "Assignment created.", success: true };
}

export async function updateAssignment(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  // Validate through the schema so dates are range-checked (rejects absurd
  // years like 20000) before they can be stored and crash date formatting.
  const parsed = assignmentUpdateSchema.safeParse({
    status: formData.get("status"),
    remarks: formData.get("remarks"),
    interviewDate: formData.get("interviewDate"),
  });
  if (!parsed.success) return;

  await prisma.assignment.update({
    where: { id },
    data: {
      status: parsed.data.status as AssignmentStatus,
      remarks: parsed.data.remarks,
      interviewDate: parsed.data.interviewDate,
    },
  });

  revalidateAll();
}

export async function deleteAssignment(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  await prisma.assignment.delete({ where: { id } });
  revalidateAll();
}
