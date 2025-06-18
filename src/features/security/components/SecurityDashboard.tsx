"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useSecurityIndicators } from "../hooks/useSecurityIndicators";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AlertCircle, Calendar, Clock, TrendingUp, Shield, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export function SecurityDashboard() {
  const { indicators, loading, error, refresh, updateIndicators } = useSecurityIndicators(60000); // Refresh every minute
  const { user } = useAuth();

  const handleRefresh = async () => {
    if (user) {
      await updateIndicators(user.id);
    }
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center gap-2 pt-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Date et heure */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Date & Heure</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {indicators?.currentDate || '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {indicators?.currentTime || '--:--:--'}
            </p>
          </CardContent>
        </Card>

        {/* Jours sans accident */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jours sans accident</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {indicators?.daysWithoutAccident ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Record: {indicators?.recordDaysWithoutAccident ?? 0} jours
            </p>
          </CardContent>
        </Card>

        {/* Accidents cette année */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accidents cette année</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {indicators?.currentYearAccidents ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Ce mois: {indicators?.currentMonthAccidents ?? 0}
            </p>
          </CardContent>
        </Card>

        {/* Dernier accident */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernier accident</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {indicators?.lastAccidentDate || 'Aucun'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails des compteurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jours sans accident détaillés */}
        <Card>
          <CardHeader>
            <CardTitle>Compteurs Détaillés</CardTitle>
            <CardDescription>Répartition par type d'accident</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Jours sans accident (avec arrêt)</span>
              <Badge variant="secondary">
                {indicators?.daysWithoutAccidentWithStop ?? 0} jours
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Jours sans accident (sans arrêt)</span>
              <Badge variant="secondary">
                {indicators?.daysWithoutAccidentWithoutStop ?? 0} jours
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques annuelles */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques Annuelles</CardTitle>
            <CardDescription>Répartition des événements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Accidents avec arrêt</span>
              <Badge variant="destructive">
                {indicators?.currentYearAccidentsWithStop ?? 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Accidents sans arrêt</span>
              <Badge variant="outline">
                {indicators?.currentYearAccidentsWithoutStop ?? 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Soins bénins</span>
              <Badge variant="secondary">
                {indicators?.currentYearMinorCare ?? 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Presqu'accidents</span>
              <Badge variant="outline">
                {indicators?.currentYearNearMiss ?? 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Situations dangereuses</span>
              <Badge variant="outline">
                {indicators?.currentYearDangerousSituations ?? 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 