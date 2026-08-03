import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
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

  const existingPasskeys = await getPasskeysByUser(userId);
  if (existingPasskeys.length === 0) {
    return NextResponse.json(
      { error: 'No passkey registered. Please set up a passkey first at /setup' },
      { status: 400 }
    );
  }

  const { rpID } = getWebAuthnConfig();

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: existingPasskeys.map((pk) => ({
      id: pk.id,
      transports: pk.transports,
    })),
    userVerification: 'preferred',
  });

  await saveChallenge(userId, options.challenge);

  return NextResponse.json(options);
}
