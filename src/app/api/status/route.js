import { NextResponse } from 'next/server';
import { getProjectData } from '@/lib/data';

export const dynamic = 'force-dynamic';

// GET /api/status — returns current project state
// Auth is handled by middleware (cookie or Bearer token)
export async function GET() {
  const projectData = await getProjectData();
  const { workPackages, milestones, funding } = projectData;

  const overallProgress = Math.round(
    workPackages.reduce((sum, wp) => sum + wp.progress, 0) / workPackages.length
  );

  const deadline = new Date(funding.deadline);
  const daysLeft = Math.max(0, Math.ceil((deadline - new Date()) / 86400000));

  return NextResponse.json({
    project: projectData.project,
    team: projectData.team,
    funding: projectData.funding,
    milestones,
    workPackages,
    budget: projectData.budget,
    notes: projectData.notes,
    computed: {
      overallProgress,
      daysLeft,
    },
  });
}
