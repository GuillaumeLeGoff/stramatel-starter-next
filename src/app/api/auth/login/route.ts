import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Nom d\'utilisateur ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Nom d\'utilisateur ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Créer le token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'votre_secret_jwt',
      { expiresIn: '24h' }
    );

    // Retourner les informations de l'utilisateur et le token
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
} 