-- CreateTable
CREATE TABLE "PendingSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingSubscription_email_key" ON "PendingSubscription"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PendingSubscription_subscriptionId_key" ON "PendingSubscription"("subscriptionId");
