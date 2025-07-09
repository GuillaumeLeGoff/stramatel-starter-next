import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fonction pour créer un stage Konva par défaut
const createDefaultKonvaStage = () => {
  return {
    attrs: {
      width: 10000, // Canvas large pour permettre le déplacement
      height: 10000, // Canvas large pour permettre le déplacement
      backgroundColor: "#000000", // Couleur de fond par défaut (noir)
    },
    className: "Stage",
    children: [
      {
        attrs: {},
        className: "Layer",
        children: [],
      },
    ],
  };
};

// GET /api/slideshows
export async function GET() {
  try {
    const slideshows = await prisma.slideshow.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            slides: true,
          },
        },
        modes: true,
        slides: {
          select: {
            duration: true,
          },
        },
      },
    });

    // Calculer le temps total pour chaque diaporama
    const slideshowsWithTotalDuration = slideshows.map((slideshow) => {
      const totalDuration = slideshow.slides.reduce(
        (total, slide) => total + slide.duration,
        0
      );
      return {
        ...slideshow,
        totalDuration,
        slides: undefined, // Supprimer les slides pour ne pas les renvoyer
      };
    });

    return NextResponse.json(slideshowsWithTotalDuration);
  } catch (error) {
    console.error("Erreur lors de la récupération des slideshows:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des slideshows" },
      { status: 500 }
    );
  }
}

// POST /api/slideshows
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, createdBy } = body;

    // Utiliser une transaction pour créer le slideshow et sa première slide de manière atomique
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer le slideshow
      const slideshow = await tx.slideshow.create({
        data: {
          name,
          description,
          createdBy,
        },
      });

      // 2. Créer une slide par défaut pour ce slideshow
      const defaultKonvaData = createDefaultKonvaStage();
      const defaultSlide = await tx.slide.create({
        data: {
          slideshowId: slideshow.id,
          position: 0,
          duration: 10.0, // 10 secondes par défaut (Float)
          konvaData: defaultKonvaData,
        },
      });

      // 3. Retourner le slideshow avec le même format que GET
      const slideshowWithCounts = await tx.slideshow.findUnique({
        where: { id: slideshow.id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          _count: {
            select: {
              slides: true,
            },
          },
          modes: true,
          slides: {
            select: {
              duration: true,
            },
          },
        },
      });

      // Calculer la durée totale et formater comme dans GET
      if (slideshowWithCounts) {
        const totalDuration = slideshowWithCounts.slides.reduce(
          (total, slide) => total + slide.duration,
          0
        );
        
        return {
          ...slideshowWithCounts,
          totalDuration,
          slides: undefined, // Supprimer les slides pour ne pas les renvoyer
        };
      }
      
      return slideshowWithCounts;
    });

    // Le serveur WebSocket détectera automatiquement le changement via updatedAt
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Erreur création diaporama:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du slideshow" },
      { status: 500 }
    );
  }
}
