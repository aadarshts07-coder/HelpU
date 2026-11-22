import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/jobs',
  '/tracker',
  '/resume',
  '/profile',
  '/settings',
  '/notifications',
];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    const sessionCookie = req.cookies.get('helpu_session')?.value;

    // If no session cookie or explicitly logged out, redirect to /login
    if (!sessionCookie || sessionCookie === 'logged_out' || sessionCookie.trim() === '') {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/jobs/:path*',
    '/tracker/:path*',
    '/resume/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/notifications/:path*',
  ],
};
