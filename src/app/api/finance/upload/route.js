import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// POST /api/finance/upload — upload invoice file to Vercel Blob
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(`invoices/${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return NextResponse.json({
      url: blob.url,
      name: file.name,
    });
  } catch (error) {
    console.error('Error uploading invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload invoice' }, { status: 500 });
  }
}
