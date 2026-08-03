import { NextResponse } from 'next/server';

const JULES_BASE = 'https://jules.googleapis.com/v1alpha';

function getApiKey() {
  return process.env.JULES_API_KEY;
}

// GET /api/jules/sessions/[sessionId] — Get session details + activities
export async function GET(request, { params }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'JULES_API_KEY not configured' },
      { status: 500 }
    );
  }

  const { sessionId } = await params;

  try {
    // Fetch session details and activities in parallel
    const [sessionRes, activitiesRes] = await Promise.all([
      fetch(`${JULES_BASE}/sessions/${sessionId}`, {
        headers: { 'x-goog-api-key': apiKey },
      }),
      fetch(`${JULES_BASE}/sessions/${sessionId}/activities`, {
        headers: { 'x-goog-api-key': apiKey },
      }),
    ]);

    if (!sessionRes.ok) {
      const text = await sessionRes.text();
      return NextResponse.json(
        { error: `Jules API error: ${sessionRes.status}`, details: text },
        { status: sessionRes.status }
      );
    }

    const session = await sessionRes.json();
    const activities = activitiesRes.ok ? await activitiesRes.json() : { activities: [] };

    return NextResponse.json({
      session,
      activities: activities.activities || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to reach Jules API', details: err.message },
      { status: 502 }
    );
  }
}

// POST /api/jules/sessions/[sessionId] — Send message or approve plan
// Body: { action: 'sendMessage' | 'approvePlan', message?: string }
export async function POST(request, { params }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'JULES_API_KEY not configured' },
      { status: 500 }
    );
  }

  const { sessionId } = await params;

  try {
    const body = await request.json();
    const { action, message } = body;

    let url;
    let payload;

    if (action === 'approvePlan') {
      url = `${JULES_BASE}/sessions/${sessionId}:approvePlan`;
      payload = {};
    } else if (action === 'sendMessage') {
      if (!message) {
        return NextResponse.json(
          { error: 'message is required for sendMessage' },
          { status: 400 }
        );
      }
      url = `${JULES_BASE}/sessions/${sessionId}:sendMessage`;
      payload = { message };
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "sendMessage" or "approvePlan"' },
        { status: 400 }
      );
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
