-- AlterTable
ALTER TABLE "Trainer"
ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "location" TEXT,
ADD COLUMN "totalTrainingExperience" INTEGER,
ADD COLUMN "industryExperience" INTEGER,
ADD COLUMN "primaryRole" TEXT,
ADD COLUMN "areasOfExpertise" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "detailedExpertise" TEXT,
ADD COLUMN "trainingTypesDelivered" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "availability" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "expectedChargesPerDay" TEXT,
ADD COLUMN "languages" TEXT,
ADD COLUMN "declarationAccepted" BOOLEAN NOT NULL DEFAULT false;
