import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/slideshows/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const slideshow = await prisma.slideshow.findUnique({
      where: {
        id: parseInt(params.id),
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
            data: {
              include: {
                data: true,
              },
            },
          },
        },
        modes: true,
      },
    });

    if (!slideshow) {
      return NextResponse.json(
        { error: 'Slideshow non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(slideshow);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du slideshow' },
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
    const body = await request.json();
    const { name, description } = body;

    const slideshow = await prisma.slideshow.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        name,
        description,
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
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du slideshow' },
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
    await prisma.slideshow.delete({
      where: {
        id: parseInt(params.id),
      },
    });

    return NextResponse.json(
      { message: 'Slideshow supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du slideshow' },
      { status: 500 }
    );
  }
} 