import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/settings
export async function GET() {
  try {
    const settings = await prisma.appSettings.findFirst();

    if (!settings) {
      // Créer des paramètres par défaut s'ils n'existent pas
      const defaultSettings = await prisma.appSettings.create({
        data: {
          standby: false,
          standbyStartTime: new Date('1970-01-01T00:00:00.000Z'),
          standbyEndTime: new Date('1970-01-01T00:00:00.000Z'),
          restartAt: new Date('1970-01-01T00:00:00.000Z'),
          brightness: 100,
        },
      });

      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    );
  }
}

// PUT /api/settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      standby,
      standbyStartTime,
      standbyEndTime,
      restartAt,
      brightness,
    } = body;

    const settings = await prisma.appSettings.upsert({
      where: {
        id: 1, // Nous utilisons toujours l'ID 1 car nous n'avons qu'un seul ensemble de paramètres
      },
      update: {
        standby,
        standbyStartTime: new Date(standbyStartTime),
        standbyEndTime: new Date(standbyEndTime),
        restartAt: new Date(restartAt),
        brightness,
      },
      create: {
        standby,
        standbyStartTime: new Date(standbyStartTime),
        standbyEndTime: new Date(standbyEndTime),
        restartAt: new Date(restartAt),
        brightness,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des paramètres' },
      { status: 500 }
    );
  }
} 