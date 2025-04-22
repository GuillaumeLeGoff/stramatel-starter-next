"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <div className="text-sm text-neutral-500">
          Bienvenue, {user?.username}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cartes statistiques */}
        <StatCard title="Total utilisateurs" value="1" />
        <StatCard title="Tableaux" value="0" />
        <StatCard title="Matchs" value="0" />
        <StatCard title="Équipes" value="0" />
      </div>

      {/* Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-neutral-500">
              Aucune activité récente à afficher.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-1">
          <span className="text-neutral-500 text-sm">{title}</span>
          <span className="text-3xl font-bold">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}
