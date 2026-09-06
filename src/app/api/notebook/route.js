import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// A fixed source prevents this endpoint from being used as an arbitrary URL proxy.
const SOURCE = 'https://drive.google.com/uc?export=download&id=1v5qTo-eFbUHkveAfTBizQ2RLTk3hEzeT';
const MAX_BYTES = 10 * 1024 * 1024;

export async function GET() {
  try {
    const response = await fetch(SOURCE, {
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok || !response.body) throw new Error('Download failed');
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new Error('Notebook exceeds size limit');
      }
      chunks.push(Buffer.from(value));
    }
    const notebook = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (notebook.nbformat !== 4 || !Array.isArray(notebook.cells) ||
        !notebook.cells.every(cell => cell && typeof cell.cell_type === 'string' &&
          (typeof cell.source === 'string' || (Array.isArray(cell.source) && cell.source.every(line => typeof line === 'string'))) &&
          (cell.outputs === undefined || Array.isArray(cell.outputs)))) {
      throw new Error('Unsupported notebook format');
    }
    return NextResponse.json(notebook, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({
      error: 'Unable to load the saved notebook. Check its Google Drive sharing permissions, then try again. You can also open it in Colab.',
    }, { status: 502, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
