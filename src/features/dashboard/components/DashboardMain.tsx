import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { LiveSlideViewer } from "@/features/panel/components/LiveSlideViewer";

export function DashboardMain() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Affichage en Direct</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="rounded-lg overflow-hidden flex justify-center items-center">
            <LiveSlideViewer />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 