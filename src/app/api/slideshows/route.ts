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
        slides: {
          include: {
            media: true,
          },
          orderBy: {
            position: "asc",
          },
        },
        modes: true,
      },
    });

    return NextResponse.json(slideshows);
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

    // Structure Konva initiale
    const initialKonvaState = {
      version: 1,
      stageConfig: {
        width: 800,
        height: 600,
        draggable: false,
      },
    };

    // Créer un diaporama avec une slide vide
    const slideshow = await prisma.slideshow.create({
      data: {
        name,
        description,
        createdBy,
        konvaState: initialKonvaState,
        slides: {
          create: [
            {
              position: 1,
              duration: 5, // 5 secondes par défaut
              width: 800,
              height: 600,
              konvaData: {
                width: 800,
                height: 600,
                attrs: {
                  width: 800,
                  height: 600,
                },
                className: "Stage",
                children: [
                  {
                    attrs: {},
                    className: "Layer",
                    children: [
                      {
                        attrs: {
                          x: 100,
                          y: 100,
                          width: 300,
                          height: 50,
                          fontSize: 32,
                          fontFamily: "Arial",
                          fill: "#333333",
                          align: "center",
                          text: "Nouvelle présentation",
                        },
                        className: "Text",
                      },
                    ],
                  },
                ],
              },
            },
          ],
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

    return NextResponse.json(slideshow, { status: 201 });
  } catch (error) {
    console.error("Erreur création diaporama:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du slideshow" },
      { status: 500 }
    );
  }
}
