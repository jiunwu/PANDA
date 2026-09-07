import { POST } from './route';
import { GET } from './[id]/route';
import { put, get } from '@vercel/blob';

jest.mock('@vercel/blob', () => ({ put: jest.fn(), get: jest.fn() }));

const id = '12345678-1234-4123-8123-123456789abc';
const image = { name: 'photo.png', type: 'image/png', size: 100, arrayBuffer: async () => new ArrayBuffer(100) };
const request = file => ({ formData: async () => ({ get: () => file }) });

beforeEach(() => jest.clearAllMocks());

it('uploads privately and returns a persistent authenticated image URL', async () => {
  put.mockResolvedValue({});
  const response = await POST(request(image));
  const { url } = await response.json();
  expect(response.status).toBe(200);
  expect(url).toMatch(/^\/api\/topics\/images\/[0-9a-f-]+$/);
  expect(put).toHaveBeenCalledWith(`topics/images/${url.split('/').pop()}`, image, {
    access: 'private', addRandomSuffix: false, contentType: 'image/png',
  });
});

it.each([null, 'not a file', { ...image, type: 'text/html' }, { ...image, size: 0 }, { ...image, size: 4 * 1024 * 1024 + 1 }])('rejects invalid uploads before writing to Blob', async file => {
  expect((await POST(request(file))).status).toBe(400);
  expect(put).not.toHaveBeenCalled();
});

it('serves the private image stream', async () => {
  get.mockResolvedValue({ stream: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('image')); controller.close(); } }), blob: { contentType: 'image/png' } });
  const response = await GET({}, { params: { id } });
  expect(get).toHaveBeenCalledWith(`topics/images/${id}`, { access: 'private' });
  expect(response.headers.get('content-type')).toBe('image/png');
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(await response.text()).toBe('image');
});

it('does not allow reading arbitrary blob paths', async () => {
  expect((await GET({}, { params: { id: '../other-file' } })).status).toBe(404);
  expect(get).not.toHaveBeenCalled();
});

it('returns 404 for missing images', async () => {
  get.mockResolvedValue(null);
  expect((await GET({}, { params: { id } })).status).toBe(404);
});
