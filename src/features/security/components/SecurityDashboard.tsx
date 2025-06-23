"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { useSecurityIndicators } from "../hooks/useSecurityIndicators";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useEffect, useState } from "react";
import { MonitoringStartDateForm } from "./MonitoringStartDateForm";

export function SecurityDashboard() {
  const { indicators, loading, error, refresh, updateIndicators } = useSecurityIndicators(60000); // Refresh every minute
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fonction pour formater les dates
  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'Aucun';
    if (typeof date === 'string') return date;
    return date.toLocaleDateString('fr-FR');
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center gap-2 pt-6">
          <span className="text-destructive">{error}</span>
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicateurs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date et heure */}
        <StatCard 
          title="Date & Heure" 
          value={indicators?.currentDate || '--'}
          subtitle={indicators?.currentTime || '--:--:--'}
        />

        {/* Jours sans accident */}
        <StatCard 
          title="Jours sans accident" 
          value={indicators?.daysWithoutAccident ?? 0}
          subtitle={`Record: ${indicators?.recordDaysWithoutAccident ?? 0} jours`}
        />

        {/* Accidents cette année */}
        <StatCard 
          title="Accidents cette année" 
          value={indicators?.currentYearAccidents ?? 0}
          subtitle={`Ce mois: ${indicators?.currentMonthAccidents ?? 0}`}
        />

        {/* Dernier accident */}
        <StatCard 
          title="Dernier accident" 
          value={indicators?.lastAccidentDate || 'Aucun'}
        />
      </div>

      {/* Détails des compteurs */}
      <div className="grid grid-cols-1 gap-4">
        {/* Jours sans accident détaillés */}
        <Card>
          <CardHeader>
            <CardTitle>Compteurs Détaillés</CardTitle>
            <CardDescription>Répartition par type d'accident</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Avec arrêt</span>
              <Badge>
                {indicators?.daysWithoutAccidentWithStop ?? 0} jours
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Sans arrêt</span>
              <Badge>
                {indicators?.daysWithoutAccidentWithoutStop ?? 0} jours
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques annuelles */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques Annuelles</CardTitle>
            <CardDescription>Répartition des accidents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Avec arrêt</span>
              <Badge>
                {indicators?.currentYearAccidentsWithStop ?? 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Sans arrêt</span>
              <Badge>
                {indicators?.currentYearAccidentsWithoutStop ?? 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bouton de configuration */}
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                Configuration de la sécurité
              </DialogTitle>
              <DialogDescription>
                Configurez les paramètres de suivi des événements de sécurité
              </DialogDescription>
            </DialogHeader>
            <MonitoringStartDateForm />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-1">
          <span className="text-neutral-500 text-sm">{title}</span>
          <span className="text-xl font-bold">{value}</span>
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 