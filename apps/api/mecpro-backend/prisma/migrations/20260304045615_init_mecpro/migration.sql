/*
  Warnings:

  - The primary key for the `Appointment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `customerId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledAt` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Appointment` table. All the data in the column will be lost.
  - The `id` column on the `Appointment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Estimate` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `customerId` on the `Estimate` table. All the data in the column will be lost.
  - The `id` column on the `Estimate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `total` on the `Estimate` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - The primary key for the `EstimateItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `EstimateItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `price` on the `EstimateItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `total` on the `EstimateItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - The primary key for the `Invoice` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `customerId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceNumber` on the `Invoice` table. All the data in the column will be lost.
  - The `id` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `estimateId` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `total` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - The primary key for the `InvoiceItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `InvoiceItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `price` on the `InvoiceItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `total` on the `InvoiceItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - The primary key for the `Notification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Notification` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[number]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clientId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `Estimate` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `estimateId` on the `EstimateItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `clientId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `invoiceId` on the `InvoiceItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Estimate" DROP CONSTRAINT "Estimate_customerId_fkey";

-- DropForeignKey
ALTER TABLE "EstimateItem" DROP CONSTRAINT "EstimateItem_estimateId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_estimateId_fkey";

-- DropForeignKey
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_invoiceId_fkey";

-- AlterTable
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_pkey",
DROP COLUMN "customerId",
DROP COLUMN "notes",
DROP COLUMN "scheduledAt",
DROP COLUMN "status",
ADD COLUMN     "clientId" INTEGER NOT NULL,
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Estimate" DROP CONSTRAINT "Estimate_pkey",
DROP COLUMN "customerId",
ADD COLUMN     "clientId" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "total" SET DATA TYPE DOUBLE PRECISION,
ADD CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "EstimateItem" DROP CONSTRAINT "EstimateItem_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "estimateId",
ADD COLUMN     "estimateId" INTEGER NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "total" SET DATA TYPE DOUBLE PRECISION,
ADD CONSTRAINT "EstimateItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_pkey",
DROP COLUMN "customerId",
DROP COLUMN "invoiceNumber",
ADD COLUMN     "clientId" INTEGER NOT NULL,
ADD COLUMN     "number" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "estimateId",
ADD COLUMN     "estimateId" INTEGER,
ALTER COLUMN "total" SET DATA TYPE DOUBLE PRECISION,
ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "invoiceId",
ADD COLUMN     "invoiceId" INTEGER NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "total" SET DATA TYPE DOUBLE PRECISION,
ADD CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Notification_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Customer";

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" INTEGER,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vehicle" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_estimateId_key" ON "Invoice"("estimateId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_id_fkey" FOREIGN KEY ("id") REFERENCES "Invoice"("estimateId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateItem" ADD CONSTRAINT "EstimateItem_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
