"use client";

import { PageHeader } from "@/shared/components/ui/page-header";
import { ScheduleManager } from "@/features/schedule/components/ScheduleManager";

export default function SchedulePage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader title="Planification" />

      <div className="flex-1 min-h-0">
        <ScheduleManager />
      </div>
    </div>
  );
}
