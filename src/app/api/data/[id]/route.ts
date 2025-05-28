import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/data/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const data = await prisma.data.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        slides: {
          include: {
            slide: {
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
        },
      },
    });

    if (!data) {
      return NextResponse.json(
        { error: 'Donnée non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la donnée' },
      { status: 500 }
    );
  }
}

// PUT /api/data/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, value, type, edit } = body;

    const data = await prisma.data.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name,
        value,
        type,
        edit,
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la donnée' },
      { status: 500 }
    );
  }
}

// DELETE /api/data/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    // Supprimer d'abord les associations avec les slides
    await prisma.slideData.deleteMany({
      where: {
        dataId: parseInt(id),
      },
    });

    // Puis supprimer la donnée
    await prisma.data.delete({
      where: {
        id: parseInt(id),
      },
    });

    return NextResponse.json(
      { message: 'Donnée supprimée avec succès' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la donnée' },
      { status: 500 }
    );
  }
} 