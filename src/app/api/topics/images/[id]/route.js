import { NextResponse } from 'next/server';
import { get } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.id)) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
  try {
    const result = await get(`topics/images/${params.id}`, { access: 'private' });
    if (!result) return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error loading topic image:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}
