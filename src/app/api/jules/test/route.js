import { NextResponse } from 'next/server';

// POST /api/jules/test — Test a Jules API key by listing sources
export async function POST(request) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: 'API key is required' },
        { status: 400 }
      );
    }

    const res = await fetch('https://jules.googleapis.com/v1alpha/sources', {
      headers: { 'x-goog-api-key': apiKey },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({
        ok: false,
        status: res.status,
        error: res.status === 401 || res.status === 403
          ? 'Invalid API key or insufficient permissions'
          : `Jules API returned ${res.status}`,
        details: text,
      });
    }

    const data = await res.json();
    const sources = data.sources || [];

    return NextResponse.json({
      ok: true,
      sources: sources.map((s) => ({
        name: s.name,
        displayName: s.displayName || s.name,
      })),
      message: sources.length > 0
        ? `Connected — ${sources.length} repo(s) available`
        : 'Connected — no GitHub repos linked yet. Install the Jules GitHub App on your repos.',
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'Failed to reach Jules API', details: err.message },
      { status: 502 }
    );
  }
}
