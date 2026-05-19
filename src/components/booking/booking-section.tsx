"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBusinessTerminology } from "@/lib/business-types";
import { BookingModal } from "@/components/booking/booking-modal";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string | null;
  staff?: { id: string }[];
}

interface Staff {
  id: string;
  name: string;
}

interface Schedule {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

interface BookingSectionProps {
  businessId: string;
  businessSlug: string;
  services: Service[];
  staff: Staff[];
  schedules: Schedule[];
  timezone: string;
  businessType?: string;
  bookingInterval?: number;
  showPrices?: boolean;
  showDurations?: boolean;
  welcomeMessage?: string | null;
}

export function BookingSection({
  businessId,
  businessSlug,
  services,
  staff,
  schedules,
  timezone,
  businessType = "salon",
  bookingInterval = 30,
  showPrices = true,
  showDurations = true,
  welcomeMessage,
}: BookingSectionProps) {
  const terminology = getBusinessTerminology(businessType);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className="gap-2"
        onClick={() => setModalOpen(true)}
      >
        <CalendarCheck className="h-5 w-5" />
        Agendar {terminology.appointment.toLowerCase()}
      </Button>

      <BookingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        businessId={businessId}
        businessSlug={businessSlug}
        services={services}
        staff={staff}
        schedules={schedules}
        timezone={timezone}
        businessType={businessType}
        bookingInterval={bookingInterval}
        showPrices={showPrices}
        showDurations={showDurations}
        welcomeMessage={welcomeMessage}
      />
    </>
  );
}
