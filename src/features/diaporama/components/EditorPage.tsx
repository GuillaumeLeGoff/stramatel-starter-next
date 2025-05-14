"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shared/components/ui/resizable";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { useDiaporama } from "../hooks/useDiaporama";
import { useEditorStore } from "../store/editorStore";
import { ShapesPanel } from "./editor/ShapesPanel";
import { SlideCanvas } from "./editor/SlideCanvas";
import { SlidesList } from "./editor/SlidesList";
import { toast } from "sonner";
import {
  KonvaEditorProvider,
  useKonvaEditorContext,
} from "../contexts/KonvaEditorContext";

// Composant séparé pour les boutons d'édition, car ils doivent accéder au contexte KonvaEditor
const EditorActions = ({ onSaveSuccess }: { onSaveSuccess?: () => void }) => {
  const { undo, redo, canUndo, canRedo, saveChanges, isSaving } =
    useKonvaEditorContext();

  const handleSave = async () => {
    try {
      await saveChanges();
      if (onSaveSuccess) onSaveSuccess();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="flex space-x-2">
      <Button size="sm" variant="outline" onClick={undo} disabled={!canUndo}>
        Annuler
      </Button>
      <Button size="sm" variant="outline" onClick={redo} disabled={!canRedo}>
        Rétablir
      </Button>
      <Button size="sm" onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Sauvegarde..." : "Enregistrer"}
      </Button>
    </div>
  );
};

export function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "fr";
  const diaporamaId = parseInt(params.id as string);

  const {
    currentDiaporama,
    isLoading,
    error,
    fetchDiaporamaById,
    createSlide,
  } = useDiaporama();

  const { selectedSlideId, selectSlide, resetState } = useEditorStore();

  // Charger le diaporama au chargement de la page
  useEffect(() => {
    const loadDiaporama = async () => {
      // Réinitialiser l'état de l'éditeur
      resetState();

      try {
        const diaporama = await fetchDiaporamaById(diaporamaId);

        // Sélectionner la première slide par défaut
        if (diaporama && diaporama.slides && diaporama.slides.length > 0) {
          selectSlide(diaporama.slides[0].id);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du diaporama:", error);
        toast.error(
          "Erreur lors du chargement du diaporama. Veuillez réessayer."
        );
      }
    };

    if (diaporamaId) {
      loadDiaporama();
    }

    // Nettoyer l'état lors du démontage
    return () => {
      resetState();
    };
  }, [diaporamaId, fetchDiaporamaById, resetState, selectSlide]);

  // Fonction pour créer une nouvelle slide
  const handleAddSlide = async () => {
    if (!currentDiaporama) return;

    try {
      // Déterminer la position de la nouvelle slide
      const position =
        currentDiaporama.slides && currentDiaporama.slides.length > 0
          ? Math.max(
              ...currentDiaporama.slides.map((slide) => slide.position)
            ) + 1
          : 1;

      // Créer la slide
      const newSlide = await createSlide({
        diaporamaId: currentDiaporama.id,
        position,
        duration: 10, // Durée par défaut en secondes
      });

      // Sélectionner la nouvelle slide
      if (newSlide) {
        selectSlide(newSlide.id);
        toast.success("Nouvelle slide créée avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la création de la slide:", error);
      toast.error(
        "Erreur lors de la création de la slide. Veuillez réessayer."
      );
    }
  };

  // Callback pour la sauvegarde réussie
  const handleSaveSuccess = () => {
    toast.success("Slide enregistrée avec succès");
  };

  // Afficher un message de chargement
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Chargement de l&apos;éditeur...</p>
          </div>
        </div>
      </div>
    );
  }

  // Afficher un message d'erreur
  if (error) {
    return (
      <div className="container py-8">
        <div className="bg-destructive/15 p-4 rounded-md text-destructive">
          {error}
        </div>
        <Button
          className="mt-4"
          onClick={() => router.push(`/${locale}/diaporama`)}
        >
          Retour à la liste des diaporamas
        </Button>
      </div>
    );
  }

  // Si aucun diaporama n'est chargé
  if (!currentDiaporama) {
    return (
      <div className="container py-8">
        <div className="text-center p-8">
          <p>Aucun diaporama trouvé avec cet identifiant.</p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/${locale}/diaporama`)}
          >
            Retour à la liste des diaporamas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-2">
      <PageHeader
        title={`Édition: ${currentDiaporama.name}`}
        rightContent={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              Retour
            </Button>
          </div>
        }
      />

      <KonvaEditorProvider>
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 border rounded-md"
        >
          {/* Panneau de gauche: Outils d'édition */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <Tabs defaultValue="shapes" className="h-full">
              <TabsList className="w-full">
                <TabsTrigger value="shapes" className="flex-1">
                  Formes
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">
                  Paramètres
                </TabsTrigger>
              </TabsList>
              <TabsContent value="shapes" className="h-[calc(100%-40px)]">
                <ScrollArea className="h-full">
                  <ShapesPanel />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="settings" className="h-[calc(100%-40px)]">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <p>Paramètres de la slide</p>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle />

          {/* Panneau central: Canvas d'édition */}
          <ResizablePanel defaultSize={55}>
            <div className="h-full flex flex-col">
              <div className="p-2 border-b flex items-center justify-between">
                <div className="text-sm font-medium">Canvas</div>
                <EditorActions onSaveSuccess={handleSaveSuccess} />
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100">
                {selectedSlideId && (
                  <SlideCanvas onSaveSuccess={handleSaveSuccess} />
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Panneau de droite: Liste des slides */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full flex flex-col">
              <div className="p-2 border-b flex items-center justify-between">
                <div className="text-sm font-medium">Slides</div>
                <Button size="sm" variant="outline" onClick={handleAddSlide}>
                  Ajouter une slide
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <SlidesList
                  slides={currentDiaporama.slides}
                  selectedSlideId={selectedSlideId}
                  onSelectSlide={selectSlide}
                />
              </ScrollArea>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </KonvaEditorProvider>
    </div>
  );
}
