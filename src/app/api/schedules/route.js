import { NextResponse } from 'next/server';
import { getSchedules } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const schedules = await getSchedules();
  const response = NextResponse.json(schedules);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  return response;
}
