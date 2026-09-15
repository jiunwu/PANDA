import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import { validateInvoiceFile } from '@/lib/invoice-files';

export const dynamic = 'force-dynamic';

// POST /api/finance/upload — upload invoice file to Vercel Blob
export async function POST(request) {
  try {
    const file = (await request.formData()).get('file');
    const error = validateInvoiceFile(file);
    if (error) return NextResponse.json({ error }, { status: 400 });

    // The Blob store is private-only, so store it privately and serve it back
    // through /api/finance/invoice/[id], which authenticates the read.
    const id = randomUUID();
    await put(`invoices/${id}`, file, {
      access: 'private',
      addRandomSuffix: false,
      contentType: file.type,
    });

    return NextResponse.json({ url: `/api/finance/invoice/${id}`, name: file.name });
  } catch (error) {
    console.error('Error uploading invoice:', error);
    return NextResponse.json({ error: 'Rechnung konnte nicht hochgeladen werden. Bitte erneut versuchen.' }, { status: 500 });
  }
}
