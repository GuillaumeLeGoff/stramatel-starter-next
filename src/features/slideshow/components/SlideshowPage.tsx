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
    navigateToEditor
  } = useSlideshow();

  return (
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
        <CardHeader>
          <CardTitle>Liste des slideshows</CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Créer un slideshow</Button>
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
          {isLoadingSlideshows ? (
            <div className="text-center p-4">Chargement des slideshows...</div>
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
                    const { formattedDuration } = formatSlideshowDuration(slideshow.slides);
                    
                    return (
                      <TableRow
                        onClick={() => navigateToEditor(slideshow.id)}
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
                              Supprimer
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
              Êtes-vous sûr de vouloir supprimer ce slideshow ? Cette action ne
              peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
