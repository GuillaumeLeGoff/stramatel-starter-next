"use client";

import { PageHeader } from "@/shared/components/ui/page-header";
import { ScheduleCalendar } from "@/features/schedule/components/ScheduleCalendar";
import { ScheduleProvider } from "@/features/schedule/store/ScheduleProvider";

export default function SchedulePage() {
  return (
    <ScheduleProvider>
      <div className="space-y-6 h-full flex flex-col">
        <PageHeader
          title="Planification"
         
        />

        <div className="flex-1 min-h-0">
          <ScheduleCalendar />
        </div>
      </div>
    </ScheduleProvider>
  );
} 