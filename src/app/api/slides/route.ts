import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/slides
export async function GET() {
  try {
    const slides = await prisma.slide.findMany({
      include: {
        media: true,
        slideshow: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(slides);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des slides" },
      { status: 500 }
    );
  }
}

// POST /api/slides
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slideshowId, position, duration, mediaId, dataIds } = body;

    // Créer la slide d'abord
    const slide = await prisma.slide.create({
      data: {
        slideshowId,
        position,
        duration,
        ...(Array.isArray(dataIds) && dataIds.length > 0
          ? {
              data: {
                create: dataIds.map((dataId: number) => ({
                  data: {
                    connect: { id: dataId },
                  },
                })),
              },
            }
          : {}),
      },
      include: {
        media: true,
        slideshow: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Si un mediaId est fourni, associer le média à la slide
    if (mediaId) {
      await prisma.media.update({
        where: { id: parseInt(mediaId) },
        data: { 
          slides: {
            connect: { id: slide.id }
          }
        },
      });
    }

    // Récupérer la slide avec ses médias mis à jour
    const updatedSlide = await prisma.slide.findUnique({
      where: { id: slide.id },
      include: {
        media: true,
        slideshow: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Le serveur WebSocket détectera automatiquement le changement via updatedAt
    return NextResponse.json(updatedSlide, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Erreur lors de la création du slide" },
      { status: 500 }
    );
  }
}
