import Database from 'better-sqlite3';
import path from 'path';
import defaultData from '@/data/project.json';

const PROJECT_DATA_KEY = 'panda_project_data';

// Keep the DB connection in memory during execution
let db;

function getDb() {
  if (!db) {
    // Initialize DB in the project root's data folder (or just project root if it doesn't exist)
    const dbPath = path.join(process.cwd(), 'local-data.db');
    db = new Database(dbPath);

    // Create the key-value table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Insert default data if the table is empty
    const stmt = db.prepare('SELECT COUNT(*) as count FROM kv_store');
    const row = stmt.get();

    if (row.count === 0) {
      const insertStmt = db.prepare('INSERT INTO kv_store (key, value) VALUES (?, ?)');
      insertStmt.run(PROJECT_DATA_KEY, JSON.stringify(defaultData));
    }
  }
  return db;
}

export async function getProjectData() {
  try {
    const database = getDb();
    const stmt = database.prepare('SELECT value FROM kv_store WHERE key = ?');
    const row = stmt.get(PROJECT_DATA_KEY);

    if (row && row.value) {
      return JSON.parse(row.value);
    }
  } catch (error) {
    console.error('Error fetching data from SQLite:', error);
  }

  return defaultData;
}

export async function updateProjectData(newData) {
  try {
    const database = getDb();
    const stmt = database.prepare('INSERT INTO kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    stmt.run(PROJECT_DATA_KEY, JSON.stringify(newData));
    return true;
  } catch (error) {
    console.error('Error saving data to SQLite:', error);
    return false;
  }
}
