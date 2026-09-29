-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "department" DROP NOT NULL,
ALTER COLUMN "department" SET DEFAULT 'General';
