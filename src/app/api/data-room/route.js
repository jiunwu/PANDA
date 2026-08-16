import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getClient, ensureTables } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getClient();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    await ensureTables(db);
    const res = await db.execute('SELECT id, title, url, status, last_updated as lastUpdated, folder FROM data_room_files ORDER BY last_updated DESC');
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error('Error listing data room files:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'Other';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'private',
      addRandomSuffix: true,
    });

    const db = getClient();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    await ensureTables(db);

    const id = Date.now().toString();
    const title = file.name;
    const url = blob.url;
    const status = 'Uploaded';
    const lastUpdated = new Date().toISOString().split('T')[0];

    await db.execute({
      sql: 'INSERT INTO data_room_files (id, title, url, status, last_updated, folder) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, title, url, status, lastUpdated, folder]
    });

    return NextResponse.json({ id, title, url, status, lastUpdated, folder });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}
