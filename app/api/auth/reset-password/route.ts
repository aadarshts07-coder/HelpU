import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sha256Hash, validatePasswordStrength, hashPassword } from '@/lib/security';
import { sendPasswordChangedAlert } from '@/lib/email';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const body = await req.json();
    const { token = '', password = '' } = body;

    if (!token || token.trim() === '') {
      return NextResponse.json({ error: 'Password reset token is missing or invalid.' }, { status: 400 });
    }

    // 1. Enforce 12+ char password security policy
    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      return NextResponse.json({ error: strengthCheck.errors[0] }, { status: 400 });
    }

    // 2. Lookup single-use hashed token
    const tokenHash = sha256Hash(token);
    const tokenRecord = await db.findVerificationToken(tokenHash, 'PASSWORD_RESET');

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'This password reset link is invalid or has expired. Please request a new link.' },
        { status: 400 }
      );
    }

    // 3. Consume token
    await db.consumeToken(tokenRecord.id);

    // 4. Update User Password & Invalidate all prior sessions
    const user = await db.getUserById(tokenRecord.userId);
    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    const newPasswordHash = await hashPassword(password);
    const now = new Date().toISOString();

    await db.updateUser(user.id, {
      passwordHash: newPasswordHash,
      passwordChangedAt: now,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    // Invalidate all pending tokens for this user
    await db.invalidateUserTokens(user.id);

    // 5. Send Security Alert Email
    sendPasswordChangedAlert({
      to: user.email,
      name: user.name,
      ipAddress: ip,
    }).catch(console.error);

    // 6. Security Audit Log
    await db.recordAuditLog({
      userId: user.id,
      email: user.email,
      event: 'PASSWORD_RESET_SUCCESS',
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || 'Unknown',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password reset successful! You can now sign in with your new password.',
    });

    // Invalidate session cookie to require fresh login
    response.headers.set(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
    );

    return response;
  } catch (err: any) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Failed to reset password.' }, { status: 500 });
  }
}
