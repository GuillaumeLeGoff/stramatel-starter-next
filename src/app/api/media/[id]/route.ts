import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/media/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const media = await prisma.media.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        thumbnail: true,
        thumbnails: true,
        slides: {
          include: {
            slideshow: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Média non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(media);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du média' },
      { status: 500 }
    );
  }
}

// PUT /api/media/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      originalFileName,
      fileName,
      path,
      format,
      type,
      size,
      thumbnailId,
    } = body;

    const media = await prisma.media.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        originalFileName,
        fileName,
        path,
        format,
        type,
        size,
        thumbnailId,
      },
      include: {
        thumbnail: true,
        thumbnails: true,
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du média' },
      { status: 500 }
    );
  }
}

// DELETE /api/media/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier si le média est utilisé comme thumbnail
    const usedAsThumbnail = await prisma.media.findFirst({
      where: {
        thumbnailId: parseInt(params.id),
      },
    });

    if (usedAsThumbnail) {
      return NextResponse.json(
        { error: 'Ce média est utilisé comme thumbnail et ne peut pas être supprimé' },
        { status: 400 }
      );
    }

    // Supprimer le média
    await prisma.media.delete({
      where: {
        id: parseInt(params.id),
      },
    });

    return NextResponse.json(
      { message: 'Média supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du média' },
      { status: 500 }
    );
  }
} 