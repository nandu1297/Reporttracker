-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "isSelf" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN "isSelf" BOOLEAN NOT NULL DEFAULT false;

-- Built-in "Self" employee (reuses an existing employee already named Self)
INSERT INTO "Employee" ("id", "name", "isSelf") VALUES ('self-employee', 'Self', true)
ON CONFLICT ("name") DO UPDATE SET "isSelf" = true;

-- Rows already assigned to an employee named Self become self rows with no payment owed
UPDATE "Assignment" SET "isSelf" = true WHERE "employeeId" IN (SELECT "id" FROM "Employee" WHERE "isSelf");
DELETE FROM "EmployeePayment" WHERE "assignmentId" IN (SELECT "id" FROM "Assignment" WHERE "isSelf");
