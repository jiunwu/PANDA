import { POST } from './route.js';

describe('POST /api/logout', () => {
  it('should return a JSON response indicating success', async () => {
    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true });
  });

  it('should clear the panda-auth cookie', async () => {
    const res = await POST();
    const cookieHeader = res.headers.get('set-cookie');

    expect(cookieHeader).toBeDefined();
    expect(cookieHeader).toContain('panda-auth=');
    expect(cookieHeader).toContain('Max-Age=0');
    expect(cookieHeader).toContain('Path=/');
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toMatch(/SameSite=lax/i);
  });

  it('should set secure flag conditionally based on NODE_ENV', async () => {
    const originalEnv = process.env.NODE_ENV;

    // Test for production environment
    process.env.NODE_ENV = 'production';
    let res = await POST();
    expect(res.headers.get('set-cookie')).toContain('Secure');

    // Test for development environment
    process.env.NODE_ENV = 'development';
    res = await POST();
    expect(res.headers.get('set-cookie')).not.toContain('Secure');

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });
});
