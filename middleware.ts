import { NextResponse, type NextRequest } from 'next/server';

/**
 * Lightweight middleware:
 *  - In demo mode (PAWLY_DEMO_MODE=true) we skip auth — the app uses a singleton demo user.
 *  - Otherwise, gate the (app) routes behind a session cookie. Real session validation
 *    happens server-side inside each route via getCurrentUser() / requireUser().
 *
 * NOTE: We deliberately keep middleware simple so we don't import Prisma into the edge
 * runtime. Hard auth is enforced at the page/route layer.
 */

const APP_PATHS = ['/today', '/profile', '/health', '/chat'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAppPath = APP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isAppPath) return NextResponse.next();

  if (process.env.PAWLY_DEMO_MODE === 'true') return NextResponse.next();

  // Auth.js v5 session cookie names
  const hasSession =
    req.cookies.get('authjs.session-token') ||
    req.cookies.get('__Secure-authjs.session-token');
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/today/:path*', '/profile/:path*', '/health/:path*', '/chat/:path*'],
};
