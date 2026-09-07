import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import { validateTopicImage } from '@/lib/topic-images';

export async function POST(request) {
  try {
    const file = (await request.formData()).get('file');
    const error = validateTopicImage(file);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const id = randomUUID();
    await put(`topics/images/${id}`, file, {
      access: 'private',
      addRandomSuffix: false,
      contentType: file.type,
    });
    return NextResponse.json({ url: `/api/topics/images/${id}` });
  } catch (error) {
    console.error('Error uploading topic image:', error);
    return NextResponse.json({ error: 'Failed to upload image. Please try again.' }, { status: 500 });
  }
}
