/*
  Warnings:

  - A unique constraint covering the columns `[estimateId,id]` on the table `EstimateItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invoiceId,id]` on the table `InvoiceItem` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "EstimateItem" ADD COLUMN     "issPercent" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "EstimateItem_estimateId_id_key" ON "EstimateItem"("estimateId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceItem_invoiceId_id_key" ON "InvoiceItem"("invoiceId", "id");
