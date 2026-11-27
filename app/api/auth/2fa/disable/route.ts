import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/security';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('helpu_session')?.value;
    if (!sessionCookie || sessionCookie === 'logged_out') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { password = '' } = body;

    const user = (await db.getUserById(sessionCookie)) || (await db.getUserByEmail('alex.morgan@example.com'));
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Require password confirmation to disable 2FA
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Incorrect password. 2FA cannot be disabled.' }, { status: 401 });
    }

    await db.updateUser(user.id, {
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      backupCodes: [],
    });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    await db.recordAuditLog({
      userId: user.id,
      email: user.email,
      event: '2FA_DISABLED',
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || 'Unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'Two-Factor Authentication has been disabled.',
    });
  } catch (err: any) {
    console.error('2FA disable error:', err);
    return NextResponse.json({ error: 'Failed to disable 2FA.' }, { status: 500 });
  }
}
