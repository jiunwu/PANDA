import { NextResponse } from 'next/server';
import { getSchedules } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const schedules = await getSchedules();
  return NextResponse.json(schedules);
}
