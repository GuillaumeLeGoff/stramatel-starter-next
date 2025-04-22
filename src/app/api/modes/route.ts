import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/modes
export async function GET() {
  try {
    const modes = await prisma.mode.findMany({
      include: {
        slideshow: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(modes);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des modes' },
      { status: 500 }
    );
  }
}

// POST /api/modes
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slideshowId, settings } = body;

    const mode = await prisma.mode.create({
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

    return NextResponse.json(mode, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la création du mode' },
      { status: 500 }
    );
  }
} 