import { NextResponse } from 'next/server';
import { getProjectData } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// GET /api/dashboard-data — returns full current project state
// Auth is handled by middleware (cookie or Bearer token)
export async function GET() {
  const projectData = await getProjectData();
  const response = NextResponse.json(projectData);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  return response;
}
