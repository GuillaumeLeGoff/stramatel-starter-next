import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const COOKIE_NAME = 'auth-token';

export interface UserJwtPayload {
  id: string;
  name: string;
}

export async function loginUser(username: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { name: username }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Création du JWT
  const token = jwt.sign(
    { id: user.id, name: user.name } as UserJwtPayload,
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  // Stockage dans un cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8, // 8 heures
    path: '/',
  });

  return { user: { id: user.id, name: user.name } };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getUserFromToken() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  
  if (!cookie?.value) {
    return null;
  }

  try {
    const payload = jwt.verify(cookie.value, JWT_SECRET) as UserJwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.id }
    });

    if (!user) {
      return null;
    }

    return { id: user.id, name: user.name };
  } catch (_error) {
    return null;
  }
} 