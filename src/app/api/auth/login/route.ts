import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    const { user } = await loginUser(username, password);
    
    return NextResponse.json({ user }, { status: 200 });
  } catch (error: unknown) {
    console.error('Login error:', error);
    let message = 'Authentication failed';
    
    if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json(
      { message },
      { status: 401 }
    );
  }
} 