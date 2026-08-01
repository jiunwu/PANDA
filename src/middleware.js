import { NextResponse } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/integrations', '/activity', '/api/'];
const PUBLIC_API_PATHS = ['/api/auth', '/api/logout'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Auth endpoints are always public
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check if this path needs protection
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // API routes: check Authorization header OR cookie
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.PANDA_API_KEY;

    // Allow if valid API key in header
    if (apiKey && authHeader === `Bearer ${apiKey}`) {
      return NextResponse.next();
    }

    // Also allow if authenticated via session cookie
    const session = request.cookies.get('panda-auth')?.value;
    if (session === 'authenticated') {
      return NextResponse.next();
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Page routes: check session cookie
  const session = request.cookies.get('panda-auth')?.value;
  if (session === 'authenticated') {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/integrations/:path*', '/activity/:path*', '/api/:path*'],
};
