import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/slides/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Attendre les paramètres avant de les utiliser
    const { id } = await params;

    const slide = await prisma.slide.findUnique({
      where: {
        id: parseInt(id),
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

    if (!slide) {
      return NextResponse.json({ error: "Slide non trouvée" }, { status: 404 });
    }

    return NextResponse.json(slide);
  } catch (error) {
    console.error("Erreur lors de la récupération de la slide:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la slide" },
      { status: 500 }
    );
  }
}

// PUT /api/slides/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Attendre les paramètres avant de les utiliser
    const { id } = await params;

    const body = await request.json();
    const { duration, position, mediaId, konvaData } = body;

    // Mettre à jour la slide
    const slide = await prisma.slide.update({
      where: {
        id: parseInt(id),
      },
      data: {
        ...(duration !== undefined && { duration }),
        ...(position !== undefined && { position }),
        ...(konvaData && { konvaData }),
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

    // Si mediaId est fourni, gérer l'association du média
    if (mediaId !== undefined) {
      if (mediaId === null) {
        // Dissocier tous les médias de cette slide
        await prisma.media.updateMany({
          where: { slideId: parseInt(id) },
          data: { slideId: null },
        });
      } else {
        // D'abord dissocier les anciens médias
        await prisma.media.updateMany({
          where: { slideId: parseInt(id) },
          data: { slideId: null },
        });
        // Puis associer le nouveau média
        await prisma.media.update({
          where: { id: parseInt(mediaId) },
          data: { slideId: parseInt(id) },
        });
             }
     }

     // Récupérer la slide mise à jour avec ses médias
     const updatedSlide = await prisma.slide.findUnique({
       where: { id: parseInt(id) },
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

     return NextResponse.json(updatedSlide);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la slide:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la slide" },
      { status: 500 }
    );
  }
}

// DELETE /api/slides/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Attendre les paramètres avant de les utiliser
    const { id } = await params;

    await prisma.slide.delete({
      where: {
        id: parseInt(id),
      },
    });

    return NextResponse.json(
      { message: "Slide supprimée avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de la slide:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la slide" },
      { status: 500 }
    );
  }
}
