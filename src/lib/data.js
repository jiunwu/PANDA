import { createClient } from '@libsql/client';
import defaultData from '@/data/project.json';
import { dbConfig } from '@/lib/config';

const PROJECT_DATA_KEY = 'panda_project_data';

// Keep the client singleton alive for the duration of the serverless invocation
let client;
let tableReady = false;

function getClient() {
  if (!client) {
    const url = dbConfig.TURSO_DATABASE_URL;
    const authToken = dbConfig.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      console.warn('Turso credentials not configured (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN). Falling back to default data.');
      return null;
    }

    client = createClient({ url, authToken });
  }
  return client;
}

async function ensureTable(db) {
  if (tableReady) return;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
  tableReady = true;
}

export async function getProjectData() {
  try {
    const db = getClient();
    if (!db) return defaultData;
    await ensureTable(db);

    const result = await db.execute({
      sql: 'SELECT value FROM kv_store WHERE key = ?',
      args: [PROJECT_DATA_KEY],
    });

    if (result.rows.length > 0 && result.rows[0].value) {
      return JSON.parse(result.rows[0].value);
    }
  } catch (error) {
    console.error('Error fetching data from Turso:', error);
  }

  return defaultData;
}

export async function updateProjectData(newData) {
  try {
    const db = getClient();
    if (!db) return false;
    await ensureTable(db);

    await db.execute({
      sql: 'INSERT INTO kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      args: [PROJECT_DATA_KEY, JSON.stringify(newData)],
    });
    return true;
  } catch (error) {
    console.error('Error saving data to Turso:', error);
    return false;
  }
}
