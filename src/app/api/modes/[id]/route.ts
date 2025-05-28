import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/modes/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const mode = await prisma.mode.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        slideshow: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!mode) {
      return NextResponse.json(
        { error: 'Mode non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(mode);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du mode' },
      { status: 500 }
    );
  }
}

// PUT /api/modes/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slideshowId, settings } = body;

    const mode = await prisma.mode.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name,
        slideshowId,
        settings,
      },
      include: {
        slideshow: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(mode);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du mode' },
      { status: 500 }
    );
  }
}

// DELETE /api/modes/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    await prisma.mode.delete({
      where: {
        id: parseInt(id),
      },
    });

    return NextResponse.json(
      { message: 'Mode supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du mode' },
      { status: 500 }
    );
  }
} 