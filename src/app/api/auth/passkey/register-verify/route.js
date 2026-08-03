import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getWebAuthnConfig, isValidUser, normalizeUserId } from '@/lib/webauthn-config';
import { getChallenge, deleteChallenge, savePasskey } from '@/lib/passkeys';

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

  // Retrieve the stored challenge
  const expectedChallenge = await getChallenge(userId);
  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
  }

  const { rpID, origin } = getWebAuthnConfig();

  try {
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    const { credential: regCredential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    // Save the credential to the database
    await savePasskey(userId, {
      id: regCredential.id,
      publicKey: Buffer.from(regCredential.publicKey).toString('base64url'),
      counter: regCredential.counter,
      transports: credential.response.transports || [],
    });

    // Clean up the challenge
    await deleteChallenge(userId);

    return NextResponse.json({
      verified: true,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    });
  } catch (error) {
    console.error('Registration verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
