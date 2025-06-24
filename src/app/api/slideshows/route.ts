import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Créer un diaporama avec une slide vide
    const slideshow = await prisma.slideshow.create({
      data: {
        name,
        description,
        createdBy,
        slides: {
         
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        slides: {
          include: {
            media: true,
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    // Le serveur WebSocket détectera automatiquement le changement via updatedAt
    return NextResponse.json(slideshow, { status: 201 });
  } catch (error) {
    console.error("Erreur création diaporama:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du slideshow" },
      { status: 500 }
    );
  }
}
