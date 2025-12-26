import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'firebase-auth-token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// POST - Set auth session cookie (HttpOnly, Secure)
export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });

  return NextResponse.json({ success: true });
}

// DELETE - Clear auth session cookie
export async function DELETE() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return NextResponse.json({ success: true });
}
