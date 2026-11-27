import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateVerificationToken, generateOTP } from '@/lib/security';
import { sendVerificationEmail } from '@/lib/email';
import { checkCooldown, setCooldown } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const body = await req.json();
    const { email = '' } = body;

    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Please enter your email address.' }, { status: 400 });
    }

    // 1. Strict 60-Second Cooldown per email
    const cooldownCheck = checkCooldown(`resend:${normalizedEmail}`);
    if (!cooldownCheck.allowed) {
      return NextResponse.json(
        { error: `Please wait ${cooldownCheck.retryAfterSeconds} seconds before requesting another code.` },
        { status: 429 }
      );
    }

    // 2. Lookup user
    const user = await db.getUserByEmail(normalizedEmail);
    if (!user) {
      // Generic success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account is pending verification, a new code has been sent.',
      });
    }

    if (user.status === 'ACTIVE' && user.emailVerified) {
      return NextResponse.json(
        { error: 'This email address is already verified. You can sign in immediately.' },
        { status: 400 }
      );
    }

    // 3. Set 60s cooldown
    setCooldown(`resend:${normalizedEmail}`, 60);

    // 4. Generate fresh token + OTP
    const { token, tokenHash } = generateVerificationToken(32);
    const { code, otpHash } = generateOTP(6);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.createVerificationToken({
      userId: user.id,
      email: normalizedEmail,
      tokenHash,
      otpHash,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
      usedAt: null,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/api/auth/verify?token=${token}`;

    await sendVerificationEmail({
      to: normalizedEmail,
      name: user.name,
      verificationUrl,
      otpCode: code,
    });

    await db.recordAuditLog({
      userId: user.id,
      email: normalizedEmail,
      event: 'TOKEN_RESENT',
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || 'Unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'A fresh verification link and 6-digit code have been dispatched to your inbox.',
    });
  } catch (err: any) {
    console.error('Resend verification error:', err);
    return NextResponse.json({ error: 'Failed to resend verification email.' }, { status: 500 });
  }
}
