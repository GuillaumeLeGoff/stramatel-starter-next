"use client";

import { PageHeader } from "@/shared/components/ui/page-header";
import { SettingsForm } from "@/features/setting";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" />

      <div className="grid gap-6">
        <SettingsForm />
      </div>
    </div>
  );
}
