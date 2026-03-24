/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `Estimate` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "shareToken" TEXT,
ADD COLUMN     "shareTokenExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Estimate_shareToken_key" ON "Estimate"("shareToken");
