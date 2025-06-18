"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Plus, Edit, Trash2, Search, Filter } from "lucide-react";
import { SecurityEvent, SecurityEventType, SecuritySeverity, SecurityEventFilters } from "../types";
import { useSecurityEvents } from "../hooks/useSecurityEvents";
import { SecurityEventForm } from "./SecurityEventForm";

export function SecurityEventsList() {
  const [filters, setFilters] = useState<SecurityEventFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SecurityEvent | null>(null);
  
  const { events, loading, error, createEvent, updateEvent, deleteEvent, loadEvents } = useSecurityEvents(filters);

  // Filtrer les événements selon le terme de recherche
  const filteredEvents = events.filter(event => 
    searchTerm === "" || 
    event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateEvent = async (data: any) => {
    await createEvent(data);
  };

  const handleEditEvent = async (data: any) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
      setEditingEvent(null);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      await deleteEvent(id);
    }
  };

  const getEventTypeBadge = (type: SecurityEventType) => {
    const variants = {
      [SecurityEventType.ACCIDENT]: "destructive",
      [SecurityEventType.ACCIDENT_WITH_STOP]: "destructive",
      [SecurityEventType.ACCIDENT_WITHOUT_STOP]: "secondary",
      [SecurityEventType.MINOR_CARE]: "outline",
      [SecurityEventType.NEAR_MISS]: "secondary",
      [SecurityEventType.DANGEROUS_SITUATION]: "outline"
    } as const;

    const labels = {
      [SecurityEventType.ACCIDENT]: "Accident",
      [SecurityEventType.ACCIDENT_WITH_STOP]: "Accident avec arrêt",
      [SecurityEventType.ACCIDENT_WITHOUT_STOP]: "Accident sans arrêt",
      [SecurityEventType.MINOR_CARE]: "Soin bénin",
      [SecurityEventType.NEAR_MISS]: "Presqu'accident",
      [SecurityEventType.DANGEROUS_SITUATION]: "Situation dangereuse"
    };

    return (
      <Badge variant={variants[type] as any}>
        {labels[type]}
      </Badge>
    );
  };

  const getSeverityBadge = (severity?: SecuritySeverity) => {
    if (!severity) return null;
    
    const variants = {
      [SecuritySeverity.LOW]: "outline",
      [SecuritySeverity.MEDIUM]: "secondary", 
      [SecuritySeverity.HIGH]: "destructive",
      [SecuritySeverity.CRITICAL]: "destructive"
    } as const;

    const labels = {
      [SecuritySeverity.LOW]: "Faible",
      [SecuritySeverity.MEDIUM]: "Moyen",
      [SecuritySeverity.HIGH]: "Élevé", 
      [SecuritySeverity.CRITICAL]: "Critique"
    };

    return (
      <Badge variant={variants[severity] as any}>
        {labels[severity]}
      </Badge>
    );
  };

  const applyFilters = (newFilters: Partial<SecurityEventFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    loadEvents(updatedFilters);
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'ajout */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Événements de Sécurité</h2>
          <p className="text-muted-foreground">Gérez les événements et incidents</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel événement
        </Button>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Description, lieu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select 
                value={filters.type || "all"} 
                onValueChange={(value) => applyFilters({ type: (value && value !== "all") ? value as SecurityEventType : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="ACCIDENT">Accident</SelectItem>
                  <SelectItem value="ACCIDENT_WITH_STOP">Accident avec arrêt</SelectItem>
                  <SelectItem value="ACCIDENT_WITHOUT_STOP">Accident sans arrêt</SelectItem>
                  <SelectItem value="MINOR_CARE">Soin bénin</SelectItem>
                  <SelectItem value="NEAR_MISS">Presqu'accident</SelectItem>
                  <SelectItem value="DANGEROUS_SITUATION">Situation dangereuse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sévérité */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sévérité</label>
              <Select 
                value={filters.severity || "all"} 
                onValueChange={(value) => applyFilters({ severity: (value && value !== "all") ? value as SecuritySeverity : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes sévérités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes sévérités</SelectItem>
                  <SelectItem value="LOW">Faible</SelectItem>
                  <SelectItem value="MEDIUM">Moyen</SelectItem>
                  <SelectItem value="HIGH">Élevé</SelectItem>
                  <SelectItem value="CRITICAL">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lieu */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Lieu</label>
              <Input
                placeholder="Filtrer par lieu"
                value={filters.location || ""}
                onChange={(e) => applyFilters({ location: e.target.value || undefined })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des événements */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Lieu</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Arrêt</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      {new Date(event.date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      {getEventTypeBadge(event.type)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {event.description || '-'}
                    </TableCell>
                    <TableCell>{event.location || '-'}</TableCell>
                    <TableCell>
                      {getSeverityBadge(event.severity)}
                    </TableCell>
                    <TableCell>
                      {event.withWorkStop ? (
                        <Badge variant="destructive">Oui</Badge>
                      ) : (
                        <Badge variant="outline">Non</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingEvent(event);
                            setFormOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEvents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun événement trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Formulaire d'ajout/modification */}
      <SecurityEventForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingEvent(null);
        }}
        onSubmit={editingEvent ? handleEditEvent : handleCreateEvent}
        event={editingEvent}
        loading={loading}
      />
    </div>
  );
} 