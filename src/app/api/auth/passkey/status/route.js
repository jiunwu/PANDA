import { NextResponse } from 'next/server';
import { getPasskeysByUser } from '@/lib/passkeys';

// GET /api/auth/passkey/status?userId=jiun
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const passkeys = await getPasskeysByUser(userId);
    return NextResponse.json({
      userId,
      hasPasskey: passkeys.length > 0,
      count: passkeys.length,
    });
  } catch (error) {
    console.error('Error checking passkey status:', error);
    return NextResponse.json(
      { error: 'Failed to check passkey status' },
      { status: 500 }
    );
  }
}
