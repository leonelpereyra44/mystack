-- CreateTable
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "preapprovalId" TEXT,
    "paymentId" TEXT,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "externalReference" TEXT,
    "rawPayload" JSONB,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ignoredReason" TEXT,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_paymentId_action_key" ON "payment_events"("paymentId", "action");

-- CreateIndex
CREATE INDEX "payment_events_businessId_processedAt_idx" ON "payment_events"("businessId", "processedAt");

-- CreateIndex
CREATE INDEX "payment_events_preapprovalId_idx" ON "payment_events"("preapprovalId");

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;