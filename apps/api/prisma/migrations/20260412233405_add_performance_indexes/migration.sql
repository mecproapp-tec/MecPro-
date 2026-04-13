-- CreateIndex
CREATE INDEX "Client_tenantId_name_idx" ON "Client"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Client_tenantId_createdAt_idx" ON "Client"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Estimate_tenantId_status_idx" ON "Estimate"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Estimate_tenantId_createdAt_idx" ON "Estimate"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_status_idx" ON "Invoice"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_createdAt_idx" ON "Invoice"("tenantId", "createdAt");
