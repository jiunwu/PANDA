import { createClient } from '@libsql/client';
import defaultData from '@/data/project.json';
import integrationsData from '@/data/integrations.json';
import { dbConfig } from '@/lib/config';

// Keep the client singleton alive
let client;
let tablesReady = false;

export function getClient() {
  if (!client) {
    const url = dbConfig.TURSO_DATABASE_URL;
    const authToken = dbConfig.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      console.warn('Turso credentials not configured.');
      return null;
    }
    client = createClient({ url, authToken });
  }
  return client;
}

export async function ensureTables(db) {
  if (tablesReady) return;
  
  await db.batch([
    `CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      author TEXT,
      date TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS milestones (
      title TEXT PRIMARY KEY,
      date TEXT,
      status TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS work_packages (
      id TEXT PRIMARY KEY,
      name TEXT,
      progress INTEGER DEFAULT 0,
      owner TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS sprints (
      id TEXT PRIMARY KEY,
      name TEXT,
      status TEXT,
      start_date TEXT,
      end_date TEXT,
      progress INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS sprint_tasks (
      id TEXT PRIMARY KEY,
      sprint_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS budget (
      label TEXT PRIMARY KEY,
      amount INTEGER,
      pct INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      source TEXT,
      action TEXT NOT NULL,
      type TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      author TEXT,
      updated_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      date_end TEXT,
      time_start TEXT,
      time_end TEXT,
      color TEXT,
      author TEXT,
      created_at TEXT
    )`
  ]);
  
  // Try to migrate existing table
  try {
    await db.execute('ALTER TABLE schedules ADD COLUMN date_end TEXT');
  } catch (err) {
    // Column might already exist, ignore error
  }
  
  tablesReady = true;
}

export async function getProjectData() {
  try {
    const db = getClient();
    if (!db) return defaultData;
    await ensureTables(db);

    const notesRes = await db.execute('SELECT text, author, date FROM notes ORDER BY id DESC');
    const milestonesRes = await db.execute('SELECT title, date, status FROM milestones');
    const wpRes = await db.execute('SELECT id, name, progress, owner FROM work_packages');
    const sprintsRes = await db.execute('SELECT id, name, status, start_date as startDate, end_date as endDate, progress FROM sprints');
    const tasksRes = await db.execute('SELECT id, sprint_id as sprintId, title, status FROM sprint_tasks');
    const budgetRes = await db.execute('SELECT label, amount, pct FROM budget');

    const sprints = sprintsRes.rows.map(s => {
      const sprintTasks = tasksRes.rows.filter(t => t.sprintId === s.id).map(t => ({
        id: t.id,
        title: t.title,
        status: t.status
      }));
      return { ...s, tasks: sprintTasks };
    });

    return {
      ...defaultData,
      notes: notesRes.rows,
      milestones: milestonesRes.rows,
      workPackages: wpRes.rows,
      budget: budgetRes.rows.length > 0 ? budgetRes.rows : defaultData.budget,
      sprints: sprints
    };
  } catch (error) {
    console.error('Error fetching relational data from Turso:', error);
    return defaultData;
  }
}


export async function getActivityLog() {
  try {
    const db = getClient();
    if (!db) return integrationsData.activityLog;
    await ensureTables(db);

    const res = await db.execute('SELECT timestamp, source, action, type FROM activity_log ORDER BY id DESC');
    if (res.rows.length === 0) return integrationsData.activityLog;

    return res.rows;
  } catch (error) {
    console.error('Error fetching activity log from Turso:', error);
    return integrationsData.activityLog;
  }
}

export async function getTopics() {
  try {
    const db = getClient();
    if (!db) return [];
    await ensureTables(db);
    const res = await db.execute('SELECT id, title, content, author, updated_at FROM topics ORDER BY updated_at DESC');
    return res.rows;
  } catch (error) {
    console.error('Error fetching topics from Turso:', error);
    return [];
  }
}

export async function getSchedules() {
  try {
    const db = getClient();
    if (!db) return [];
    await ensureTables(db);
    const res = await db.execute('SELECT id, title, description, date, date_end, time_start, time_end, color, author, created_at FROM schedules ORDER BY date ASC, time_start ASC');
    return res.rows;
  } catch (error) {
    console.error('Error fetching schedules from Turso:', error);
    return [];
  }
}
