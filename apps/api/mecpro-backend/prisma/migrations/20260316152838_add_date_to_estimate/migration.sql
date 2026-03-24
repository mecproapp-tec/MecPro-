/*
  Warnings:

  - Added the required column `date` to the `Estimate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;
