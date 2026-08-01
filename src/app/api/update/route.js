import { NextResponse } from 'next/server';

// POST /api/update — receive updates from agents
// In Phase 1, this validates and logs the request.
// In Phase 2, this writes to Vercel KV.
export async function POST(request) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  const apiKey = process.env.PANDA_API_KEY;

  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, action, data, agent, author } = body;

  // Validate required fields
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

  // Phase 1: Log and acknowledge
  // Phase 2: Write to Vercel KV
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

  return NextResponse.json({
    success: true,
    message: `${action} ${type} received`,
    entry: logEntry,
    note: 'Phase 1: Update logged. In Phase 2, this will persist to Vercel KV.',
  });
}
