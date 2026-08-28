import { NextResponse } from 'next/server';
import { getClient, ensureTables } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// GET /api/finance — fetch all expenses, travel plans, and budget summary
export async function GET() {
  try {
    const db = getClient();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    await ensureTables(db);

    const expensesRes = await db.execute(
      'SELECT id, category, description, amount, date, invoice_url, invoice_name, author, created_at FROM expenses ORDER BY date DESC'
    );
    const travelRes = await db.execute(
      'SELECT id, destination, purpose, start_date, end_date, departure_time, return_time, city_size, nights, nightly_rate, accommodation_total, transport_cost, daily_allowance_total, total_estimated, status, author, created_at FROM travel_plans ORDER BY start_date DESC'
    );

    const expenses = expensesRes.rows;
    const travelPlans = travelRes.rows;
    const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalPlanned = travelPlans
      .filter(t => t.status === 'planned' || t.status === 'approved')
      .reduce((sum, t) => sum + (t.total_estimated || 0), 0);

    const response = NextResponse.json({ expenses, travelPlans, totalSpent, totalPlanned });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (error) {
    console.error('Error fetching finance data:', error);
    return NextResponse.json({ error: 'Failed to fetch finance data' }, { status: 500 });
  }
}

// POST /api/finance — CRUD for expenses and travel plans
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, action, data, author } = body;

  if (!type || !action || !data) {
    return NextResponse.json({
      error: 'Missing required fields',
      required: { type: 'expense | travel_plan', action: 'add | update | delete', data: '{}' },
    }, { status: 400 });
  }

  try {
    const db = getClient();
    if (!db) throw new Error('Database client not configured');
    await ensureTables(db);

    if (type === 'expense') {
      if (action === 'add') {
        const id = data.id || crypto.randomUUID();
        await db.execute({
          sql: 'INSERT INTO expenses (id, category, description, amount, date, invoice_url, invoice_name, invoice_to, project_relevance, author, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [
            id,
            data.category || 'other',
            data.description || '',
            data.amount,
            data.date || new Date().toISOString().split('T')[0],
            data.invoice_url || null,
            data.invoice_name || null,
            data.invoice_to || 'hochschule',
            data.project_relevance || null,
            author || 'Unknown',
            new Date().toISOString()
          ]
        });
        await db.execute({
          sql: 'INSERT INTO activity_log (timestamp, source, action, type) VALUES (?, ?, ?, ?)',
          args: [new Date().toISOString(), author || 'System', `Added expense: ${data.description || data.category} (€${data.amount})`, 'system']
        });
        return NextResponse.json({ success: true, id });
      } else if (action === 'update') {
        await db.execute({
          sql: 'UPDATE expenses SET category = COALESCE(?, category), description = COALESCE(?, description), amount = COALESCE(?, amount), date = COALESCE(?, date), invoice_url = COALESCE(?, invoice_url), invoice_name = COALESCE(?, invoice_name), invoice_to = COALESCE(?, invoice_to), project_relevance = COALESCE(?, project_relevance) WHERE id = ?',
          args: [
            data.category || null,
            data.description || null,
            data.amount !== undefined ? data.amount : null,
            data.date || null,
            data.invoice_url || null,
            data.invoice_name || null,
            data.invoice_to || null,
            data.project_relevance || null,
            data.id
          ]
        });
        return NextResponse.json({ success: true });
      } else if (action === 'delete') {
        await db.execute({ sql: 'DELETE FROM expenses WHERE id = ?', args: [data.id] });
        await db.execute({
          sql: 'INSERT INTO activity_log (timestamp, source, action, type) VALUES (?, ?, ?, ?)',
          args: [new Date().toISOString(), author || 'System', `Deleted expense`, 'system']
        });
        return NextResponse.json({ success: true });
      }
    } else if (type === 'travel_plan') {
      if (action === 'add') {
        const id = data.id || crypto.randomUUID();
        await db.execute({
          sql: 'INSERT INTO travel_plans (id, destination, purpose, start_date, end_date, departure_time, return_time, city_size, nights, nightly_rate, accommodation_total, transport_cost, daily_allowance_total, total_estimated, status, author, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [
            id,
            data.destination,
            data.purpose || '',
            data.start_date,
            data.end_date,
            data.departure_time || null,
            data.return_time || null,
            data.city_size || 'small',
            data.nights || 0,
            data.nightly_rate || 90,
            data.accommodation_total || 0,
            data.transport_cost || 0,
            data.daily_allowance_total || 0,
            data.total_estimated || 0,
            data.status || 'planned',
            author || 'Unknown',
            new Date().toISOString()
          ]
        });
        await db.execute({
          sql: 'INSERT INTO activity_log (timestamp, source, action, type) VALUES (?, ?, ?, ?)',
          args: [new Date().toISOString(), author || 'System', `Planned travel: ${data.destination} (€${data.total_estimated})`, 'system']
        });
        return NextResponse.json({ success: true, id });
      } else if (action === 'update') {
        await db.execute({
          sql: 'UPDATE travel_plans SET destination = COALESCE(?, destination), purpose = COALESCE(?, purpose), start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date), departure_time = COALESCE(?, departure_time), return_time = COALESCE(?, return_time), city_size = COALESCE(?, city_size), nights = COALESCE(?, nights), nightly_rate = COALESCE(?, nightly_rate), accommodation_total = COALESCE(?, accommodation_total), transport_cost = COALESCE(?, transport_cost), daily_allowance_total = COALESCE(?, daily_allowance_total), total_estimated = COALESCE(?, total_estimated), status = COALESCE(?, status) WHERE id = ?',
          args: [
            data.destination || null,
            data.purpose || null,
            data.start_date || null,
            data.end_date || null,
            data.departure_time !== undefined ? data.departure_time : null,
            data.return_time !== undefined ? data.return_time : null,
            data.city_size || null,
            data.nights !== undefined ? data.nights : null,
            data.nightly_rate !== undefined ? data.nightly_rate : null,
            data.accommodation_total !== undefined ? data.accommodation_total : null,
            data.transport_cost !== undefined ? data.transport_cost : null,
            data.daily_allowance_total !== undefined ? data.daily_allowance_total : null,
            data.total_estimated !== undefined ? data.total_estimated : null,
            data.status || null,
            data.id
          ]
        });
        return NextResponse.json({ success: true });
      } else if (action === 'delete') {
        await db.execute({ sql: 'DELETE FROM travel_plans WHERE id = ?', args: [data.id] });
        await db.execute({
          sql: 'INSERT INTO activity_log (timestamp, source, action, type) VALUES (?, ?, ?, ?)',
          args: [new Date().toISOString(), author || 'System', `Deleted travel plan`, 'system']
        });
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Invalid type or action' }, { status: 400 });
  } catch (error) {
    console.error('Error in finance API:', error);
    return NextResponse.json({ error: 'Failed to process request', details: error.message }, { status: 500 });
  }
}
