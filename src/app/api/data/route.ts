import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/data
export async function GET() {
  try {
    const data = await prisma.data.findMany({
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

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}

// POST /api/data
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, value, type, edit } = body;

    const data = await prisma.data.create({
      data: {
        name,
        value,
        type,
        edit,
      },
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la création de la donnée' },
      { status: 500 }
    );
  }
} 