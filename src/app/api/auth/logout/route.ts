import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Logique de déconnexion côté serveur si nécessaire
    // (invalidation de token, session, etc.)
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Failed to logout' },
      { status: 500 }
    );
  }
} 