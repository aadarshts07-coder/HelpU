import { NextResponse } from 'next/server';
import { 
  sanitizeRedirectUrl, 
  createSessionCookie, 
  checkRateLimit, 
  recordFailedAttempt 
} from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email = '', redirect = '/dashboard' } = body;
    const trimmedEmail = (email || '').trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Return friendly generic response (never leaks whether the email is registered)
    return NextResponse.json({
      success: true,
      message: `If an account exists for ${trimmedEmail}, a secure magic sign-in link has been sent to your inbox.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to process magic link request' }, { status: 500 });
  }
}
