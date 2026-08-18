import { POST } from '../route';
import { NextRequest } from 'next/server';

describe('POST /api/notify', () => {
  const mockFetch = jest.fn();
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    global.fetch = mockFetch;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('returns 400 if request body is invalid JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/notify', {
      method: 'POST',
      body: 'invalid-json',
    });
    // Force throw
    request.json = async () => { throw new Error('Invalid JSON'); };

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid JSON body');
  });

  it('returns 400 if target is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/notify', {
      method: 'POST',
      body: JSON.stringify({ message: 'test message' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing required fields');
  });

  it('returns 400 if message is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/notify', {
      method: 'POST',
      body: JSON.stringify({ target: 'lark' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing required fields');
  });

  it('skips lark notification if LARK_WEBHOOK_URL is not configured', async () => {
    delete process.env.LARK_WEBHOOK_URL;

    const request = new NextRequest('http://localhost:3000/api/notify', {
      method: 'POST',
      body: JSON.stringify({ target: 'lark', message: 'test message' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.notifications[0]).toEqual({
      target: 'lark',
      status: 'skipped',
      reason: 'LARK_WEBHOOK_URL not configured',
    });
  });

  it('sends lark notification successfully', async () => {
    process.env.LARK_WEBHOOK_URL = 'https://lark.webhook.url';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const request = new NextRequest('http://localhost:3000/api/notify', {
      method: 'POST',
      body: JSON.stringify({ target: 'lark', message: 'test message' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.notifications[0]).toEqual({
      target: 'lark',
      status: 'sent',
      statusCode: 200,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('https://lark.webhook.url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msg_type: 'interactive',
        card: {
          header: {
            title: { tag: 'plain_text', content: 'PANDA Update' },
          },
          elements: [
            {
              tag: 'div',
              text: { tag: 'lark_md', content: 'test message' },
            },
          ],
        },
      }),
    });
  });

  it('handles lark notification failure', async () => {
    process.env.LARK_WEBHOOK_URL = 'https://lark.webhook.url';
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const request = new NextRequest('http://localhost:3000/api/notify', {
      method: 'POST',
      body: JSON.stringify({ target: 'lark', message: 'test message' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.notifications[0]).toEqual({
      target: 'lark',
      status: 'failed',
      statusCode: 500,
    });
  });

  it('handles fetch error gracefully', async () => {
    process.env.LARK_WEBHOOK_URL = 'https://lark.webhook.url';
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const request = new NextRequest('http://localhost:3000/api/notify', {
      method: 'POST',
      body: JSON.stringify({ target: 'lark', message: 'test message' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.notifications[0]).toEqual({
      target: 'lark',
      status: 'error',
      error: 'Network error',
    });
  });
});
