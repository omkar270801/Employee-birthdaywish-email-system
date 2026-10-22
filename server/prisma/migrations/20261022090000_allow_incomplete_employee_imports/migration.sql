-- Allow name-only employee records from spreadsheet imports.
ALTER TABLE "Employee"
  ALTER COLUMN "email" DROP NOT NULL,
  ALTER COLUMN "designation" DROP NOT NULL,
  ALTER COLUMN "dateOfBirth" DROP NOT NULL;
