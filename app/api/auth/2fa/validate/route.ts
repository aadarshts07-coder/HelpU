import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyTOTPCode, sha256Hash } from '@/lib/security';
import { decryptCredential } from '@/lib/crypto';
import { createSessionCookie, sanitizeRedirectUrl } from '@/lib/auth';

/**
 * POST /api/auth/2fa/validate
 * Validates TOTP code or single-use backup code during 2FA login challenge
 */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const body = await req.json();
    const { userId = '', code = '', rememberMe = true, redirect = '/dashboard' } = body;

    if (!userId || !code) {
      return NextResponse.json({ error: 'User ID and authentication code are required.' }, { status: 400 });
    }

    const user = await db.getUserById(userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: 'Two-factor authentication is not active on this account.' }, { status: 400 });
    }

    const cleanCode = code.trim();
    let authenticated = false;

    // 1. Try TOTP code verification
    if (cleanCode.length === 6 && /^\d+$/.test(cleanCode)) {
      const rawSecret = decryptCredential(user.twoFactorSecret);
      authenticated = verifyTOTPCode(rawSecret, cleanCode);
    }

    // 2. Try Backup Recovery Code
    if (!authenticated && user.backupCodes && user.backupCodes.length > 0) {
      const codeHash = sha256Hash(cleanCode);
      const backupIndex = user.backupCodes.indexOf(codeHash);
      if (backupIndex !== -1) {
        authenticated = true;
        // Consume backup code (single-use)
        const updatedBackupCodes = [...user.backupCodes];
        updatedBackupCodes.splice(backupIndex, 1);
        await db.updateUser(user.id, { backupCodes: updatedBackupCodes });
      }
    }

    if (!authenticated) {
      await db.recordAuditLog({
        userId: user.id,
        email: user.email,
        event: 'LOGIN_FAILURE',
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || 'Unknown',
        metadata: { reason: 'Invalid 2FA challenge' },
      });
      return NextResponse.json({ error: 'Invalid authenticator code or backup recovery code.' }, { status: 401 });
    }

    // 3. Issue Authenticated Session Cookie
    const isHttps = req.headers.get('x-forwarded-proto') === 'https' || req.url.startsWith('https:');
    const safeRedirect = sanitizeRedirectUrl(redirect);
    const cookieHeader = createSessionCookie(user.id, Boolean(rememberMe), isHttps);

    await db.recordAuditLog({
      userId: user.id,
      email: user.email,
      event: 'LOGIN_SUCCESS',
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || 'Unknown',
      metadata: { method: '2FA' },
    });

    const response = NextResponse.json({
      success: true,
      redirect: safeRedirect,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    response.headers.set('Set-Cookie', cookieHeader);
    return response;
  } catch (err: any) {
    console.error('2FA validation error:', err);
    return NextResponse.json({ error: 'Failed to process 2FA verification.' }, { status: 500 });
  }
}
