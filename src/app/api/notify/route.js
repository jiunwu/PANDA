import { NextResponse } from 'next/server';

// POST /api/notify — push notifications to connected services (Lark, etc.)
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

  const { target, message } = body;

  if (!target || !message) {
    return NextResponse.json(
      {
        error: 'Missing required fields',
        required: { target: 'lark | all', message: 'string' },
      },
      { status: 400 }
    );
  }

  const results = [];

  // Lark webhook notification
  if (target === 'lark' || target === 'all') {
    const larkWebhookUrl = process.env.LARK_WEBHOOK_URL;

    if (larkWebhookUrl) {
      try {
        const larkPayload = {
          msg_type: 'interactive',
          card: {
            header: {
              title: { tag: 'plain_text', content: 'PANDA Update' },
            },
            elements: [
              {
                tag: 'div',
                text: { tag: 'lark_md', content: message },
              },
            ],
          },
        };

        const res = await fetch(larkWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(larkPayload),
        });

        results.push({
          target: 'lark',
          status: res.ok ? 'sent' : 'failed',
          statusCode: res.status,
        });
      } catch (err) {
        results.push({
          target: 'lark',
          status: 'error',
          error: err.message,
        });
      }
    } else {
      results.push({
        target: 'lark',
        status: 'skipped',
        reason: 'LARK_WEBHOOK_URL not configured',
      });
    }
  }

  return NextResponse.json({
    success: true,
    notifications: results,
  });
}
