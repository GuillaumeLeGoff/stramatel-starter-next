"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { SecurityDashboard } from "./SecurityDashboard";
import { SecurityEventsList } from "./SecurityEventsList";
import { Shield, List } from "lucide-react";

export function SecurityPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Sécurité</h2>
        </div>
        
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Événements
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-4">
            <SecurityDashboard />
          </TabsContent>
          
          <TabsContent value="events" className="space-y-4">
            <SecurityEventsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 