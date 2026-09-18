import { NextResponse } from 'next/server';
import { get } from '@vercel/blob';

export const dynamic = 'force-dynamic';

// GET /api/finance/invoice/[id] — stream a privately stored invoice
export async function GET(request, { params }) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.id)) {
    return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
  }
  try {
    const result = await get(`invoices/${params.id}`, { access: 'private' });
    if (!result) return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });

    const name = (new URL(request.url).searchParams.get('name') || 'rechnung').replace(/[^\w.\- ]/g, '_').slice(0, 100);
    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${name}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error loading invoice:', error);
    return NextResponse.json({ error: 'Rechnung konnte nicht geladen werden' }, { status: 500 });
  }
}
