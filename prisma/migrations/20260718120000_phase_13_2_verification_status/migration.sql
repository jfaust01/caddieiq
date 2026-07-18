-- CreateEnum
CREATE TYPE "MappingVerificationStatus" AS ENUM ('PENDING_REVIEW', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "tournament_course_mappings" ADD COLUMN "verificationStatus" "MappingVerificationStatus" NOT NULL DEFAULT 'PENDING_REVIEW';

-- AlterTable
ALTER TABLE "tournament_course_mappings" ADD COLUMN "rejectionReason" TEXT;
