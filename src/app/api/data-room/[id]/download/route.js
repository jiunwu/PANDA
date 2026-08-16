import { NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { getClient, ensureTables } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const db = getClient();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    await ensureTables(db);

    const res = await db.execute({
      sql: 'SELECT url FROM data_room_files WHERE id = ?',
      args: [id]
    });

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileUrl = res.rows[0].url;

    // Use Vercel Blob SDK to fetch private file
    const result = await get(fileUrl, { access: 'private' });

    if (!result) {
      return NextResponse.json({ error: 'File not found in blob store' }, { status: 404 });
    }

    // Return the file stream
    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': `inline; filename="${result.blob.pathname}"`,
      }
    });

  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}
