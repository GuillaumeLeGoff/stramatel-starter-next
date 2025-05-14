"use client";

import React, { useEffect, useState } from "react";
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
  CardDescription,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { useDiaporama, useCreateDiaporama } from "../hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/shared/components/ui/dialog";
import { useRouter, useParams } from "next/navigation";

export function DiaporamaPage() {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [diaporamaToDelete, setDiaporamaToDelete] = useState<number | null>(
    null
  );

  const {
    diaporamas,
    isLoading: isLoadingDiaporamas,
    error: diaporamaError,
    fetchDiaporamas,
    deleteDiaporamaById,
  } = useDiaporama();

  const {
    formData,
    isLoading: isCreating,
    error: createError,
    handleChange,
    handleSubmit: originalHandleSubmit,
  } = useCreateDiaporama();

  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "fr";

  // Wrapper pour handleSubmit qui ferme le dialog après création réussie
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await originalHandleSubmit(e);
      if (result) {
        // Fermer le dialog seulement si la création a réussi
        setOpen(false);
      }
    } catch (error) {
      // En cas d'erreur, le dialog reste ouvert
      console.error("Erreur lors de la création:", error);
    }
  };

  // Charger les diaporamas au chargement de la page
  useEffect(() => {
    fetchDiaporamas();
  }, [fetchDiaporamas]);

  // Gestion de la suppression d'un diaporama
  const handleDelete = async () => {
    if (diaporamaToDelete !== null) {
      await deleteDiaporamaById(diaporamaToDelete);
      setDeleteDialogOpen(false);
      setDiaporamaToDelete(null);
    }
  };

  // Ouvrir le dialog de confirmation de suppression
  const openDeleteDialog = (id: number) => {
    setDiaporamaToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Diaporama" />

      {/* Affichage des erreurs */}
      {(diaporamaError || createError) && (
        <div className="bg-destructive/15 p-3 rounded-md text-destructive">
          {diaporamaError || createError}
        </div>
      )}

      {/* Actions supérieures */}
      <div className="flex justify-between items-center">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Créer un diaporama</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Créer un nouveau diaporama</DialogTitle>
              <DialogDescription>
                Saisissez les informations du diaporama que vous souhaitez
                créer.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Nom du diaporama
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Nom du diaporama"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium">
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

        {/* Bouton pour accéder au test Konva */}
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/diaporama/konva-test`)}
        >
          Tester l&apos;éditeur Konva
        </Button>
      </div>

      {/* Tableau des diaporamas */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des diaporamas</CardTitle>
          <CardDescription>
            Créez et gérez vos diaporamas pour l&apos;affichage sur les tableaux
            d&apos;affichage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDiaporamas ? (
            <div className="text-center p-4">Chargement des diaporamas...</div>
          ) : !diaporamas || diaporamas.length === 0 ? (
            <div className="text-center p-4">Aucun diaporama disponible</div>
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
                  {diaporamas.map((diaporama) => (
                    <TableRow
                      key={diaporama.id}
                      onClick={() =>
                        router.push(`/${locale}/diaporama/${diaporama.id}`)
                      }
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        {diaporama.name}
                      </TableCell>
                      <TableCell>{diaporama.description || "-"}</TableCell>
                      <TableCell>00:00</TableCell>
                      <TableCell>
                        {(diaporama.slides && diaporama.slides.length) || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            Éditer
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Empêche le clic de se propager à la ligne
                              openDeleteDialog(diaporama.id);
                            }}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
            <DialogTitle>
              Êtes-vous sûr de vouloir supprimer ce diaporama ?
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
