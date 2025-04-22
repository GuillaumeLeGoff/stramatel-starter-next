import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';

export async function GET() {
  try {
    // Récupérer le token du header Authorization
    const headersList = await headers();
    const authorization = headersList.get('Authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Extraire le token
    const token = authorization.split(' ')[1];

    try {
      // Décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };

      // Récupérer l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          language: true,
          theme: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        );
      }

      return NextResponse.json(user);
    } catch (_error) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 401 }
      );
    }
  } catch (_error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
} 