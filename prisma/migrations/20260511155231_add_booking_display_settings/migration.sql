-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "minBookingNotice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "showDurations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showPrices" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "welcomeMessage" TEXT;
