"use client";

import React from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { useSlideshow } from "@/features/slideshow/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { PlusIcon, TrashIcon, XIcon } from "lucide-react";
import { EditorPage } from "@/features/editor/components/EditorPage";

export function SlideshowPage() {
  const {
    open,
    setOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    slideshows,
    isLoadingSlideshows,
    slideshowError,
    createError,
    formData,
    isCreating,
    handleChange,
    handleSubmit,
    handleDelete,
    openDeleteDialog,
    formatSlideshowDuration,
    handleSetSlideshow,
    isEditorOpen,
    handleCloseEditor,
    currentSlideshow,
  } = useSlideshow();

  return (
    <div>
      <div className="space-y-6">
        <PageHeader title="Slideshow" />

        {/* Affichage des erreurs */}
        {(slideshowError || createError) && (
          <div className="bg-destructive/15 p-3 rounded-md text-destructive">
            {slideshowError || createError}
          </div>
        )}

        {/* Tableau des slideshows */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Liste des slideshows</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="w-4 h-4" /> Créer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau slideshow</DialogTitle>
                  <DialogDescription>
                    Saisissez les informations du slideshow que vous souhaitez
                    créer.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Nom du slideshow
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Nom du slideshow"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label
                        htmlFor="description"
                        className="text-sm font-medium"
                      >
                        Description
                      </label>
                      <Input
                        id="description"
                        name="description"
                        value={formData.description || ""}
                        onChange={handleChange}
                        placeholder="Description (optionnel)"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? "Création en cours..." : "Créer"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoadingSlideshows ? (
              <div className="text-center p-4">
                Chargement des slideshows...
              </div>
            ) : !slideshows || slideshows.length === 0 ? (
              <div className="text-center p-4">Aucun slideshow disponible</div>
            ) : (
              <ScrollArea className="h-[calc(100vh-220px)] rounded-md relative">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-20 shadow-sm after:absolute after:w-full after:h-[1px] after:bottom-0 after:left-0 after:bg-border">
                    <TableRow>
                      <TableHead className="w-[200px] bg-card">Nom</TableHead>
                      <TableHead className="w-[300px] bg-card">
                        Description
                      </TableHead>
                      <TableHead className="w-[100px] bg-card">Temps</TableHead>
                      <TableHead className="w-[150px] bg-card">
                        Nombre de slides
                      </TableHead>
                      <TableHead className="text-right w-[200px] bg-card">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slideshows.map((slideshow) => {
                      const { formattedDuration } = formatSlideshowDuration(
                        slideshow.slides
                      );

                      return (
                        <TableRow
                          onClick={() => {
                            handleSetSlideshow(slideshow);
                          }}
                          key={slideshow.id}
                        >
                          <TableCell className="font-medium">
                            {slideshow.name}
                          </TableCell>
                          <TableCell className="line-clamp-2">
                            {slideshow.description || "Aucune description"}
                          </TableCell>
                          <TableCell>{formattedDuration}</TableCell>
                          <TableCell>{slideshow.slides.length}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteDialog(slideshow.id);
                                }}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Dialog de confirmation de suppression */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer ce slideshow ? Cette action
                ne peut pas être annulée.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modale d'édition */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-background/10 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="fixed inset-4 z-50 bg-background rounded-xl border shadow-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 ">
              <PageHeader
                title={`Edition de ${currentSlideshow?.name || "slideshow"}`}
              />
              <Button variant="ghost" size="icon" onClick={handleCloseEditor}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1  overflow-auto">
              {/* Contenu de l'éditeur */}
              <EditorPage />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
