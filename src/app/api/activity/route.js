import { NextResponse } from 'next/server';
import { getActivityLog } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activityLog = await getActivityLog();
    return NextResponse.json(activityLog);
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 });
  }
}
