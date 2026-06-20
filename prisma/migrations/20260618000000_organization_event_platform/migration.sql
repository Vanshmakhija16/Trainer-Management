-- =============================================================================
-- Event & Relationship Management Platform
--
-- Strategy: NON-DESTRUCTIVE. The old `University` table is renamed in place to
-- `Organization` (preserving all rows), and `Assignment.universityId` is
-- repointed to `organizationId`. New CRM/event tables are then created.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. New enums
-- ----------------------------------------------------------------------------
CREATE TYPE "OrganizationType" AS ENUM ('UNIVERSITY', 'COLLEGE', 'CORPORATE', 'SCHOOL', 'NGO', 'GOVERNMENT', 'HOSPITAL', 'OTHER');
CREATE TYPE "EventType" AS ENUM ('YOGA_SESSION', 'WORKSHOP', 'SEMINAR', 'WEBINAR', 'FDP', 'TRAINING_PROGRAM', 'INDUCTION_PROGRAM', 'WELLNESS_SESSION', 'CORPORATE_SESSION', 'CONSULTING', 'OTHER');
CREATE TYPE "EventStatus" AS ENUM ('PLANNED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'POSTPONED');
CREATE TYPE "EventTrainerRole" AS ENUM ('LEAD', 'CO_TRAINER', 'ASSISTANT', 'GUEST');
CREATE TYPE "DocumentType" AS ENUM ('PROPOSAL', 'INVOICE', 'ATTENDANCE_SHEET', 'PHOTO', 'FEEDBACK_REPORT', 'COMPLETION_REPORT', 'OTHER');
CREATE TYPE "ActivityType" AS ENUM ('LEAD_RECEIVED', 'PROPOSAL_SHARED', 'CONFIRMED', 'TRAINER_ASSIGNED', 'COMPLETED', 'NOTE', 'STATUS_CHANGE', 'DOCUMENT_ADDED', 'OTHER');

-- ----------------------------------------------------------------------------
-- 2. Rename University -> Organization (preserve data)
-- ----------------------------------------------------------------------------
ALTER TABLE "University" RENAME TO "Organization";
ALTER TABLE "Organization" RENAME CONSTRAINT "University_pkey" TO "Organization_pkey";

-- Add the new Organization columns. All nullable/defaulted so existing rows
-- survive untouched. `type` defaults to OTHER; classify existing rows later.
ALTER TABLE "Organization"
  ADD COLUMN "type" "OrganizationType" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "website" TEXT,
  ADD COLUMN "industry" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "country" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing universities were genuinely universities — reclassify them.
UPDATE "Organization" SET "type" = 'UNIVERSITY' WHERE "type" = 'OTHER';

-- ----------------------------------------------------------------------------
-- 3. Repoint Assignment.universityId -> organizationId
-- ----------------------------------------------------------------------------
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_universityId_fkey";
ALTER TABLE "Assignment" RENAME COLUMN "universityId" TO "organizationId";
ALTER INDEX "Assignment_trainerId_universityId_key" RENAME TO "Assignment_trainerId_organizationId_key";
ALTER TABLE "Assignment"
  ADD CONSTRAINT "Assignment_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 4. Drop the unused Trainee stub
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS "Trainee";

-- ----------------------------------------------------------------------------
-- 5. OrganizationContact
-- ----------------------------------------------------------------------------
CREATE TABLE "OrganizationContact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "linkedin" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationContact_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrganizationContact_organizationId_idx" ON "OrganizationContact"("organizationId");
ALTER TABLE "OrganizationContact"
  ADD CONSTRAINT "OrganizationContact_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 6. Event
-- ----------------------------------------------------------------------------
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL DEFAULT 'OTHER',
    "organizationId" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "venue" TEXT,
    "expectedParticipants" INTEGER,
    "actualParticipants" INTEGER,
    "status" "EventStatus" NOT NULL DEFAULT 'PLANNED',
    "revenue" DECIMAL(12,2),
    "expenses" DECIMAL(12,2),
    "profit" DECIMAL(12,2),
    "feedbackRating" DOUBLE PRECISION,
    "clientFeedback" TEXT,
    "internalNotes" TEXT,
    "hostName" TEXT,
    "hostPhone" TEXT,
    "hostEmail" TEXT,
    "leadSource" TEXT,
    "leadOwner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Event_organizationId_idx" ON "Event"("organizationId");
CREATE INDEX "Event_eventDate_idx" ON "Event"("eventDate");
CREATE INDEX "Event_status_idx" ON "Event"("status");
ALTER TABLE "Event"
  ADD CONSTRAINT "Event_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 7. EventTrainer (explicit M:N)
-- ----------------------------------------------------------------------------
CREATE TABLE "EventTrainer" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "role" "EventTrainerRole" NOT NULL DEFAULT 'LEAD',
    "payout" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventTrainer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EventTrainer_eventId_trainerId_key" ON "EventTrainer"("eventId", "trainerId");
CREATE INDEX "EventTrainer_trainerId_idx" ON "EventTrainer"("trainerId");
ALTER TABLE "EventTrainer"
  ADD CONSTRAINT "EventTrainer_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventTrainer"
  ADD CONSTRAINT "EventTrainer_trainerId_fkey"
  FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 8. EventDocument
-- ----------------------------------------------------------------------------
CREATE TABLE "EventDocument" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EventDocument_eventId_idx" ON "EventDocument"("eventId");
ALTER TABLE "EventDocument"
  ADD CONSTRAINT "EventDocument_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 9. EventActivity
-- ----------------------------------------------------------------------------
CREATE TABLE "EventActivity" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL DEFAULT 'NOTE',
    "description" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventActivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EventActivity_eventId_idx" ON "EventActivity"("eventId");
ALTER TABLE "EventActivity"
  ADD CONSTRAINT "EventActivity_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
