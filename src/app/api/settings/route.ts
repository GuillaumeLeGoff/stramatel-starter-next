import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/settings
export async function GET() {
  try {
    const settings = await prisma.appSettings.findFirst();

    if (!settings) {
      // Créer des paramètres par défaut s'ils n'existent pas
      const defaultSettings = await prisma.appSettings.create({
        data: {
          restartAt: new Date("1970-01-01T00:00:00.000Z"),
          brightness: 100,
          width: 1920,
          height: 1080,
        },
      });

      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erreur lors de la récupération des paramètres:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des paramètres" },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour vérifier si une date est valide
const isValidDate = (dateString: string | Date | undefined): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// PUT /api/settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      restartAt,
      brightness,
      width,
      height,
    } = body;

    // Récupérer les paramètres actuels pour conserver les dates valides
    const currentSettings = await prisma.appSettings.findFirst();

    // Préparer les données de mise à jour avec un typage explicite
    const updateData: {
      brightness?: number;
      width?: number;
      height?: number;
      restartAt?: Date;
    } = {
      brightness:
        brightness !== undefined ? brightness : currentSettings?.brightness,
      ...(width !== undefined && { width }),
      ...(height !== undefined && { height }),
    };

    // Gérer la date restartAt uniquement si elle est valide
    if (restartAt && isValidDate(restartAt)) {
      updateData.restartAt = new Date(restartAt);
    }

    // Données par défaut pour la création
    const defaultCreateData = {
      restartAt: new Date("1970-01-01T00:00:00.000Z"),
      brightness: brightness !== undefined ? brightness : 100,
      width: width || 1920,
      height: height || 1080,
    };

    const settings = await prisma.appSettings.upsert({
      where: {
        id: 1, // Nous utilisons toujours l'ID 1 car nous n'avons qu'un seul ensemble de paramètres
      },
      update: updateData,
      create: defaultCreateData,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erreur lors de la mise à jour des paramètres:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des paramètres" },
      { status: 500 }
    );
  }
}
