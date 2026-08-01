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
        required: { type: 'milestone | progress | note | budget', action: 'update | add', data: '{}' },
        optional: { agent: 'z.ai | lark | custom', author: 'Jiun | Nina | Agent' },
      },
      { status: 400 }
    );
  }

  const validTypes = ['milestone', 'progress', 'note', 'budget'];
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
