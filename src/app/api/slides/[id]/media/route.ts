import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const slideId = parseInt(id);
    const { mediaId } = await request.json();

    if (isNaN(slideId) || !mediaId) {
      return NextResponse.json(
        { error: "ID de slide et ID de média requis" },
        { status: 400 }
      );
    }

    // Vérifier que la slide existe
    const slide = await prisma.slide.findUnique({
      where: { id: slideId },
    });

    if (!slide) {
      return NextResponse.json(
        { error: "Slide introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que le média existe
    const media = await prisma.media.findUnique({
      where: { id: parseInt(mediaId) },
    });

    if (!media) {
      return NextResponse.json(
        { error: "Média introuvable" },
        { status: 404 }
      );
    }

    // Associer le média à la slide (nouvelle logique)
    await prisma.media.update({
      where: { id: parseInt(mediaId) },
      data: { slideId: slideId },
    });

    return NextResponse.json({ 
      message: "Média associé à la slide avec succès" 
    });
  } catch (error) {
    console.error("Erreur lors de l'association du média:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
} 