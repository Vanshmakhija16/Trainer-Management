"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { OrganizationType } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  firstError,
  organizationContactSchema,
  organizationSchema,
} from "@/lib/validation";

export type FormState = { message: string; success: boolean };

export async function createOrganization(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = organizationSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    website: formData.get("website"),
    industry: formData.get("industry"),
    city: formData.get("city"),
    state: formData.get("state"),
    country: formData.get("country"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { message: firstError(parsed.error), success: false };
  }

  let id: string;
  try {
    const created = await prisma.organization.create({
      data: { ...parsed.data, type: parsed.data.type as OrganizationType },
    });
    id = created.id;
  } catch {
    return { message: "Organization could not be saved.", success: false };
  }

  revalidatePath("/organizations");
  revalidatePath("/");
  redirect(`/organizations/${id}`);
}

export async function deleteOrganization(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await prisma.assignment.deleteMany({ where: { organizationId: id } });
  await prisma.organization.delete({ where: { id } });

  revalidatePath("/organizations");
  revalidatePath("/");
  redirect("/organizations");
}

export async function addContact(formData: FormData) {
  const parsed = organizationContactSchema.safeParse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    designation: formData.get("designation"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    linkedin: formData.get("linkedin"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return;

  await prisma.organizationContact.create({ data: parsed.data });
  revalidatePath(`/organizations/${parsed.data.organizationId}`);
}

export async function deleteContact(formData: FormData) {
  const id = formData.get("id");
  const organizationId = formData.get("organizationId");
  if (typeof id !== "string" || !id) return;

  await prisma.organizationContact.delete({ where: { id } });
  if (typeof organizationId === "string") {
    revalidatePath(`/organizations/${organizationId}`);
  }
}
