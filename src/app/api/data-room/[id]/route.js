import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { getClient, ensureTables } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
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

    // Delete from Vercel Blob
    await del(fileUrl);

    // Delete from database
    await db.execute({
      sql: 'DELETE FROM data_room_files WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
