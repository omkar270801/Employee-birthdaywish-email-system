/*
  Warnings:

  - You are about to drop the column `employeeCode` on the `Employee` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Employee_employeeCode_key";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "employeeCode";
