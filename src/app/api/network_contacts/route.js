import { NextResponse } from 'next/server';
import { getClient, ensureTables } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const db = getClient();
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    await ensureTables(db);
    const result = await db.execute('SELECT * FROM network_contacts ORDER BY name ASC');
    const response = NextResponse.json(result.rows || []);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (error) {
    console.error('Failed to fetch network contacts', error);
    return NextResponse.json({ error: 'Failed to fetch network contacts' }, { status: 500 });
  }
}
