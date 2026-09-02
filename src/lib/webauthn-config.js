// WebAuthn Relying Party configuration
// In dev: localhost; in production: your Vercel domain

const rpName = 'PANDA';

// RP ID should be the domain without protocol or port
const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';

// Origin must include protocol and port
const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

// Valid user IDs (hardcoded for this 4-person team)
const VALID_USERS = ['nina', 'jiun', 'sebastian', 'roja'];

export function getWebAuthnConfig() {
  return { rpName, rpID, origin };
}

export function isValidUser(userId) {
  return VALID_USERS.includes(userId?.toLowerCase());
}

export function normalizeUserId(userId) {
  return userId?.toLowerCase()?.trim();
}
