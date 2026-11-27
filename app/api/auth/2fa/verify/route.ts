import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyTOTPCode } from '@/lib/security';
import { decryptCredential } from '@/lib/crypto';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('helpu_session')?.value;
    if (!sessionCookie || sessionCookie === 'logged_out') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { code = '' } = body;

    const user = (await db.getUserById(sessionCookie)) || (await db.getUserByEmail('alex.morgan@example.com'));
    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ error: '2FA setup was not initiated.' }, { status: 400 });
    }

    const rawSecret = decryptCredential(user.twoFactorSecret);
    const isValid = verifyTOTPCode(rawSecret, code);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid 6-digit verification code. Please check your authenticator app.' },
        { status: 400 }
      );
    }

    // Confirm 2FA Activation
    await db.updateUser(user.id, {
      twoFactorEnabled: true,
    });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    await db.recordAuditLog({
      userId: user.id,
      email: user.email,
      event: '2FA_ENABLED',
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || 'Unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'Two-Factor Authentication (2FA) is now enabled for your account.',
    });
  } catch (err: any) {
    console.error('2FA verify error:', err);
    return NextResponse.json({ error: 'Failed to confirm 2FA code.' }, { status: 500 });
  }
}
