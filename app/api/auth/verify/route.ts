import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sha256Hash } from '@/lib/security';
import { sendWelcomeEmail } from '@/lib/email';
import { createSessionCookie } from '@/lib/auth';

/**
 * GET /api/auth/verify?token=...
 * Single-use 32-byte cryptographic token verification link
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const isHttps = req.headers.get('x-forwarded-proto') === 'https' || req.url.startsWith('https:');

    if (!token || token.trim() === '') {
      return NextResponse.redirect(`${appUrl}/verify-email?error=missing_token`);
    }

    const tokenHash = sha256Hash(token);
    const verificationRecord = await db.findVerificationToken(tokenHash, 'EMAIL_VERIFICATION');

    if (!verificationRecord) {
      return NextResponse.redirect(`${appUrl}/verify-email?error=invalid_or_expired`);
    }

    // 1. Consume token immediately (single use)
    await db.consumeToken(verificationRecord.id);

    // 2. Activate User Account
    const user = await db.getUserById(verificationRecord.userId);
    if (!user) {
      return NextResponse.redirect(`${appUrl}/verify-email?error=user_not_found`);
    }

    const now = new Date().toISOString();
    await db.updateUser(user.id, {
      status: 'ACTIVE',
      emailVerified: now,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    // 3. Security Audit Log
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    await db.recordAuditLog({
      userId: user.id,
      email: user.email,
      event: 'EMAIL_VERIFIED',
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || 'Unknown',
      metadata: { method: 'link' },
    });

    // 4. Send Welcome Email
    sendWelcomeEmail({ to: user.email, name: user.name }).catch(console.error);

    // 5. Issue Authenticated Session Cookie and redirect to onboarding / profile
    const cookieHeader = createSessionCookie(user.id, true, isHttps);
    const response = NextResponse.redirect(`${appUrl}/verify-email?status=verified`);
    response.headers.set('Set-Cookie', cookieHeader);
    return response;
  } catch (err: any) {
    console.error('Email verification link error:', err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${appUrl}/verify-email?error=server_error`);
  }
}

/**
 * POST /api/auth/verify
 * 6-digit OTP code verification
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email = '', code = '' } = body;
    const isHttps = req.headers.get('x-forwarded-proto') === 'https' || req.url.startsWith('https:');

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanCode = (code || '').trim();

    if (!cleanEmail || !cleanCode || cleanCode.length < 6) {
      return NextResponse.json({ error: 'Please enter the complete 6-digit verification code.' }, { status: 400 });
    }

    const otpHash = sha256Hash(cleanCode);
    const tokenRecord = await db.findOtpToken(cleanEmail, otpHash, 'EMAIL_VERIFICATION');

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code. Please check your inbox or request a new code.' },
        { status: 400 }
      );
    }

    // 1. Consume token
    await db.consumeToken(tokenRecord.id);

    // 2. Activate User Account
    const user = await db.getUserById(tokenRecord.userId);
    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    const now = new Date().toISOString();
    await db.updateUser(user.id, {
      status: 'ACTIVE',
      emailVerified: now,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    // 3. Audit Log
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    await db.recordAuditLog({
      userId: user.id,
      email: user.email,
      event: 'EMAIL_VERIFIED',
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || 'Unknown',
      metadata: { method: 'otp' },
    });

    // 4. Send Welcome Email
    sendWelcomeEmail({ to: user.email, name: user.name }).catch(console.error);

    // 5. Issue Session Cookie
    const cookieHeader = createSessionCookie(user.id, true, isHttps);
    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully! Opening your dashboard...',
      redirect: '/dashboard',
    });
    response.headers.set('Set-Cookie', cookieHeader);
    return response;
  } catch (err: any) {
    console.error('OTP verification error:', err);
    return NextResponse.json({ error: 'Failed to verify confirmation code.' }, { status: 500 });
  }
}
