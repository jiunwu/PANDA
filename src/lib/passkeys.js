import { createClient } from '@libsql/client';
import { dbConfig } from '@/lib/config';

// ── Turso client singleton ──
let client;
let tablesReady = false;

function getClient() {
  if (!client) {
    const url = dbConfig.TURSO_DATABASE_URL;
    const authToken = dbConfig.TURSO_AUTH_TOKEN;
    if (!url || !authToken) return null;
    client = createClient({ url, authToken });
  }
  return client;
}

async function ensureTables(db) {
  if (tablesReady) return;

  await db.batch([
    `CREATE TABLE IF NOT EXISTS passkeys (
      credential_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      public_key TEXT NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0,
      transports TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS challenges (
      user_id TEXT PRIMARY KEY,
      challenge TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`,
  ]);

  tablesReady = true;
}

// ── Challenge helpers ──

export async function saveChallenge(userId, challenge) {
  const db = getClient();
  if (!db) return false;
  await ensureTables(db);

  await db.execute({
    sql: `INSERT INTO challenges (user_id, challenge, created_at)
          VALUES (?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET challenge = excluded.challenge, created_at = excluded.created_at`,
    args: [userId, challenge, Date.now()],
  });
  return true;
}

export async function getChallenge(userId) {
  const db = getClient();
  if (!db) return null;
  await ensureTables(db);

  const result = await db.execute({
    sql: 'SELECT challenge, created_at FROM challenges WHERE user_id = ?',
    args: [userId],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const age = Date.now() - Number(row.created_at);

  // Challenges expire after 5 minutes
  if (age > 5 * 60 * 1000) return null;

  return row.challenge;
}

export async function deleteChallenge(userId) {
  const db = getClient();
  if (!db) return;
  await ensureTables(db);

  await db.execute({
    sql: 'DELETE FROM challenges WHERE user_id = ?',
    args: [userId],
  });
}

// ── Passkey credential helpers ──

export async function getPasskeysByUser(userId) {
  const db = getClient();
  if (!db) return [];
  await ensureTables(db);

  const result = await db.execute({
    sql: 'SELECT credential_id, public_key, counter, transports FROM passkeys WHERE user_id = ?',
    args: [userId],
  });

  return result.rows.map((row) => ({
    id: row.credential_id,
    publicKey: row.public_key,
    counter: Number(row.counter),
    transports: row.transports ? JSON.parse(row.transports) : [],
  }));
}

export async function savePasskey(userId, credential) {
  const db = getClient();
  if (!db) return false;
  await ensureTables(db);

  await db.execute({
    sql: `INSERT INTO passkeys (credential_id, user_id, public_key, counter, transports)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      credential.id,
      userId,
      credential.publicKey,
      credential.counter,
      JSON.stringify(credential.transports || []),
    ],
  });
  return true;
}

export async function updatePasskeyCounter(credentialId, newCounter) {
  const db = getClient();
  if (!db) return;
  await ensureTables(db);

  await db.execute({
    sql: 'UPDATE passkeys SET counter = ? WHERE credential_id = ?',
    args: [newCounter, credentialId],
  });
}

export async function getPasskeyById(credentialId) {
  const db = getClient();
  if (!db) return null;
  await ensureTables(db);

  const result = await db.execute({
    sql: 'SELECT credential_id, user_id, public_key, counter, transports FROM passkeys WHERE credential_id = ?',
    args: [credentialId],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.credential_id,
    userId: row.user_id,
    publicKey: row.public_key,
    counter: Number(row.counter),
    transports: row.transports ? JSON.parse(row.transports) : [],
  };
}
