import { NextResponse } from 'next/server';
import projectData from '@/data/project.json';

// GET /api/status — returns current project state
export async function GET(request) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  const apiKey = process.env.PANDA_API_KEY;

  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
