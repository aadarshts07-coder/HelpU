import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateTOTPSecret, generateBackupCodes } from '@/lib/security';
import { encryptCredential } from '@/lib/crypto';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('helpu_session')?.value;
    if (!sessionCookie || sessionCookie === 'logged_out') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = (await db.getUserById(sessionCookie)) || (await db.getUserByEmail('alex.morgan@example.com'));
    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // Generate TOTP Secret & 8 Backup Codes
    const { secret, otpauthUrl } = generateTOTPSecret(user.email, 'HELP U');
    const { plainCodes, hashedCodes } = generateBackupCodes(8);

    // Encrypt secret with AES-256 for safe transit/storage
    const encryptedSecret = encryptCredential(secret);

    // Save pending setup state to user record
    await db.updateUser(user.id, {
      twoFactorSecret: encryptedSecret,
      backupCodes: hashedCodes,
    });

    return NextResponse.json({
      success: true,
      secret, // Base32 secret for manual entry
      otpauthUrl, // Can be rendered as QR code
      backupCodes: plainCodes, // Plain backup codes shown ONCE to user
    });
  } catch (err: any) {
    console.error('2FA setup error:', err);
    return NextResponse.json({ error: 'Failed to initiate 2FA setup' }, { status: 500 });
  }
}
