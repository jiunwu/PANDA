import { NextResponse } from 'next/server';
import { getProjectData, updateProjectData } from '@/lib/data';

// POST /api/update — receive updates from agents
// Auth is handled by middleware (cookie or Bearer token)
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, action, data, agent, author } = body;

  if (!type || !action || !data) {
    return NextResponse.json(
      {
        error: 'Missing required fields',
        required: { type: 'milestone | progress | note | budget | sprint', action: 'update | add', data: '{}' },
        optional: { agent: 'z.ai | lark | custom', author: 'Jiun | Nina | Agent' },
      },
      { status: 400 }
    );
  }

  const validTypes = ['milestone', 'progress', 'note', 'budget', 'sprint'];
  const validActions = ['update', 'add'];

  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
      { status: 400 }
    );
  }

  if (!validActions.includes(action)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
      { status: 400 }
    );
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    action,
    data,
    agent: agent || 'unknown',
    author: author || 'Agent',
    status: 'received',
  };

  console.log('[PANDA API] Update received:', JSON.stringify(logEntry));

  // Phase 2: Persist to Vercel KV
  const projectData = await getProjectData();

  if (type === 'note' && action === 'add') {
    if (!projectData.notes) projectData.notes = [];
    projectData.notes.unshift({
      text: data.text,
      author: author || agent || 'Unknown',
      date: new Date().toISOString().split('T')[0]
    });
  } else if (type === 'milestone') {
    if (!projectData.milestones) projectData.milestones = [];
    if (action === 'add') {
      projectData.milestones.push({
        title: data.title,
        date: data.date || new Date().toISOString().split('T')[0],
        status: data.status || 'upcoming'
      });
    } else if (action === 'update') {
      const ms = projectData.milestones.find(m => m.title === data.title);
      if (ms) {
        if (data.status) ms.status = data.status;
        if (data.date) ms.date = data.date;
      } else {
        return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
      }
    }
  } else if (type === 'progress') {
    if (!projectData.workPackages) projectData.workPackages = [];
    if (action === 'update') {
      const wp = projectData.workPackages.find(w => w.id === data.id);
      if (wp) {
        if (data.progress !== undefined) wp.progress = data.progress;
        if (data.name) wp.name = data.name;
        if (data.owner) wp.owner = data.owner;
      } else {
        return NextResponse.json({ error: 'Work package not found' }, { status: 404 });
      }
    } else if (action === 'add') {
      projectData.workPackages.push({
        id: data.id,
        name: data.name,
        progress: data.progress || 0,
        owner: data.owner || author || agent || 'Unknown'
      });
    }
  } else if (type === 'budget') {
    if (!projectData.budget) projectData.budget = [];
    if (action === 'add') {
      projectData.budget.push({
        label: data.label,
        amount: data.amount,
        pct: data.pct || 0
      });
    } else if (action === 'update') {
      const bg = projectData.budget.find(b => b.label === data.label);
      if (bg) {
        if (data.amount !== undefined) bg.amount = data.amount;
        if (data.pct !== undefined) bg.pct = data.pct;
      } else {
        return NextResponse.json({ error: 'Budget item not found' }, { status: 404 });
      }
    }
  } else if (type === 'sprint') {
    if (!projectData.sprints) projectData.sprints = [];
    if (action === 'add') {
      projectData.sprints.unshift({
        id: data.id,
        name: data.name || '',
        status: data.status || 'Active',
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate || '',
        progress: data.progress || 0,
        tasks: data.tasks || []
      });
    } else if (action === 'update') {
      const sp = projectData.sprints.find(s => s.id === data.id);
      if (sp) {
        if (data.name !== undefined) sp.name = data.name;
        if (data.status !== undefined) sp.status = data.status;
        if (data.startDate !== undefined) sp.startDate = data.startDate;
        if (data.endDate !== undefined) sp.endDate = data.endDate;
        if (data.progress !== undefined) sp.progress = data.progress;
        if (data.tasks !== undefined) sp.tasks = data.tasks;
      } else {
        return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
      }
    }
  }

  // Save back to KV
  const success = await updateProjectData(projectData);
  if (!success) {
    return NextResponse.json({ error: 'Failed to update data in KV' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `${action} ${type} received and saved`,
    entry: logEntry,
  });
}
