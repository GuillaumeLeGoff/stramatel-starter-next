import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { JwtPayload } from './types/@middleware';

// Liste des routes qui ne nécessitent pas d'authentification
const publicRoutes = [
  '/api/auth/login',
];

export function middleware(request: NextRequest) {
  // Vérifier si la route est publique
  if (publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Récupérer le token du header Authorization
  const authorization = request.headers.get('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  const token = authorization.split(' ')[1];

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'votre_secret_jwt'
    ) as JwtPayload;
    
    // Ajouter les informations de l'utilisateur aux headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('X-User-Id', decoded.id.toString());
    requestHeaders.set('X-User-Username', decoded.username);
    requestHeaders.set('X-User-Role', decoded.role);

    // Continuer avec les headers modifiés
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Token invalide ou expiré' },
      { status: 401 }
    );
  }
}

// Configurer les routes sur lesquelles le middleware doit s'exécuter
export const config = {
  matcher: [
    '/api/slideshows/:path*',
    '/api/slides/:path*',
    '/api/data/:path*',
    '/api/media/:path*',
    '/api/modes/:path*',
    '/api/settings/:path*',
    '/api/auth/me',
  ],
}; 