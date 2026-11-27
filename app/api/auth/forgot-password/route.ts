import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateVerificationToken } from '@/lib/security';
import { sendPasswordResetEmail } from '@/lib/email';
import { checkRateLimit, recordFailedAttempt } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const body = await req.json();
    const { email = '' } = body;

    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // 1. Rate limiting on forgot password requests
    const rateCheck = checkRateLimit(`forgot:${normalizedEmail}`);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Please wait ${rateCheck.retryAfterSeconds} seconds before requesting another reset link.` },
        { status: 429 }
      );
    }
    recordFailedAttempt(`forgot:${normalizedEmail}`);

    // 2. Database lookup
    const user = await db.getUserByEmail(normalizedEmail);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (user && user.status !== 'SUSPENDED') {
      // 3. Generate 32-byte single-use token with 30-minute expiry
      const { token, tokenHash } = generateVerificationToken(32);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

      await db.createVerificationToken({
        userId: user.id,
        email: normalizedEmail,
        tokenHash,
        type: 'PASSWORD_RESET',
        expiresAt,
        usedAt: null,
      });

      const resetUrl = `${appUrl}/reset-password?token=${token}`;
      await sendPasswordResetEmail({
        to: normalizedEmail,
        name: user.name,
        resetUrl,
      });

      await db.recordAuditLog({
        userId: user.id,
        email: normalizedEmail,
        event: 'PASSWORD_RESET_REQUEST',
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || 'Unknown',
      });
    }

    // Always return generic success response to prevent email enumeration attacks
    return NextResponse.json({
      success: true,
      message: 'If an account exists for that email address, password reset instructions have been sent.',
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Failed to process password reset request.' }, { status: 500 });
  }
}
