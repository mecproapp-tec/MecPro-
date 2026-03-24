/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "address" TEXT,
ADD COLUMN     "document" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "shareToken" TEXT,
ADD COLUMN     "shareTokenExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_shareToken_key" ON "Invoice"("shareToken");
