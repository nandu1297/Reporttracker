-- Additive only: nothing existing is changed or dropped.

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "defaultClientRate" INTEGER NOT NULL DEFAULT 2000,
    "defaultEmployeeRate" INTEGER NOT NULL DEFAULT 400,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- Uniform defaults start at the values the app used so far
INSERT INTO "Setting" ("id") VALUES ('default') ON CONFLICT ("id") DO NOTHING;

-- AlterTable: optional specific rates (null = use the uniform default)
ALTER TABLE "Client" ADD COLUMN "rateOverride" INTEGER;
ALTER TABLE "Employee" ADD COLUMN "rateOverride" INTEGER;

-- Clients that already had a non-standard rate keep behaving the same way
UPDATE "Client" SET "rateOverride" = "rate" WHERE "rate" <> 2000;
