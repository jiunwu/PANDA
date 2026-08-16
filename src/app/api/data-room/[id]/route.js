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

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const db = getClient();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    await ensureTables(db);

    const lastUpdated = new Date().toISOString().split('T')[0];

    const res = await db.execute({
      sql: 'UPDATE data_room_files SET title = ?, last_updated = ? WHERE id = ?',
      args: [title, lastUpdated, id]
    });

    if (res.rowsAffected === 0) {
      return NextResponse.json({ error: 'File not found or no changes made' }, { status: 404 });
    }

    return NextResponse.json({ success: true, title, lastUpdated });
  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
}
