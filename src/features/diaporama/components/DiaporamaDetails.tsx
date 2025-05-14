"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/ui/page-header";
import { useDiaporama } from "../hooks";

interface DiaporamaDetailsProps {
  diaporamaId: number;
}

export function DiaporamaDetails({ diaporamaId }: DiaporamaDetailsProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "fr";

  const {
    currentDiaporama,
    isLoading,
    error,
    fetchDiaporamaById,
    clearCurrentDiaporama,
  } = useDiaporama();

  useEffect(() => {
    fetchDiaporamaById(diaporamaId);

    // Nettoyer le diaporama actuel quand on quitte la page
    return () => {
      clearCurrentDiaporama();
    };
  }, [diaporamaId, fetchDiaporamaById, clearCurrentDiaporama]);

  if (isLoading) {
    return <div>Chargement du diaporama...</div>;
  }

  if (error) {
    return <div className="text-destructive">Erreur: {error}</div>;
  }

  if (!currentDiaporama) {
    return <div>Diaporama non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={currentDiaporama.name}
        rightContent={
          <div className="flex space-x-2">
            <Button
              variant="default"
              onClick={() =>
                router.push(
                  `/${locale}/diaporama/${currentDiaporama.id}/editor`
                )
              }
            >
              Éditer
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Retour
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Détails du diaporama</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h3 className="font-medium">Description</h3>
              <p>{currentDiaporama.description || "Aucune description"}</p>
            </div>

            <div>
              <h3 className="font-medium">
                Slides ({currentDiaporama.slides.length})
              </h3>
              {currentDiaporama.slides.length === 0 ? (
                <p>Aucune slide dans ce diaporama</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {currentDiaporama.slides.map((slide) => (
                    <Card key={slide.id} className="overflow-hidden">
                      <CardContent className="p-2">
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          <span>Slide {slide.position}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
