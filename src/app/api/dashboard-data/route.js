import { NextResponse } from 'next/server';
import { getProjectData } from '@/lib/data';

export const dynamic = 'force-dynamic';

// GET /api/dashboard-data — returns full current project state
// Auth is handled by middleware (cookie or Bearer token)
export async function GET() {
  const projectData = await getProjectData();
  return NextResponse.json(projectData);
}
