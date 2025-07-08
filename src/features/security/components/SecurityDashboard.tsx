"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Separator } from "@/shared/components/ui/separator";
import { Progress } from "@/shared/components/ui/progress";
import { useSecurityIndicators } from "../hooks/useSecurityIndicators";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useEffect, useState } from "react";
import { MonitoringStartDateForm } from "./MonitoringStartDateForm";
import { 
  Shield, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award, 
  AlertTriangle,
  Activity,
  Settings,
  Target,
  BarChart3,
  History,
  RefreshCw
} from "lucide-react";

export function SecurityDashboard() {
  const { indicators, loading, error, refresh, updateIndicators } = useSecurityIndicators(60000); // Refresh every minute
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fonction pour formater les dates
  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'Aucune donnée';
    if (typeof date === 'string') return date;
    return date.toLocaleDateString('fr-FR');
  };

  // Calculer le pourcentage de progression vers le record
  const getRecordProgress = () => {
    if (!indicators?.recordDaysWithoutAccident || !indicators?.daysWithoutAccident) return 0;
    return Math.min(100, (indicators.daysWithoutAccident / indicators.recordDaysWithoutAccident) * 100);
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center gap-2 pt-6">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-destructive">{error}</span>
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec date/heure et actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Tableau de Bord</h2>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{indicators?.currentDate || '--'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{indicators?.currentTime || '--:--:--'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Configuration de la sécurité</DialogTitle>
                <DialogDescription>
                  Configurez les paramètres de suivi des événements de sécurité
                </DialogDescription>
              </DialogHeader>
              <MonitoringStartDateForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Compteurs principaux de jours sans accident */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jours sans accident global */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-green-600" />
              Jours sans accident
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-green-600">
                {indicators?.daysWithoutAccident ?? 0}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression vers le record</span>
                  <span>{getRecordProgress().toFixed(0)}%</span>
                </div>
                <Progress value={getRecordProgress()} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Record: {indicators?.recordDaysWithoutAccident ?? 0} jours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

                 {/* Jours sans accident avec arrêt */}
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="flex items-center gap-2 text-base">
               <AlertTriangle className="h-5 w-5 text-red-600" />
               Avec arrêt de travail
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-2">
               <div className="text-3xl font-bold text-red-600">
                 {indicators?.daysWithoutAccidentWithStop ?? 0}
               </div>
               <p className="text-sm text-muted-foreground">
                 Jours sans accident avec arrêt
               </p>
             </div>
           </CardContent>
         </Card>

         {/* Jours sans accident sans arrêt */}
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="flex items-center gap-2 text-base">
               <Activity className="h-5 w-5 text-orange-600" />
               Sans arrêt de travail
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-2">
               <div className="text-3xl font-bold text-orange-600">
                 {indicators?.daysWithoutAccidentWithoutStop ?? 0}
               </div>
               <p className="text-sm text-muted-foreground">
                 Jours sans accident sans arrêt
               </p>
             </div>
           </CardContent>
         </Card>
      </div>

      {/* Statistiques annuelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistiques Annuelles
          </CardTitle>
          <CardDescription>
            Répartition détaillée des événements pour l'année en cours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total accidents</span>
                <Badge variant="destructive" className="text-base px-3 py-1">
                  {indicators?.currentYearAccidents ?? 0}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Ce mois: {indicators?.currentMonthAccidents ?? 0}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avec arrêt</span>
                <Badge variant="destructive" className="text-base px-3 py-1">
                  {indicators?.currentYearAccidentsWithStop ?? 0}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Accidents avec arrêt de travail
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sans arrêt</span>
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {indicators?.currentYearAccidentsWithoutStop ?? 0}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Accidents sans arrêt de travail
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Soins mineurs</span>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {indicators?.currentYearMinorCare ?? 0}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Événements de soins mineurs
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Presque-accidents</span>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {indicators?.currentYearNearMiss ?? 0}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Événements évités de justesse
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Situations dangereuses</span>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {indicators?.currentYearDangerousSituations ?? 0}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Situations à risque identifiées
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    
     
    </div>
  );
} 