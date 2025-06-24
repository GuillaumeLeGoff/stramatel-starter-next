import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { LiveSlideViewer } from "@/features/panel/components/LiveSlideViewer";

export function DashboardMain() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
      </div>

      {/* Affichage live - pleine largeur */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Affichage en direct</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <LiveSlideViewer />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 