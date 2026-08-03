import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { dbConfig } from '@/lib/config';
import defaultData from '@/data/project.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = dbConfig.TURSO_DATABASE_URL;
  const authToken = dbConfig.TURSO_AUTH_TOKEN;

  const debugInfo = {
    environment: {
      TURSO_DATABASE_URL: url ? url : 'NOT SET',
      TURSO_AUTH_TOKEN: authToken ? 'SET (hidden)' : 'NOT SET',
      WEBAUTHN_RP_ID: process.env.WEBAUTHN_RP_ID || 'NOT SET',
      WEBAUTHN_ORIGIN: process.env.WEBAUTHN_ORIGIN || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
      NOTE: "Using hardcoded Turso DB config from src/lib/config.js",
    },
    connection: 'pending',
    tables: [],
    kv_store: null,
    passkeys: [],
    challenges: []
  };

  if (!url || !authToken) {
    debugInfo.connection = 'failed - missing credentials';
    return NextResponse.json(debugInfo);
  }

  try {
    const db = createClient({ url, authToken });
    
    // Check connection by getting sqlite version or tables
    const tablesRes = await db.execute("SELECT name FROM sqlite_master WHERE type='table';");
    debugInfo.tables = tablesRes.rows.map(r => r.name);
    debugInfo.connection = 'success';

    // Fetch kv_store
    if (debugInfo.tables.includes('kv_store')) {
      const kvRes = await db.execute("SELECT * FROM kv_store");
      debugInfo.kv_store = kvRes.rows;
    }

    // Fetch passkeys
    if (debugInfo.tables.includes('passkeys')) {
      const pkRes = await db.execute("SELECT * FROM passkeys");
      debugInfo.passkeys = pkRes.rows;
    }
    
    // Fetch challenges
    if (debugInfo.tables.includes('challenges')) {
      const chRes = await db.execute("SELECT * FROM challenges");
      debugInfo.challenges = chRes.rows;
    }

  } catch (error) {
    debugInfo.connection = `error - ${error.message}`;
  }

  return NextResponse.json(debugInfo);
}

export async function POST() {
  const url = dbConfig.TURSO_DATABASE_URL;
  const authToken = dbConfig.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
  }

  try {
    const db = createClient({ url, authToken });
    await db.execute(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
    
    await db.execute({
      sql: 'INSERT INTO kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      args: ['panda_project_data', JSON.stringify(defaultData)],
    });

    return NextResponse.json({ success: true, message: 'Database reset to local project.json' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
