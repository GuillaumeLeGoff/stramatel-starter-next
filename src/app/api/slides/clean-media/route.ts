import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanMediaFromKonvaData } from "@/features/editor/utils";

export async function POST(request: NextRequest) {
  try {
    const { mediaUrl } = await request.json();

    if (!mediaUrl) {
      return NextResponse.json(
        { error: "URL du média requise" },
        { status: 400 }
      );
    }

    // Récupérer toutes les slides qui ont des données Konva
    const slides = await prisma.slide.findMany({
      where: {
        konvaData: {
          not: null,
        },
      },
    });

    // Nettoyer chaque slide
    const updatePromises = slides.map(async (slide) => {
      if (!slide.konvaData) return;

      try {
        const konvaData = slide.konvaData as any;
        const cleanedData = cleanMediaFromKonvaData(konvaData, mediaUrl);

        // Mettre à jour la slide seulement si les données ont changé
        if (JSON.stringify(cleanedData) !== JSON.stringify(konvaData)) {
          await prisma.slide.update({
            where: { id: slide.id },
            data: { konvaData: cleanedData },
          });
        }
      } catch (error) {
        console.error(`Erreur lors du nettoyage de la slide ${slide.id}:`, error);
      }
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ 
      message: "Slides nettoyées avec succès",
      cleanedSlides: slides.length 
    });
  } catch (error) {
    console.error("Erreur lors du nettoyage des slides:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
} 