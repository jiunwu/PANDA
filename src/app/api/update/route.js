import { NextResponse } from 'next/server';
import { getClient, ensureTables } from '@/lib/data';

// POST /api/update — receive updates from agents
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, action, data, agent, author } = body;

  if (!type || !action || !data) {
    return NextResponse.json(
      {
        error: 'Missing required fields',
        required: { type: 'milestone | progress | note | budget | sprint', action: 'update | add', data: '{}' },
        optional: { agent: 'z.ai | lark | custom', author: 'Jiun | Nina | Agent' },
      },
      { status: 400 }
    );
  }

  const validTypes = ['milestone', 'progress', 'note', 'budget', 'sprint'];
  const validActions = ['update', 'add'];

  if (!validTypes.includes(type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  if (!validActions.includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    action,
    data,
    agent: agent || 'unknown',
    author: author || 'Agent',
    status: 'received',
  };

  console.log('[PANDA API] Update received:', JSON.stringify(logEntry));

  try {
    const db = getClient();
    if (!db) throw new Error('Database client not configured');
    await ensureTables(db);

    if (type === 'note' && action === 'add') {
      await db.execute({
        sql: 'INSERT INTO notes (text, author, date) VALUES (?, ?, ?)',
        args: [data.text, author || agent || 'Unknown', new Date().toISOString().split('T')[0]]
      });
      await db.execute({
        sql: 'INSERT INTO activity_log (timestamp, source, action, type) VALUES (?, ?, ?, ?)',
        args: [new Date().toISOString(), author || agent || 'System', `Added note: ${data.text}`, 'note']
      });
    } else if (type === 'milestone') {
      if (action === 'add') {
        await db.execute({
          sql: 'INSERT INTO milestones (title, date, status) VALUES (?, ?, ?)',
          args: [data.title, data.date || new Date().toISOString().split('T')[0], data.status || 'upcoming']
        });
        await db.execute({
          sql: 'INSERT INTO activity_log (timestamp, source, action, type) VALUES (?, ?, ?, ?)',
          args: [new Date().toISOString(), author || agent || 'System', `Added milestone: ${data.title}`, 'milestone']
        });
      } else if (action === 'update') {
        await db.execute({
          sql: 'UPDATE milestones SET date = COALESCE(?, date), status = COALESCE(?, status) WHERE title = ?',
          args: [data.date || null, data.status || null, data.title]
        });
        await db.execute({
          sql: 'INSERT INTO activity_log (timestamp, source, action, type) VALUES (?, ?, ?, ?)',
          args: [new Date().toISOString(), author || agent || 'System', `Updated milestone ${data.title} to ${data.status || 'unknown status'}`, 'milestone']
        });
      }
    } else if (type === 'progress') {
      if (action === 'add') {
        await db.execute({
          sql: 'INSERT INTO work_packages (id, name, progress, owner) VALUES (?, ?, ?, ?)',
          args: [data.id, data.name, data.progress || 0, data.owner || author || agent || 'Unknown']
        });
        await db.execute({
          sql: 'INSERT INTO activity_log (timestamp, source, action, type) VALUES (?, ?, ?, ?)',
          args: [new Date().toISOString(), author || agent || 'System', `Added work package ${data.id} (${data.name})`, 'progress']
        });
      } else if (action === 'update') {
        await db.execute({
          sql: 'UPDATE work_packages SET name = COALESCE(?, name), progress = COALESCE(?, progress), owner = COALESCE(?, owner) WHERE id = ?',
          args: [data.name || null, data.progress !== undefined ? data.progress : null, data.owner || null, data.id]
        });
        await db.execute({
          sql: 'INSERT INTO activity_log (timestamp, source, action, type) VALUES (?, ?, ?, ?)',
          args: [new Date().toISOString(), author || agent || 'System', `Updated progress for ${data.id} to ${data.progress}%`, 'progress']
        });
      }
    } else if (type === 'budget') {
      if (action === 'add') {
        await db.execute({
          sql: 'INSERT INTO budget (label, amount, pct) VALUES (?, ?, ?)',
          args: [data.label, data.amount, data.pct || 0]
        });
        await db.execute({
          sql: 'INSERT INTO activity_log (timestamp, source, action, type) VALUES (?, ?, ?, ?)',
          args: [new Date().toISOString(), author || agent || 'System', `Added budget: ${data.label}`, 'system']
        });
      } else if (action === 'update') {
        await db.execute({
          sql: 'UPDATE budget SET amount = COALESCE(?, amount), pct = COALESCE(?, pct) WHERE label = ?',
          args: [data.amount !== undefined ? data.amount : null, data.pct !== undefined ? data.pct : null, data.label]
        });
        await db.execute({
          sql: 'INSERT INTO activity_log (timestamp, source, action, type) VALUES (?, ?, ?, ?)',
          args: [new Date().toISOString(), author || agent || 'System', `Updated budget for ${data.label}`, 'system']
        });
      }
    } else if (type === 'sprint') {
      if (action === 'add') {
        await db.execute({
          sql: 'INSERT INTO sprints (id, name, status, start_date, end_date, progress) VALUES (?, ?, ?, ?, ?, ?)',
          args: [data.id, data.name || '', data.status || 'Active', data.startDate || new Date().toISOString().split('T')[0], data.endDate || '', data.progress || 0]
        });
        if (data.tasks && data.tasks.length > 0) {
          for (const task of data.tasks) {
            await db.execute({
              sql: 'INSERT INTO sprint_tasks (id, sprint_id, title, status) VALUES (?, ?, ?, ?)',
              args: [task.id || crypto.randomUUID(), data.id, task.title, task.status || 'todo']
            });
          }
        }
        await db.execute({
          sql: 'INSERT INTO activity_log (timestamp, source, action, type) VALUES (?, ?, ?, ?)',
          args: [new Date().toISOString(), author || agent || 'System', `Created sprint ${data.id}`, 'system']
        });
      } else if (action === 'update') {
        await db.execute({
          sql: 'UPDATE sprints SET name = COALESCE(?, name), status = COALESCE(?, status), start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date), progress = COALESCE(?, progress) WHERE id = ?',
          args: [data.name || null, data.status || null, data.startDate || null, data.endDate || null, data.progress !== undefined ? data.progress : null, data.id]
        });
        
        // If tasks are provided, we do a full replacement of tasks for this sprint
        if (data.tasks !== undefined) {
          await db.execute({ sql: 'DELETE FROM sprint_tasks WHERE sprint_id = ?', args: [data.id] });
          for (const task of data.tasks) {
            await db.execute({
              sql: 'INSERT INTO sprint_tasks (id, sprint_id, title, status) VALUES (?, ?, ?, ?)',
              args: [task.id || crypto.randomUUID(), data.id, task.title, task.status || 'todo']
            });
          }
        }
        await db.execute({
          sql: 'INSERT INTO activity_log (timestamp, source, action, type) VALUES (?, ?, ?, ?)',
          args: [new Date().toISOString(), author || agent || 'System', `Updated sprint ${data.id}`, 'system']
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${action} ${type} received and saved to relational DB`,
      entry: logEntry,
    });
  } catch (error) {
    console.error('Error saving data to DB:', error);
    return NextResponse.json({ error: 'Failed to update data in database', details: error.message }, { status: 500 });
  }
}

