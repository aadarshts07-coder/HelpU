import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/security';
import { 
  checkRateLimit, 
  recordFailedAttempt, 
  resetRateLimit, 
  sanitizeRedirectUrl, 
  createSessionCookie,
  SESSION_COOKIE_NAME 
} from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const body = await req.json();
    const { email = '', password = '', rememberMe = false, redirect = '/dashboard' } = body;

    const trimmedEmail = (email || '').trim().toLowerCase();
    const rateLimitKey = `${ip}:${trimmedEmail}`;

    // 1. IP & Email Rate Limit / Brute Force Check
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { 
          error: `Too many unsuccessful login attempts. For security, please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
          locked: true,
          retryAfter: rateCheck.retryAfterSeconds 
        }, 
        { status: 429 }
      );
    }

    // 2. Input validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!password || password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters.' }, { status: 400 });
    }

    // 3. Database User Lookup
    const user = await db.getUserByEmail(trimmedEmail);

    if (user) {
      // Check user-level lockout
      if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
        const retrySeconds = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 1000);
        return NextResponse.json(
          { error: `Account temporarily locked due to repeated failed attempts. Please retry in ${retrySeconds} seconds.`, locked: true },
          { status: 429 }
        );
      }

      // Verify Password Hash
      const passwordMatches = await verifyPassword(password, user.passwordHash);

      if (!passwordMatches) {
        // Increment user and IP failed attempts
        const newFailed = (user.failedLoginAttempts || 0) + 1;
        const willLock = newFailed >= 5;
        const lockedUntil = willLock ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : null;

        await db.updateUser(user.id, {
          failedLoginAttempts: newFailed,
          lockedUntil,
        });

        recordFailedAttempt(rateLimitKey);

        await db.recordAuditLog({
          userId: user.id,
          email: trimmedEmail,
          event: willLock ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILURE',
          ipAddress: ip,
          userAgent: req.headers.get('user-agent') || 'Unknown',
        });

        if (willLock) {
          return NextResponse.json(
            { error: 'Too many failed login attempts. Your account is temporarily locked for 5 minutes for security.', locked: true },
            { status: 429 }
          );
        }

        return NextResponse.json(
          { error: 'Email or password is incorrect. Please double-check your credentials.' },
          { status: 401 }
        );
      }

      // Check Verification Status: Block unverified accounts!
      if (user.status === 'UNVERIFIED' || !user.emailVerified) {
        return NextResponse.json(
          {
            error: 'EMAIL_NOT_VERIFIED',
            message: 'Your email address is not verified yet. Please verify your email before signing in.',
            email: user.email,
          },
          { status: 403 }
        );
      }

      if (user.status === 'SUSPENDED') {
        return NextResponse.json(
          { error: 'Your account has been suspended. Please contact support.' },
          { status: 403 }
        );
      }

      // Check 2FA
      if (user.twoFactorEnabled) {
        return NextResponse.json({
          requires2FA: true,
          userId: user.id,
          email: user.email,
        });
      }

      // Password matches and user is verified! Reset failed attempts
      await db.updateUser(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date().toISOString(),
      });
      resetRateLimit(rateLimitKey);

      // Session Rotation: Generate unique session token
      const isHttps = req.headers.get('x-forwarded-proto') === 'https' || req.url.startsWith('https:');
      const safeRedirect = sanitizeRedirectUrl(redirect);
      const cookieHeader = createSessionCookie(user.id, Boolean(rememberMe), isHttps);

      await db.recordAuditLog({
        userId: user.id,
        email: user.email,
        event: 'LOGIN_SUCCESS',
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || 'Unknown',
      });

      const response = NextResponse.json({
        success: true,
        redirect: safeRedirect,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
        },
      });

      response.headers.set('Set-Cookie', cookieHeader);
      return response;
    }

    // 4. Fallback for demo credentials (if running before DB initialization)
    const demoEmail = (process.env.NEXT_PUBLIC_DEMO_EMAIL || 'alex.morgan@example.com').toLowerCase();
    const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'CareerBoost2026!';

    if (trimmedEmail === demoEmail && password === demoPassword) {
      resetRateLimit(rateLimitKey);
      const isHttps = req.headers.get('x-forwarded-proto') === 'https' || req.url.startsWith('https:');
      const safeRedirect = sanitizeRedirectUrl(redirect);
      const cookieHeader = createSessionCookie('usr_demo_101', Boolean(rememberMe), isHttps);

      const response = NextResponse.json({
        success: true,
        redirect: safeRedirect,
        user: {
          id: 'usr_demo_101',
          email: demoEmail,
          name: 'Alex Morgan',
          emailVerified: new Date().toISOString(),
        },
      });
      response.headers.set('Set-Cookie', cookieHeader);
      return response;
    }

    // 5. Unknown account failed login
    recordFailedAttempt(rateLimitKey);
    await db.recordAuditLog({
      email: trimmedEmail,
      event: 'LOGIN_FAILURE',
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || 'Unknown',
    });

    return NextResponse.json(
      { error: 'Email or password is incorrect. Please double-check your credentials.' },
      { status: 401 }
    );
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred during login. Please try again.' }, { status: 500 });
  }
}
