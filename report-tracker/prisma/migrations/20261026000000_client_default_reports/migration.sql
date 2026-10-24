-- AlterTable
ALTER TABLE "Client" ADD COLUMN "defaultReports" INTEGER NOT NULL DEFAULT 1;

-- Trevcon always sends 2 reports
UPDATE "Client" SET "defaultReports" = 2 WHERE lower("name") = 'trevcon';
