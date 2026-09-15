import { POST } from './route';
import { GET } from '../invoice/[id]/route';
import { put, get } from '@vercel/blob';

jest.mock('@vercel/blob', () => ({ put: jest.fn(), get: jest.fn() }));

const id = '12345678-1234-4123-8123-123456789abc';
const invoice = { name: 'rechnung.pdf', type: 'application/pdf', size: 100, arrayBuffer: async () => new ArrayBuffer(100) };
const request = file => ({ formData: async () => ({ get: () => file }) });

beforeEach(() => jest.clearAllMocks());

it('uploads privately and returns a URL served through the authenticated route', async () => {
  put.mockResolvedValue({});
  const response = await POST(request(invoice));
  const { url, name } = await response.json();
  expect(response.status).toBe(200);
  expect(url).toMatch(/^\/api\/finance\/invoice\/[0-9a-f-]+$/);
  expect(name).toBe('rechnung.pdf');
  expect(put).toHaveBeenCalledWith(`invoices/${url.split('/').pop()}`, invoice, {
    access: 'private', addRandomSuffix: false, contentType: 'application/pdf',
  });
});

it.each([null, 'not a file', { ...invoice, type: 'text/html' }, { ...invoice, size: 0 }, { ...invoice, size: 4 * 1024 * 1024 + 1 }])('rejects invalid uploads with an error message', async file => {
  const response = await POST(request(file));
  expect(response.status).toBe(400);
  expect((await response.json()).error).toEqual(expect.any(String));
  expect(put).not.toHaveBeenCalled();
});

it('reports a failed Blob write instead of returning a URL', async () => {
  put.mockRejectedValue(new Error('store unavailable'));
  const response = await POST(request(invoice));
  expect(response.status).toBe(500);
  expect((await response.json()).url).toBeUndefined();
});

it('serves the private invoice stream under its original filename', async () => {
  get.mockResolvedValue({
    stream: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('pdf')); c.close(); } }),
    blob: { contentType: 'application/pdf' },
  });
  const response = await GET({ url: `http://x/api/finance/invoice/${id}?name=rechnung.pdf` }, { params: { id } });
  expect(get).toHaveBeenCalledWith(`invoices/${id}`, { access: 'private' });
  expect(response.headers.get('content-type')).toBe('application/pdf');
  expect(response.headers.get('content-disposition')).toBe('inline; filename="rechnung.pdf"');
  expect(await response.text()).toBe('pdf');
});

it('does not allow reading arbitrary blob paths', async () => {
  expect((await GET({ url: 'http://x/' }, { params: { id: '../other-file' } })).status).toBe(404);
  expect(get).not.toHaveBeenCalled();
});

it('returns 404 for missing invoices', async () => {
  get.mockResolvedValue(null);
  expect((await GET({ url: 'http://x/' }, { params: { id } })).status).toBe(404);
});
