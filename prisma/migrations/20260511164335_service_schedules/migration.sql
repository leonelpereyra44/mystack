-- CreateTable
CREATE TABLE "service_schedules" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "service_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_schedules_serviceId_dayOfWeek_key" ON "service_schedules"("serviceId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "service_schedules" ADD CONSTRAINT "service_schedules_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
