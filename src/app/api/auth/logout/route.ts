import { NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth';

export async function POST() {
  try {
    await logoutUser();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Failed to logout' },
      { status: 500 }
    );
  }
} 