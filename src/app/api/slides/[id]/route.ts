import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/slides/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const slide = await prisma.slide.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        media: true,
        data: {
          include: {
            data: true,
          },
        },
        slideshow: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!slide) {
      return NextResponse.json(
        { error: 'Slide non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(slide);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du slide' },
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
    const body = await request.json();
    const {
      position,
      duration,
      mediaId,
      x,
      y,
      width,
      height,
      dataIds,
    } = body;

    // Supprimer les anciennes associations de données
    await prisma.slideData.deleteMany({
      where: {
        slideId: parseInt(params.id),
      },
    });

    const slide = await prisma.slide.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        position,
        duration,
        mediaId,
        x,
        y,
        width,
        height,
        data: {
          create: dataIds.map((dataId: number) => ({
            data: {
              connect: {
                id: dataId,
              },
            },
          })),
        },
      },
      include: {
        media: true,
        data: {
          include: {
            data: true,
          },
        },
      },
    });

    return NextResponse.json(slide);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du slide' },
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
    // Supprimer d'abord les associations de données
    await prisma.slideData.deleteMany({
      where: {
        slideId: parseInt(params.id),
      },
    });

    // Puis supprimer le slide
    await prisma.slide.delete({
      where: {
        id: parseInt(params.id),
      },
    });

    return NextResponse.json(
      { message: 'Slide supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du slide' },
      { status: 500 }
    );
  }
} 