/*
  Warnings:

  - A unique constraint covering the columns `[subscriptionId]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "paymentStatus" TEXT DEFAULT 'pending',
ADD COLUMN     "subscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_subscriptionId_key" ON "Tenant"("subscriptionId");
