import { GET } from './route';

describe('GET /api/notebook', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  it('returns saved notebook cells without caching private responses', async () => {
    const notebook = { nbformat: 4, cells: [{ cell_type: 'markdown', source: ['# Notebook'] }] };
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify(notebook)));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(notebook);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it.each(['<html>Sign in to Google</html>', '{"nbformat":4,"cells":[null]}'])(
    'handles inaccessible or invalid notebook downloads', async body => {
      global.fetch = jest.fn().mockResolvedValue(new Response(body));
      const response = await GET();
      expect(response.status).toBe(502);
      expect((await response.json()).error).toContain('sharing permissions');
    }
  );

  it('handles a timeout without exposing upstream details', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('upstream details'));
    const response = await GET();
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain('upstream details');
  });

  it('rejects oversized downloads', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(' '.repeat(10 * 1024 * 1024 + 1)));
    expect((await GET()).status).toBe(502);
  });
});
