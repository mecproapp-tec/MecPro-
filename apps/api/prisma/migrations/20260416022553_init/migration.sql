/*
  Warnings:

  - You are about to drop the column `items` on the `Budget` table. All the data in the column will be lost.
  - You are about to alter the column `total` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `Estimate` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `EstimateItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `EstimateItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `InvoiceItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `InvoiceItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the column `token` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `Subscription` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - A unique constraint covering the columns `[tokenHash]` on the table `RefreshToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tokenHash` to the `RefreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Appointment_tenantId_idx";

-- DropIndex
DROP INDEX "Budget_clientId_idx";

-- DropIndex
DROP INDEX "Budget_tenantId_idx";

-- DropIndex
DROP INDEX "Client_phone_idx";

-- DropIndex
DROP INDEX "Client_tenantId_createdAt_idx";

-- DropIndex
DROP INDEX "Client_tenantId_idx";

-- DropIndex
DROP INDEX "Estimate_clientId_idx";

-- DropIndex
DROP INDEX "Estimate_pdf_key_idx";

-- DropIndex
DROP INDEX "Estimate_pdf_url_idx";

-- DropIndex
DROP INDEX "Estimate_status_idx";

-- DropIndex
DROP INDEX "Estimate_tenantId_createdAt_idx";

-- DropIndex
DROP INDEX "Estimate_tenantId_idx";

-- DropIndex
DROP INDEX "Estimate_tenantId_pdf_status_idx";

-- DropIndex
DROP INDEX "Estimate_tenantId_status_idx";

-- DropIndex
DROP INDEX "EstimateItem_estimateId_id_key";

-- DropIndex
DROP INDEX "Invoice_clientId_idx";

-- DropIndex
DROP INDEX "Invoice_number_idx";

-- DropIndex
DROP INDEX "Invoice_pdf_key_idx";

-- DropIndex
DROP INDEX "Invoice_pdf_url_idx";

-- DropIndex
DROP INDEX "Invoice_status_idx";

-- DropIndex
DROP INDEX "Invoice_tenantId_createdAt_idx";

-- DropIndex
DROP INDEX "Invoice_tenantId_idx";

-- DropIndex
DROP INDEX "Invoice_tenantId_pdf_status_idx";

-- DropIndex
DROP INDEX "Invoice_tenantId_status_idx";

-- DropIndex
DROP INDEX "InvoiceItem_invoiceId_id_key";

-- DropIndex
DROP INDEX "Notification_tenantId_idx";

-- DropIndex
DROP INDEX "Payment_status_idx";

-- DropIndex
DROP INDEX "Payment_tenantId_idx";

-- DropIndex
DROP INDEX "PendingSubscription_status_idx";

-- DropIndex
DROP INDEX "RefreshToken_token_idx";

-- DropIndex
DROP INDEX "RefreshToken_token_key";

-- DropIndex
DROP INDEX "RefreshToken_userId_idx";

-- DropIndex
DROP INDEX "Subscription_status_idx";

-- DropIndex
DROP INDEX "Subscription_tenantId_idx";

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "items",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "EstimateItem" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "InvoiceItem" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "token",
ADD COLUMN     "sessionToken" TEXT,
ADD COLUMN     "tokenHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" SERIAL NOT NULL,
    "budgetId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "issPercent" DOUBLE PRECISION,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetItem_budgetId_idx" ON "BudgetItem"("budgetId");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_date_idx" ON "Appointment"("tenantId", "date");

-- CreateIndex
CREATE INDEX "Budget_tenantId_status_createdAt_idx" ON "Budget"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Budget_deletedAt_idx" ON "Budget"("deletedAt");

-- CreateIndex
CREATE INDEX "Client_tenantId_deletedAt_idx" ON "Client"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Client_tenantId_phone_idx" ON "Client"("tenantId", "phone");

-- CreateIndex
CREATE INDEX "Client_createdAt_idx" ON "Client"("createdAt");

-- CreateIndex
CREATE INDEX "ContactMessage_tenantId_status_idx" ON "ContactMessage"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- CreateIndex
CREATE INDEX "Estimate_tenantId_status_createdAt_idx" ON "Estimate"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Estimate_tenantId_clientId_idx" ON "Estimate"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "Estimate_deletedAt_idx" ON "Estimate"("deletedAt");

-- CreateIndex
CREATE INDEX "Estimate_shareToken_idx" ON "Estimate"("shareToken");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_status_createdAt_idx" ON "Invoice"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_number_idx" ON "Invoice"("tenantId", "number");

-- CreateIndex
CREATE INDEX "Invoice_deletedAt_idx" ON "Invoice"("deletedAt");

-- CreateIndex
CREATE INDEX "Invoice_shareToken_idx" ON "Invoice"("shareToken");

-- CreateIndex
CREATE INDEX "Notification_tenantId_createdAt_idx" ON "Notification"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_tenantId_status_idx" ON "Payment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "PendingSubscription_trialEndsAt_idx" ON "PendingSubscription"("trialEndsAt");

-- CreateIndex
CREATE INDEX "PublicShare_expiresAt_idx" ON "PublicShare"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_sessionToken_idx" ON "RefreshToken"("userId", "sessionToken");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "Subscription_tenantId_status_idx" ON "Subscription"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Subscription_endDate_idx" ON "Subscription"("endDate");

-- CreateIndex
CREATE INDEX "SuperAdmin_email_idx" ON "SuperAdmin"("email");

-- CreateIndex
CREATE INDEX "Tenant_paymentStatus_idx" ON "Tenant"("paymentStatus");

-- CreateIndex
CREATE INDEX "UserSession_lastActivity_idx" ON "UserSession"("lastActivity");

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
