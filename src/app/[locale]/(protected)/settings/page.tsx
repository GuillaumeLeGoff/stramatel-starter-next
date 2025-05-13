"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/ui/page-header";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>
              Gérez vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Les paramètres de profil seront disponibles prochainement.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Préférences</CardTitle>
            <CardDescription>Personnalisez votre expérience</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Les préférences seront disponibles prochainement.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
