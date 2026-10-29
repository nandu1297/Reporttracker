-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('ASSIGNED', 'UNDER_REVIEW', 'READY_TO_SEND', 'SENT');

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN "status" "ReportStatus" NOT NULL DEFAULT 'ASSIGNED';
