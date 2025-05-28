import React from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { 
  Calendar,
  Clock
} from "lucide-react";
import { KonvaStage } from "../../types";

interface DataViewerProps {
  konvaData?: KonvaStage;
  addShape?: (
    shapeType: string,
    options?: { text?: string; x?: number; y?: number }
  ) => Promise<void>;
}

interface DateTimeAction {
  id: string;
  name: string;
  icon: React.ReactNode;
  action: () => void;
}

export function DataViewer({ konvaData, addShape }: DataViewerProps) {
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

  const dateTimeActions: DateTimeAction[] = [
    {
      id: "date",
      name: "Date en direct",
      icon: <Calendar className="h-4 w-4" />,
      action: addDateToCanvas,
    },
    {
      id: "time",
      name: "Heure en direct",
      icon: <Clock className="h-4 w-4" />,
      action: addTimeToCanvas,
    },
  ];

  return (
    <div className="space-y-4 h-full flex flex-col">
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
  );
} 