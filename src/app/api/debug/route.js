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
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Forbidden: Destructive operations are not allowed in production' },
      { status: 403 }
    );
  }

  const url = dbConfig.TURSO_DATABASE_URL;
  const authToken = dbConfig.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
  }

  try {
    const db = createClient({ url, authToken });
    
    // Create tables if they don't exist yet (in case they reset before viewing the dashboard)
    const { ensureTables } = await import('@/lib/data');
    await ensureTables(db);
    
    // Clear all relational data
    await db.batch([
      'DELETE FROM notes',
      'DELETE FROM milestones',
      'DELETE FROM work_packages',
      'DELETE FROM sprints',
      'DELETE FROM sprint_tasks',
      'DELETE FROM budget',
      'DELETE FROM kv_store' // also clear the old kv_store to be safe
    ]);

    // Insert default budget if present in defaultData (so it's not totally empty)
    if (defaultData.budget && defaultData.budget.length > 0) {
      for (const b of defaultData.budget) {
        await db.execute({
          sql: 'INSERT INTO budget (label, amount, pct) VALUES (?, ?, ?)',
          args: [b.label, b.amount, b.pct]
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Database reset and tables cleared. Ready for external agents!' });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

