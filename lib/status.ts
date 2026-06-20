import {
  AssignmentStatus,
  OrganizationType,
  EventType,
  EventStatus,
  EventTrainerRole,
  DocumentType,
  ActivityType,
} from "@/app/generated/prisma/enums";

export const assignmentStatuses = [
  AssignmentStatus.PENDING,
  AssignmentStatus.SENT,
  AssignmentStatus.INTERVIEW_SCHEDULED,
  AssignmentStatus.SELECTED,
  AssignmentStatus.REJECTED,
  AssignmentStatus.ON_HOLD,
] as const;

export const statusLabels: Record<AssignmentStatus, string> = {
  [AssignmentStatus.PENDING]: "Pending",
  [AssignmentStatus.SENT]: "Sent",
  [AssignmentStatus.INTERVIEW_SCHEDULED]: "Interview Scheduled",
  [AssignmentStatus.SELECTED]: "Selected",
  [AssignmentStatus.REJECTED]: "Rejected",
  [AssignmentStatus.ON_HOLD]: "On Hold",
};

/** Solid dot colors for status indicators (paired with a label). */
export const statusDotClasses: Record<AssignmentStatus, string> = {
  [AssignmentStatus.PENDING]: "bg-amber-500",
  [AssignmentStatus.SENT]: "bg-sky-500",
  [AssignmentStatus.INTERVIEW_SCHEDULED]: "bg-indigo-500",
  [AssignmentStatus.SELECTED]: "bg-emerald-500",
  [AssignmentStatus.REJECTED]: "bg-rose-500",
  [AssignmentStatus.ON_HOLD]: "bg-zinc-400",
};

