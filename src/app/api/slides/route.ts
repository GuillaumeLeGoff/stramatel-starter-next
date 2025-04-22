import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/slides
export async function GET() {
  try {
    const slides = await prisma.slide.findMany({
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

    return NextResponse.json(slides);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des slides' },
      { status: 500 }
    );
  }
}

// POST /api/slides
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      slideshowId,
      position,
      duration,
      mediaId,
      x,
      y,
      width,
      height,
      dataIds,
    } = body;

    const slide = await prisma.slide.create({
      data: {
        slideshowId,
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

    return NextResponse.json(slide, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la création du slide' },
      { status: 500 }
    );
  }
} 