import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/slideshows/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Attendre les paramètres avant de les utiliser
    const { id } = await params;

    const slideshow = await prisma.slideshow.findUnique({
      where: {
        id: parseInt(id),
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
        modes: true,
      },
    });

    if (!slideshow) {
      return NextResponse.json(
        { error: "Slideshow non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(slideshow);
  } catch (error) {
    console.error("Erreur lors de la récupération du slideshow:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du slideshow" },
      { status: 500 }
    );
  }
}

// PUT /api/slideshows/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Attendre les paramètres avant de les utiliser
    const { id } = await params;

    const body = await request.json();
    const { name, description, konvaState } = body;

    const slideshow = await prisma.slideshow.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name,
        description,
        ...(konvaState && { konvaState }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(slideshow);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du slideshow:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du slideshow" },
      { status: 500 }
    );
  }
}

// DELETE /api/slideshows/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Attendre les paramètres avant de les utiliser
    const { id } = await params;

    await prisma.slideshow.delete({
      where: {
        id: parseInt(id),
      },
    });

    return NextResponse.json(
      { message: "Slideshow supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du slideshow:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du slideshow" },
      { status: 500 }
    );
  }
}
