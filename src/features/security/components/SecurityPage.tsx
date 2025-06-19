"use client";

import { SecurityDashboard } from "./SecurityDashboard";
import { SecurityEventsList } from "./SecurityEventsList";

export function SecurityPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2 mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Sécurité</h2>
        </div>
        
        {/* Layout en deux colonnes */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
          {/* Tableau de bord - Colonne gauche */}
          <div className="space-y-6">
            
              
              <SecurityDashboard />
            
          </div>
          
          {/* Événements de sécurité - Colonne droite */}
          <div className="space-y-6">
            
             
              <SecurityEventsList />
           
          </div>
        </div>
      </div>
    </div>
  );
} 