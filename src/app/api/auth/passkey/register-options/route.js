import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { getWebAuthnConfig, isValidUser, normalizeUserId } from '@/lib/webauthn-config';
import { getPasskeysByUser, saveChallenge } from '@/lib/passkeys';

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

  const { rpName, rpID } = getWebAuthnConfig();

  // Get existing credentials so the browser won't re-register them
  const existingPasskeys = await getPasskeysByUser(userId);
  const excludeCredentials = existingPasskeys.map((pk) => ({
    id: pk.id,
    transports: pk.transports,
  }));

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: userId,
    userDisplayName: userId.charAt(0).toUpperCase() + userId.slice(1),
    attestationType: 'none',
    excludeCredentials,
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  // Store the challenge for verification
  await saveChallenge(userId, options.challenge);

  return NextResponse.json(options);
}
