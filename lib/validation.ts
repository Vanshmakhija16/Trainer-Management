import { z } from "zod";
import {
  assignmentStatuses,
  organizationTypes,
  eventTypes,
  eventStatuses,
  eventTrainerRoles,
  documentTypes,
  activityTypes,
} from "@/lib/status";

const optionalDecimal = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((value) => {
    if (value === undefined || value === null || value === "") return null;
    const parsed = typeof value === "number" ? value : Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  });

const MIN_DATE = new Date("2000-01-01");
const MAX_DATE = new Date("2100-12-31");

const optionalDate = z
  .string()
  .trim()
  .nullish()
  .transform((value) => (value ? new Date(value) : null))
  .refine(
    (date) =>
      date === null ||
      (!Number.isNaN(date.getTime()) && date >= MIN_DATE && date <= MAX_DATE),
    { message: "Date must be a valid date between 2000 and 2100" },
  );

function enumValues<T extends readonly string[]>(values: T) {
  return values as unknown as [string, ...string[]];
}

const optionalString = z
  .string()
  .trim()
  .nullish()
  .transform((value) => (value ? value : null));

const optionalInt = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((value) => {
    if (value === undefined || value === null || value === "") return null;
    const parsed =
      typeof value === "number" ? value : Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  });

const stringArray = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (!value) return [] as string[];
    const list = Array.isArray(value) ? value : [value];
    return list.map((item) => item.trim()).filter(Boolean);
  });

export const trainerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().optional().or(z.literal("")).transform((value) => value ?? ""),
  email: z.string().trim().email("A valid email is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  location: z.string().trim().min(1, "Location is required"),
  linkedin: z
    .string()
    .trim()
    .url("LinkedIn must be a valid URL")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  primaryRole: z.string().trim().min(1, "Primary role is required"),
  totalTrainingExperience: optionalInt,
  industryExperience: optionalInt,
  areasOfExpertise: stringArray,
  detailedExpertise: z.string().trim().min(1, "Detailed expertise is required"),
  trainingTypesDelivered: stringArray,
  availability: stringArray,
  expectedChargesPerDay: z.string().trim().min(1, "Charges are required"),
  languages: z.string().trim().min(1, "Languages are required"),
  declarationAccepted: z
    .union([z.string(), z.boolean()])
    .transform((value) => value === true || value === "on" || value === "true"),
});

export type TrainerInput = z.infer<typeof trainerSchema>;

export const universitySchema = z.object({
  name: z.string().trim().min(1, "University name is required"),
  location: optionalString,
});

export type UniversityInput = z.infer<typeof universitySchema>;

export const assignmentSchema = z.object({
  trainerId: z.string().trim().min(1, "Trainer is required"),
  organizationId: z.string().trim().min(1, "Organization is required"),
  status: z.enum(assignmentStatuses as unknown as [string, ...string[]]),
  remarks: optionalString,
  interviewDate: optionalDate,
});

export type AssignmentInput = z.infer<typeof assignmentSchema>;

export const assignmentUpdateSchema = z.object({
  status: z.enum(assignmentStatuses as unknown as [string, ...string[]]),
  remarks: optionalString,
  interviewDate: optionalDate,
});

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------
export const organizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  type: z
    .enum(enumValues(organizationTypes))
    .nullish()
    .transform((value) => value ?? "OTHER"),
  website: optionalString,
  industry: optionalString,
  city: optionalString,
  state: optionalString,
  country: optionalString,
  address: optionalString,
  location: optionalString,
  notes: optionalString,
});

export type OrganizationInput = z.infer<typeof organizationSchema>;

// ---------------------------------------------------------------------------
// Organization contact
// ---------------------------------------------------------------------------
export const organizationContactSchema = z.object({
  organizationId: z.string().trim().min(1, "Organization is required"),
  name: z.string().trim().min(1, "Contact name is required"),
  designation: optionalString,
  phone: optionalString,
  email: optionalString,
  linkedin: optionalString,
  notes: optionalString,
});

export type OrganizationContactInput = z.infer<typeof organizationContactSchema>;

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------
export const eventSchema = z.object({
  title: z.string().trim().min(1, "Event title is required"),
  eventType: z
    .enum(enumValues(eventTypes))
    .nullish()
    .transform((value) => value ?? "OTHER"),
  organizationId: z.string().trim().min(1, "Organization is required"),
  description: optionalString,
  eventDate: optionalDate,
  endDate: optionalDate,
  startTime: optionalString,
  endTime: optionalString,
  venue: optionalString,
  noOfSessions: optionalInt,
  sessionCharges: optionalDecimal,
  expectedParticipants: optionalInt,
  actualParticipants: optionalInt,
  status: z
    .enum(enumValues(eventStatuses))
    .nullish()
    .transform((value) => value ?? "PLANNED"),
  revenue: optionalDecimal,
  expenses: optionalDecimal,
  feedbackRating: optionalDecimal,
  clientFeedback: optionalString,
  internalNotes: optionalString,
  hostName: optionalString,
  hostPhone: optionalString,
  hostEmail: optionalString,
  leadSource: optionalString,
  leadOwner: optionalString,
}).refine(
  (data) =>
    !data.eventDate || !data.endDate || data.endDate >= data.eventDate,
  { message: "End date cannot be before the start date", path: ["endDate"] },
);

export type EventInput = z.infer<typeof eventSchema>;

// ---------------------------------------------------------------------------
// Event trainer (M:N row)
// ---------------------------------------------------------------------------
export const eventTrainerSchema = z.object({
  eventId: z.string().trim().min(1, "Event is required"),
  trainerId: z.string().trim().min(1, "Trainer is required"),
  role: z
    .enum(enumValues(eventTrainerRoles))
    .nullish()
    .transform((value) => value ?? "LEAD"),
  payout: optionalDecimal,
});

export type EventTrainerInput = z.infer<typeof eventTrainerSchema>;

// ---------------------------------------------------------------------------
// Event document
// ---------------------------------------------------------------------------
export const eventDocumentSchema = z.object({
  eventId: z.string().trim().min(1, "Event is required"),
  fileName: z.string().trim().min(1, "File name is required"),
  fileUrl: z.string().trim().min(1, "File URL is required"),
  documentType: z
    .enum(enumValues(documentTypes))
    .nullish()
    .transform((value) => value ?? "OTHER"),
});

export type EventDocumentInput = z.infer<typeof eventDocumentSchema>;

// ---------------------------------------------------------------------------
// Event activity (timeline entry)
// ---------------------------------------------------------------------------
export const eventActivitySchema = z.object({
  eventId: z.string().trim().min(1, "Event is required"),
  activityType: z
    .enum(enumValues(activityTypes))
    .nullish()
    .transform((value) => value ?? "NOTE"),
  description: optionalString,
  createdBy: optionalString,
});

export type EventActivityInput = z.infer<typeof eventActivitySchema>;

/** Flattens a ZodError into a single human-readable message. */
export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input.";
}
