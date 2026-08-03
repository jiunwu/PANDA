import { NextResponse } from 'next/server';

const JULES_BASE = 'https://jules.googleapis.com/v1alpha';

function getApiKey() {
  return process.env.JULES_API_KEY;
}

// GET /api/jules/sessions — List all Jules sessions
export async function GET() {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'JULES_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${JULES_BASE}/sessions`, {
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
