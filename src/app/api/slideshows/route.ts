import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    return NextResponse.json(slideshows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des slideshows' },
      { status: 500 }
    );
  }
}

// POST /api/slideshows
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, createdBy } = body;

    const slideshow = await prisma.slideshow.create({
      data: {
        name,
        description,
        createdBy,
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

    return NextResponse.json(slideshow, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la création du slideshow' },
      { status: 500 }
    );
  }
} 