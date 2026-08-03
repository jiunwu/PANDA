import { NextResponse } from 'next/server';

const JULES_BASE = 'https://jules.googleapis.com/v1alpha';

function getApiKey() {
  return process.env.JULES_API_KEY;
}

// GET /api/jules — List connected GitHub sources
export async function GET() {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'JULES_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${JULES_BASE}/sources`, {
      headers: { 'x-goog-api-key': apiKey },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Jules API error: ${res.status}`, details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to reach Jules API', details: err.message },
      { status: 502 }
    );
  }
}

// POST /api/jules — Create a coding session
// Body: { prompt, title?, source, startingBranch?, requirePlanApproval?, automationMode? }
export async function POST(request) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'JULES_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      prompt,
      title,
      source,
      startingBranch = 'main',
      requirePlanApproval = true,
      automationMode = 'AUTO_CREATE_PR',
    } = body;

    if (!prompt || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, source' },
        { status: 400 }
      );
    }

    const sessionPayload = {
      prompt,
      ...(title && { title }),
      sourceContext: {
        source,
        githubRepoContext: { startingBranch },
      },
      requirePlanApproval,
      automationMode,
    };

    const res = await fetch(`${JULES_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionPayload),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Jules API error: ${res.status}`, details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to reach Jules API', details: err.message },
      { status: 502 }
    );
  }
}
