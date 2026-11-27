import { NextResponse } from 'next/server';
import { sanitizeRedirectUrl, createSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { redirect = '/dashboard' } = body;

    const isHttps = req.headers.get('x-forwarded-proto') === 'https' || req.url.startsWith('https:');
    const safeRedirect = sanitizeRedirectUrl(redirect);
    const cookieHeader = createSessionCookie('usr_demo_101', true, isHttps);

    const response = NextResponse.json({
      success: true,
      redirect: safeRedirect,
      user: {
        id: 'usr_demo_101',
        name: 'Alex Morgan',
        email: 'alex.morgan@example.com',
        authProvider: 'google',
      },
    });

    response.headers.set('Set-Cookie', cookieHeader);
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: 'Google sign-in could not be completed' }, { status: 500 });
  }
}
