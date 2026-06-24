-- CreateEnum
CREATE TYPE "TrainerType" AS ENUM ('YOGA', 'CORPORATE', 'WELLNESS', 'FITNESS', 'OTHER');

-- AlterTable
ALTER TABLE "Trainer" ADD COLUMN     "certification" TEXT,
ADD COLUMN     "chargesPerDay" INTEGER,
ADD COLUMN     "onboardedYear" INTEGER,
ADD COLUMN     "trainerType" "TrainerType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "yogaStyles" TEXT[] DEFAULT ARRAY[]::TEXT[];
