import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';

export async function withAuth(
  request: NextRequest,
  callback: (user: any) => Promise<NextResponse>
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Exécuter le callback avec l'utilisateur authentifié
    return callback(user);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
} 