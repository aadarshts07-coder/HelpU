import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  isDisposableEmail, 
  validatePasswordStrength, 
  hashPassword, 
  generateVerificationToken, 
  generateOTP 
} from '@/lib/security';
import { sendVerificationEmail } from '@/lib/email';
import { checkRateLimit, recordFailedAttempt } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const body = await req.json();
    const { name = '', email = '', password = '' } = body;

    // 1. Rate Limiting on Sign-ups
    const rateCheck = checkRateLimit(`signup:${ip}`);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many sign-up attempts from this network. Please wait ${rateCheck.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    // 2. Normalize and Validate Email
    const normalizedEmail = (email || '').toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    // 3. Reject Disposable / Temporary Email Domains
    if (isDisposableEmail(normalizedEmail)) {
      recordFailedAttempt(`signup:${ip}`);
      return NextResponse.json(
        { error: 'Temporary and disposable email addresses are not permitted. Please use a permanent email address.' },
        { status: 400 }
      );
    }

    // 4. Validate Name
    const cleanName = (name || '').trim();
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }

    // 5. Enforce Password Strength Policy (12+ chars, uppercase, lowercase, number, symbol)
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.errors[0] || 'Password does not meet security requirements.' },
        { status: 400 }
      );
    }

    // 6. Check Existing User
    const existingUser = await db.getUserByEmail(normalizedEmail);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (existingUser) {
      if (existingUser.status === 'ACTIVE' && existingUser.emailVerified) {
        // Return friendly message without leaking full details
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please sign in instead.' },
          { status: 409 }
        );
      }

      // User exists but is UNVERIFIED -> regenerate verification token & resend
      const { token, tokenHash } = generateVerificationToken();
      const { code, otpHash } = generateOTP();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await db.createVerificationToken({
        userId: existingUser.id,
        email: normalizedEmail,
        tokenHash,
        otpHash,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
        usedAt: null,
      });

      const verificationUrl = `${appUrl}/api/auth/verify?token=${token}`;
      await sendVerificationEmail({
        to: normalizedEmail,
        name: existingUser.name,
        verificationUrl,
        otpCode: code,
      });

      await db.recordAuditLog({
        userId: existingUser.id,
        email: normalizedEmail,
        event: 'TOKEN_RESENT',
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || 'Unknown',
        metadata: { reason: 'Signup attempted for unverified user' },
      });

      return NextResponse.json({
        success: true,
        email: normalizedEmail,
        message: 'Your account is pending verification. A fresh verification link and code have been sent to your email.',
        unverified: true,
      });
    }

    // 7. Hash Password using memory-hard scrypt
    const passwordHash = await hashPassword(password);

    // 8. Create User in UNVERIFIED status
    const newUser = await db.createUser({
      email: normalizedEmail,
      name: cleanName,
      status: 'UNVERIFIED',
      emailVerified: null,
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      twoFactorEnabled: false,
    });

    // 9. Generate 32-byte crypto verification token + 6-digit OTP
    const { token, tokenHash } = generateVerificationToken(32);
    const { code, otpHash } = generateOTP(6);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.createVerificationToken({
      userId: newUser.id,
      email: normalizedEmail,
      tokenHash,
      otpHash,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
      usedAt: null,
    });

    // 10. Send Branded Verification Email
    const verificationUrl = `${appUrl}/api/auth/verify?token=${token}`;
    await sendVerificationEmail({
      to: normalizedEmail,
      name: cleanName,
      verificationUrl,
      otpCode: code,
    });

    // 11. Security Audit Log
    await db.recordAuditLog({
      userId: newUser.id,
      email: normalizedEmail,
      event: 'SIGNUP',
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || 'Unknown',
    });

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      message: 'Account created! Please check your email to verify your address.',
      unverified: true,
    });
  } catch (err: any) {
    console.error('Sign-up error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during account creation. Please try again.' },
      { status: 500 }
    );
  }
}
