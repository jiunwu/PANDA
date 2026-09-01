import { NextResponse } from 'next/server';
import { getClient, ensureTables } from '@/lib/data';

export async function GET() {
  try {
    const db = getClient();
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    await ensureTables(db);
    const result = await db.execute('SELECT * FROM network_contacts ORDER BY name ASC');
    return NextResponse.json(result.rows || []);
  } catch (error) {
    console.error('Failed to fetch network contacts', error);
    return NextResponse.json({ error: 'Failed to fetch network contacts' }, { status: 500 });
  }
}
