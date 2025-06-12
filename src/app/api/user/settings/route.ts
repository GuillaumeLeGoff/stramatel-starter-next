import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";

// GET /api/user/settings
export async function GET() {
  try {
    // Récupérer le token du header Authorization
    const headersList = await headers();
    const authorization = headersList.get("Authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Extraire le token
    const token = authorization.split(" ")[1];

    try {
      // Décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: number;
      };

      // Récupérer l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          language: true,
          theme: true,
          role: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Utilisateur non trouvé" },
          { status: 404 }
        );
      }

      return NextResponse.json(user);
    } catch (_error) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des paramètres utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des paramètres utilisateur" },
      { status: 500 }
    );
  }
}

// PUT /api/user/settings
export async function PUT(request: Request) {
  try {
    // Récupérer le token du header Authorization
    const headersList = await headers();
    const authorization = headersList.get("Authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Extraire le token
    const token = authorization.split(" ")[1];

    try {
      // Décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: number;
      };

      const body = await request.json();
      const { username, language, theme } = body;

      // Préparer les données de mise à jour
      const updateData: {
        username?: string;
        language?: string;
        theme?: string;
      } = {};

      if (username !== undefined) updateData.username = username;
      if (language !== undefined) updateData.language = language;
      if (theme !== undefined) updateData.theme = theme;

      // Vérifier si l'username est unique si fourni
      if (updateData.username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username: updateData.username,
            NOT: { id: decoded.id }
          }
        });
        
        if (existingUser) {
          return NextResponse.json(
            { error: "Ce nom d'utilisateur est déjà utilisé" },
            { status: 400 }
          );
        }
      }

      // Mettre à jour l'utilisateur
      const updatedUser = await prisma.user.update({
        where: { id: decoded.id },
        data: updateData,
        select: {
          id: true,
          username: true,
          language: true,
          theme: true,
          role: true,
        },
      });

      return NextResponse.json(updatedUser);
    } catch (_error) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des paramètres utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des paramètres utilisateur" },
      { status: 500 }
    );
  }
} 