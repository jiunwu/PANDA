import { NextResponse } from 'next/server';
import { isValidUser, normalizeUserId } from '@/lib/webauthn-config';

export const runtime = 'nodejs';

export async function POST(request) {
  // Only allow in development or Vercel preview environments
  if (process.env.NODE_ENV !== 'development' && process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'Dev login not allowed in this environment' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const userId = normalizeUserId(body.userId);
  if (!isValidUser(userId)) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
  }

  // Set session cookie directly bypassing WebAuthn
  const response = NextResponse.json({ verified: true, user: userId });
  response.cookies.set('panda-auth', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
