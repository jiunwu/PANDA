import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { getWebAuthnConfig, isValidUser, normalizeUserId } from '@/lib/webauthn-config';
import { getChallenge, deleteChallenge, getPasskeyById, updatePasskeyCounter } from '@/lib/passkeys';

export const runtime = 'nodejs';

export async function POST(request) {
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

  const { credential } = body;
  if (!credential) {
    return NextResponse.json({ error: 'Missing credential' }, { status: 400 });
  }

  // Retrieve stored challenge
  const expectedChallenge = await getChallenge(userId);
  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
  }

  // Find the credential in the database
  const storedPasskey = await getPasskeyById(credential.id);
  if (!storedPasskey) {
    return NextResponse.json({ error: 'Passkey not found' }, { status: 400 });
  }

  // Verify the credential belongs to the claimed user
  if (storedPasskey.userId !== userId) {
    return NextResponse.json({ error: 'Passkey does not belong to this user' }, { status: 403 });
  }

  const { rpID, origin } = getWebAuthnConfig();

  try {
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
      credential: {
        id: storedPasskey.id,
        publicKey: Uint8Array.from(Buffer.from(storedPasskey.publicKey, 'base64url')),
        counter: storedPasskey.counter,
        transports: storedPasskey.transports,
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 401 });
    }

    // Update the counter
    await updatePasskeyCounter(storedPasskey.id, verification.authenticationInfo.newCounter);

    // Clean up challenge
    await deleteChallenge(userId);

    // Set session cookie with the user identity
    const response = NextResponse.json({ verified: true, user: userId });
    response.cookies.set('panda-auth', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Authentication verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
