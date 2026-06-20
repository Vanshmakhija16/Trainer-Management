"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { savePhoto, saveResume } from "@/lib/upload";
import { firstError, trainerSchema } from "@/lib/validation";
import type { TrainerFormState } from "./_components/trainer-form";

/**
 * Updates an existing trainer. Reuses the same validation as create. Uploaded
 * photo/resume are optional on edit — when omitted, the existing URLs are kept.
 */
export async function updateTrainer(
  _previousState: TrainerFormState,
  formData: FormData,
): Promise<TrainerFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { message: "Missing trainer id.", success: false };
  }

  const parsed = trainerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    location: formData.get("location"),
    linkedin: formData.get("linkedin"),
    primaryRole: formData.get("primaryRole"),
    totalTrainingExperience: formData.get("totalTrainingExperience"),
    industryExperience: formData.get("industryExperience"),
    areasOfExpertise: formData.getAll("areasOfExpertise"),
    detailedExpertise: formData.get("detailedExpertise"),
    trainingTypesDelivered: formData.getAll("trainingTypesDelivered"),
    availability: formData.getAll("availability"),
    expectedChargesPerDay: formData.get("expectedChargesPerDay"),
    languages: formData.get("languages"),
    declarationAccepted: formData.get("declarationAccepted"),
  });
  if (!parsed.success) {
    return { message: firstError(parsed.error), success: false };
  }
  const data = parsed.data;

  // Only replace stored files when a new one was actually uploaded.
  const resume = formData.get("resume");
  const photo = formData.get("photo");
  let newResumeUrl: string | null = null;
  let newPhotoUrl: string | null = null;
  try {
    newResumeUrl = await saveResume(resume instanceof File ? resume : null);
    newPhotoUrl = await savePhoto(photo instanceof File ? photo : null);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Upload failed.",
      success: false,
    };
  }

  try {
    await prisma.trainer.update({
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
        ...(newResumeUrl ? { resumeUrl: newResumeUrl } : {}),
        ...(newPhotoUrl ? { photoUrl: newPhotoUrl } : {}),
      },
    });
  } catch (error) {
    console.error("[updateTrainer] failed:", error);
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
      return {
        message: "A trainer with this email already exists.",
        success: false,
      };
    }
    return { message: "Trainer could not be updated.", success: false };
  }

  revalidatePath("/trainers");
  revalidatePath(`/trainers/${id}`);
  revalidatePath("/");
  redirect(`/trainers/${id}`);
}

export async function deleteTrainer(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  // Remove dependent assignments first to satisfy the FK constraint.
  await prisma.assignment.deleteMany({ where: { trainerId: id } });
  await prisma.trainer.delete({ where: { id } });

  revalidatePath("/trainers");
  revalidatePath("/");
  redirect("/trainers");
}
