"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { savePhoto, saveResume } from "@/lib/upload";
import { firstError, trainerSchema } from "@/lib/validation";
import type { TrainerFormState } from "@/app/trainers/_components/trainer-form";

function parseForm(formData: FormData) {
  return trainerSchema.safeParse({
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
}

export async function createTrainer(
  _previousState: TrainerFormState,
  formData: FormData,
): Promise<TrainerFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { message: firstError(parsed.error), success: false };
  }
  const data = parsed.data;

  if (!data.declarationAccepted) {
    return { message: "You must accept the declaration.", success: false };
  }

  const resume = formData.get("resume");
  const photo = formData.get("photo");
  let resumeUrl: string | null = null;
  let photoUrl: string | null = null;
  try {
    resumeUrl = await saveResume(resume instanceof File ? resume : null);
    photoUrl = await savePhoto(photo instanceof File ? photo : null);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Upload failed.",
      success: false,
    };
  }

  let trainerId: string;
  try {
    const created = await prisma.trainer.create({
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
        resumeUrl,
        photoUrl,
      },
    });
    trainerId = created.id;
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
      return {
        message: "A trainer with this email already exists.",
        success: false,
      };
    }
    return {
      message: "Trainer could not be saved. Please try again.",
      success: false,
    };
  }

  revalidatePath("/trainers");
  revalidatePath("/");
  redirect(`/trainers/${trainerId}`);
}
