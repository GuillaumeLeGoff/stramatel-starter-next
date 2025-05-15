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
import { ShapesPanel, SlideCanvas, SlidesList } from "./index";
import { toast } from "sonner";
import {
  KonvaEditorProvider,
  useKonvaEditorContext,
} from "../contexts/KonvaEditorContext";
import { useEditorStore } from "../store/editorStore";

// Importation depuis la feature slideshow pour accéder aux données et API du slideshow
import { useSlideshow } from "@/features/slideshow/hooks";

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
  const slideshowId = parseInt(params.id as string);

  const {
    currentSlideshow,
    isLoading,
    error,
    fetchSlideshowById,
    createSlide,
  } = useSlideshow();

  const { selectedSlideId, selectSlide, resetState } = useEditorStore();

  // Charger le slideshow au chargement de la page
  useEffect(() => {
    const loadSlideshow = async () => {
      // Réinitialiser l'état de l'éditeur
      resetState();

      try {
        const slideshow = await fetchSlideshowById(slideshowId);

        // Sélectionner la première slide par défaut
        if (slideshow && slideshow.slides && slideshow.slides.length > 0) {
          selectSlide(slideshow.slides[0].id);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du slideshow:", error);
        toast.error(
          "Erreur lors du chargement du slideshow. Veuillez réessayer."
        );
      }
    };

    if (slideshowId) {
      loadSlideshow();
    }

    // Nettoyer l'état lors du démontage
    return () => {
      resetState();
    };
  }, [slideshowId, fetchSlideshowById, resetState, selectSlide]);

  // Fonction pour créer une nouvelle slide
  const handleAddSlide = async () => {
    if (!currentSlideshow) return;

    try {
      // Déterminer la position de la nouvelle slide
      const position =
        currentSlideshow.slides && currentSlideshow.slides.length > 0
          ? Math.max(
              ...currentSlideshow.slides.map((slide) => slide.position)
            ) + 1
          : 1;

      // Créer la slide
      const newSlide = await createSlide({
        slideshowId: currentSlideshow.id,
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
          onClick={() => router.push(`/${locale}/slideshow`)}
        >
          Retour à la liste des slideshows
        </Button>
      </div>
    );
  }

  // Si aucun slideshow n'est chargé
  if (!currentSlideshow) {
    return (
      <div className="container py-8">
        <div className="text-center p-8">
          <p>Aucun slideshow trouvé avec cet identifiant.</p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/${locale}/slideshow`)}
          >
            Retour à la liste des slideshows
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-2">
      <PageHeader
        title={`Édition: ${currentSlideshow.name}`}
        rightContent={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              Retour
            </Button>
            <KonvaEditorProvider slideId={selectedSlideId || 0} slideshowId={slideshowId}>
              <EditorActions onSaveSuccess={handleSaveSuccess} />
            </KonvaEditorProvider>
          </div>
        }
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Panel de gauche: Liste des slides */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center p-3 border-b">
              <h3 className="text-sm font-medium">Slides</h3>
              <Button size="sm" onClick={handleAddSlide}>
                Ajouter
              </Button>
            </div>
            <ScrollArea className="flex-1 p-2">
              <SlidesList
                slides={currentSlideshow.slides}
                selectedSlideId={selectedSlideId}
                onSelectSlide={selectSlide}
              />
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Panel central: Éditeur de slide */}
        <ResizablePanel defaultSize={60}>
          <div className="h-full flex flex-col">
            <div className="p-3 border-b">
              <h3 className="text-sm font-medium">Éditeur</h3>
            </div>
            <div className="flex-1 flex items-center justify-center bg-muted/30 p-4 overflow-auto">
              {selectedSlideId ? (
                <KonvaEditorProvider slideId={selectedSlideId} slideshowId={slideshowId}>
                  <SlideCanvas onSaveSuccess={handleSaveSuccess} />
                </KonvaEditorProvider>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  Sélectionnez une slide pour commencer l&apos;édition
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Panel de droite: Propriétés et éléments */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <Tabs defaultValue="shapes" className="h-full flex flex-col">
            <div className="p-3 border-b">
              <TabsList className="w-full">
                <TabsTrigger value="shapes" className="flex-1">
                  Éléments
                </TabsTrigger>
                <TabsTrigger value="props" className="flex-1">
                  Propriétés
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="shapes"
              className="flex-1 p-0 m-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <ScrollArea className="flex-1">
                {selectedSlideId ? (
                  <KonvaEditorProvider slideId={selectedSlideId} slideshowId={slideshowId}>
                    <ShapesPanel />
                  </KonvaEditorProvider>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    Sélectionnez une slide pour accéder aux éléments
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent
              value="props"
              className="flex-1 p-4 m-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <div className="text-sm text-muted-foreground">
                Propriétés de l&apos;élément sélectionné
              </div>
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
} 