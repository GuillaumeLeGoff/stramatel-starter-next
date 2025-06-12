import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";

// PUT /api/user/password
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
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "Mot de passe actuel et nouveau mot de passe requis" },
          { status: 400 }
        );
      }

      // Récupérer l'utilisateur avec le mot de passe
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Utilisateur non trouvé" },
          { status: 404 }
        );
      }

      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: "Mot de passe actuel incorrect" },
          { status: 400 }
        );
      }

      // Hasher le nouveau mot de passe
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: decoded.id },
        data: { password: hashedNewPassword },
      });

      return NextResponse.json({ message: "Mot de passe mis à jour avec succès" });
    } catch (_error) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    return NextResponse.json(
      { error: "Erreur lors du changement de mot de passe" },
      { status: 500 }
    );
  }
} 