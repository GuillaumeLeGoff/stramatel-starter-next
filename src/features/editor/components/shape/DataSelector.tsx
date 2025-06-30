import React from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { 
  Calendar,
  Clock,
  Shield,
  AlertTriangle,
  Target,
  TrendingUp,
  Activity,
  BarChart3,
  Timer
} from "lucide-react";
import { KonvaStage } from "../../types";

interface DataSelectorProps {
  konvaData?: KonvaStage;
  addShape?: (
    shapeType: string,
    options?: { src?: string; name?: string; mediaId?: string }
  ) => Promise<void>;
}

interface DateTimeAction {
  id: string;
  name: string;
  icon: React.ReactNode;
  action: () => void;
}

export function DataSelector({ addShape }: DataSelectorProps) {
  const addDateToCanvas = async () => {
    if (addShape) {
      try {
        await addShape("liveDate");
        console.log("Date en temps réel ajoutée au canvas");
      } catch (error) {
        console.error("Erreur lors de l'ajout de la date:", error);
      }
    }
  };

  const addTimeToCanvas = async () => {
    if (addShape) {
      try {
        await addShape("liveTime");
        console.log("Heure en temps réel ajoutée au canvas");
      } catch (error) {
        console.error("Erreur lors de l'ajout de l'heure:", error);
      }
    }
  };

  // Fonctions pour ajouter les données de sécurité
  const addSecurityData = async (dataType: string) => {
    if (addShape) {
      try {
        await addShape(dataType);
        console.log(`Donnée de sécurité ${dataType} ajoutée au canvas`);
      } catch (error) {
        console.error(`Erreur lors de l'ajout de ${dataType}:`, error);
      }
    }
  };

  const dateTimeActions: DateTimeAction[] = [
    {
      id: "date",
      name: "Date",
      icon: <Calendar className="h-4 w-4" />,
      action: addDateToCanvas,
    },
    {
      id: "time",
      name: "Heure",
      icon: <Clock className="h-4 w-4" />,
      action: addTimeToCanvas,
    },
  ];

  const securityActions: DateTimeAction[] = [
    {
      id: "daysWithoutAccident",
      name: "Jours sans accident",
      icon: <Shield className="h-4 w-4" />,
      action: () => addSecurityData("currentDaysWithoutAccident"),
    },
    {
      id: "daysWithoutAccidentWithStop",
      name: "Jours sans arrêt",
      icon: <Target className="h-4 w-4" />,
      action: () => addSecurityData("currentDaysWithoutAccidentWithStop"),
    },
    {
      id: "daysWithoutAccidentWithoutStop",
      name: "Jours sans arrêt léger",
      icon: <Activity className="h-4 w-4" />,
      action: () => addSecurityData("currentDaysWithoutAccidentWithoutStop"),
    },
    {
      id: "recordDaysWithoutAccident",
      name: "Record jours sans accident",
      icon: <TrendingUp className="h-4 w-4" />,
      action: () => addSecurityData("recordDaysWithoutAccident"),
    },
    {
      id: "yearlyAccidentsCount",
      name: "Accidents cette année",
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => addSecurityData("yearlyAccidentsCount"),
    },
    {
      id: "yearlyAccidentsWithStopCount",
      name: "Accidents avec arrêt",
      icon: <AlertTriangle className="h-4 w-4" />,
      action: () => addSecurityData("yearlyAccidentsWithStopCount"),
    },
    {
      id: "yearlyAccidentsWithoutStopCount",
      name: "Accidents sans arrêt",
      icon: <Activity className="h-4 w-4" />,
      action: () => addSecurityData("yearlyAccidentsWithoutStopCount"),
    },
    {
      id: "monthlyAccidentsCount",
      name: "Accidents ce mois",
      icon: <Calendar className="h-4 w-4" />,
      action: () => addSecurityData("monthlyAccidentsCount"),
    },
    {
      id: "lastAccidentDate",
      name: "Dernier accident",
      icon: <Timer className="h-4 w-4" />,
      action: () => addSecurityData("lastAccidentDate"),
    },
    {
      id: "monitoringStartDate",
      name: "Début de suivi",
      icon: <Calendar className="h-4 w-4" />,
      action: () => addSecurityData("monitoringStartDate"),
    },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Section Date et Heure */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Date & Heure
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {dateTimeActions.map((action) => (
            <Card
              key={action.id}
              className="cursor-pointer hover:bg-accent transition-colors border-dashed"
              onClick={action.action}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-2 bg-primary/10 rounded-md">
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{action.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Section Sécurité */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Indicateurs de Sécurité
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {securityActions.map((action) => (
            <Card
              key={action.id}
              className="cursor-pointer hover:bg-accent transition-colors border-dashed"
              onClick={action.action}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 p-1.5 bg-green-500/10 rounded-md">
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium leading-tight">{action.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 