export const statusBadgeClasses: Record<AssignmentStatus, string> = {
  [AssignmentStatus.PENDING]: "border-amber-200 bg-amber-50 text-amber-700",
  [AssignmentStatus.SENT]: "border-sky-200 bg-sky-50 text-sky-700",
  [AssignmentStatus.INTERVIEW_SCHEDULED]:
    "border-indigo-200 bg-indigo-50 text-indigo-700",
  [AssignmentStatus.SELECTED]: "border-emerald-200 bg-emerald-50 text-emerald-700",
  [AssignmentStatus.REJECTED]: "border-rose-200 bg-rose-50 text-rose-700",
  [AssignmentStatus.ON_HOLD]: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

// ---------------------------------------------------------------------------
// Organization types
// ---------------------------------------------------------------------------
export const organizationTypes = [
  OrganizationType.UNIVERSITY,
  OrganizationType.COLLEGE,
  OrganizationType.CORPORATE,
  OrganizationType.SCHOOL,
  OrganizationType.NGO,
  OrganizationType.GOVERNMENT,
  OrganizationType.HOSPITAL,
  OrganizationType.OTHER,
] as const;

export const organizationTypeLabels: Record<OrganizationType, string> = {
  [OrganizationType.UNIVERSITY]: "University",
  [OrganizationType.COLLEGE]: "College",
  [OrganizationType.CORPORATE]: "Corporate",
  [OrganizationType.SCHOOL]: "School",
  [OrganizationType.NGO]: "NGO",
  [OrganizationType.GOVERNMENT]: "Government",
  [OrganizationType.HOSPITAL]: "Hospital",
  [OrganizationType.OTHER]: "Other",
};

export const organizationTypeBadgeClasses: Record<OrganizationType, string> = {
  [OrganizationType.UNIVERSITY]: "border-violet-200 bg-violet-50 text-violet-700",
  [OrganizationType.COLLEGE]: "border-indigo-200 bg-indigo-50 text-indigo-700",
  [OrganizationType.CORPORATE]: "border-sky-200 bg-sky-50 text-sky-700",
  [OrganizationType.SCHOOL]: "border-cyan-200 bg-cyan-50 text-cyan-700",
  [OrganizationType.NGO]: "border-emerald-200 bg-emerald-50 text-emerald-700",
  [OrganizationType.GOVERNMENT]: "border-amber-200 bg-amber-50 text-amber-700",
  [OrganizationType.HOSPITAL]: "border-rose-200 bg-rose-50 text-rose-700",
  [OrganizationType.OTHER]: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------
export const eventTypes = [
  EventType.YOGA_SESSION,
  EventType.WORKSHOP,
  EventType.SEMINAR,
  EventType.WEBINAR,
  EventType.FDP,
  EventType.TRAINING_PROGRAM,
  EventType.INDUCTION_PROGRAM,
  EventType.WELLNESS_SESSION,
  EventType.CORPORATE_SESSION,
  EventType.CONSULTING,
  EventType.OTHER,
] as const;

export const eventTypeLabels: Record<EventType, string> = {
  [EventType.YOGA_SESSION]: "Yoga Session",
  [EventType.WORKSHOP]: "Workshop",
  [EventType.SEMINAR]: "Seminar",
  [EventType.WEBINAR]: "Webinar",
  [EventType.FDP]: "Faculty Development Program",
  [EventType.TRAINING_PROGRAM]: "Training Program",
  [EventType.INDUCTION_PROGRAM]: "Induction Program",
  [EventType.WELLNESS_SESSION]: "Wellness Session",
  [EventType.CORPORATE_SESSION]: "Corporate Session",
  [EventType.CONSULTING]: "Consulting",
  [EventType.OTHER]: "Other",
};

// ---------------------------------------------------------------------------
// Event status
// ---------------------------------------------------------------------------
export const eventStatuses = [
  EventStatus.PLANNED,
  EventStatus.CONFIRMED,
  EventStatus.COMPLETED,
  EventStatus.CANCELLED,
  EventStatus.POSTPONED,
] as const;

export const eventStatusLabels: Record<EventStatus, string> = {
  [EventStatus.PLANNED]: "Planned",
  [EventStatus.CONFIRMED]: "Confirmed",
  [EventStatus.COMPLETED]: "Completed",
  [EventStatus.CANCELLED]: "Cancelled",
  [EventStatus.POSTPONED]: "Postponed",
};

export const eventStatusBadgeClasses: Record<EventStatus, string> = {
  [EventStatus.PLANNED]: "border-sky-200 bg-sky-50 text-sky-700",
  [EventStatus.CONFIRMED]: "border-indigo-200 bg-indigo-50 text-indigo-700",
  [EventStatus.COMPLETED]: "border-emerald-200 bg-emerald-50 text-emerald-700",
  [EventStatus.CANCELLED]: "border-rose-200 bg-rose-50 text-rose-700",
  [EventStatus.POSTPONED]: "border-amber-200 bg-amber-50 text-amber-700",
};

// ---------------------------------------------------------------------------
// Event trainer roles
// ---------------------------------------------------------------------------
export const eventTrainerRoles = [
  EventTrainerRole.LEAD,
  EventTrainerRole.CO_TRAINER,
  EventTrainerRole.ASSISTANT,
  EventTrainerRole.GUEST,
] as const;

export const eventTrainerRoleLabels: Record<EventTrainerRole, string> = {
  [EventTrainerRole.LEAD]: "Lead Trainer",
  [EventTrainerRole.CO_TRAINER]: "Co-Trainer",
  [EventTrainerRole.ASSISTANT]: "Assistant",
  [EventTrainerRole.GUEST]: "Guest",
};

// ---------------------------------------------------------------------------
// Document types
// ---------------------------------------------------------------------------
export const documentTypes = [
  DocumentType.PROPOSAL,
  DocumentType.INVOICE,
  DocumentType.ATTENDANCE_SHEET,
  DocumentType.PHOTO,
  DocumentType.FEEDBACK_REPORT,
  DocumentType.COMPLETION_REPORT,
  DocumentType.OTHER,
] as const;

export const documentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.PROPOSAL]: "Proposal",
  [DocumentType.INVOICE]: "Invoice",
  [DocumentType.ATTENDANCE_SHEET]: "Attendance Sheet",
  [DocumentType.PHOTO]: "Photo",
  [DocumentType.FEEDBACK_REPORT]: "Feedback Report",
  [DocumentType.COMPLETION_REPORT]: "Completion Report",
  [DocumentType.OTHER]: "Other",
};

// ---------------------------------------------------------------------------
// Activity types (timeline)
// ---------------------------------------------------------------------------
export const activityTypes = [
  ActivityType.LEAD_RECEIVED,
  ActivityType.PROPOSAL_SHARED,
  ActivityType.CONFIRMED,
  ActivityType.TRAINER_ASSIGNED,
  ActivityType.COMPLETED,
  ActivityType.STATUS_CHANGE,
  ActivityType.DOCUMENT_ADDED,
  ActivityType.NOTE,
  ActivityType.OTHER,
] as const;

export const activityTypeLabels: Record<ActivityType, string> = {
  [ActivityType.LEAD_RECEIVED]: "Lead Received",
  [ActivityType.PROPOSAL_SHARED]: "Proposal Shared",
  [ActivityType.CONFIRMED]: "Event Confirmed",
  [ActivityType.TRAINER_ASSIGNED]: "Trainer Assigned",
  [ActivityType.COMPLETED]: "Event Completed",
  [ActivityType.STATUS_CHANGE]: "Status Changed",
  [ActivityType.DOCUMENT_ADDED]: "Document Added",
  [ActivityType.NOTE]: "Note",
  [ActivityType.OTHER]: "Other",
};
