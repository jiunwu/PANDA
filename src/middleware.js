import { NextResponse } from 'next/server';

const PROTECTED_PATHS = [
  '/dashboard',
  '/sprints',
  '/milestones',
  '/work-packages',
  '/notes',
  '/integrations',
  '/activity',
  '/api/',
];
const PUBLIC_API_PATHS = ['/api/auth', '/api/logout'];
const VALID_SESSIONS = ['authenticated', 'nina', 'jiun'];

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
    if (VALID_SESSIONS.includes(session)) {
      return NextResponse.next();
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Page routes: check session cookie
  const session = request.cookies.get('panda-auth')?.value;
  if (VALID_SESSIONS.includes(session)) {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/sprints/:path*',
    '/milestones/:path*',
    '/work-packages/:path*',
    '/notes/:path*',
    '/integrations/:path*',
    '/activity/:path*',
    '/api/:path*',
  ],
};
