import { NextResponse } from 'next/server';

interface RateLimitRecord {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

// In-memory sliding rate limiter (5 failed attempts per 5 minutes = 5 min lockout)
const rateLimitMap = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const WINDOW_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Check if an IP or email is currently locked out from logging in
 */
export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record) {
    return { allowed: true };
  }

  // Check if locked
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  // Reset if window has expired
  if (now - record.lastAttempt > WINDOW_DURATION_MS) {
    rateLimitMap.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt; lock out if threshold reached
 */
export function recordFailedAttempt(key: string): { locked: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { attempts: 0, lockedUntil: null, lastAttempt: now };

  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    rateLimitMap.set(key, record);
    return { locked: true, retryAfterSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
  }

  rateLimitMap.set(key, record);
  return { locked: false };
}

/**
 * Reset failed attempts upon successful login
 */
export function resetRateLimit(key: string) {
  rateLimitMap.delete(key);
}

// 60-Second Cooldown Tracker
const cooldownMap = new Map<string, number>();

export function checkCooldown(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const expiresAt = cooldownMap.get(key);
  if (expiresAt && expiresAt > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((expiresAt - now) / 1000) };
  }
  return { allowed: true };
}

export function setCooldown(key: string, seconds = 60): void {
  cooldownMap.set(key, Date.now() + seconds * 1000);
}

/**
 * Strict redirect sanitizer to prevent open-redirect vulnerabilities.
 * Only allows relative paths on the same origin (starts with '/' and not '//' or 'javascript:').
 */
export function sanitizeRedirectUrl(url: string | null | undefined, defaultFallback = '/dashboard'): string {
  if (!url || typeof url !== 'string') return defaultFallback;

  const trimmed = url.trim();

  // Disallow absolute protocol URLs (http:, https:, javascript:, data:, etc.)
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {
    return defaultFallback;
  }

  // Disallow protocol-relative URLs (e.g. //attacker.com)
  if (trimmed.startsWith('//') || trimmed.startsWith('\\\\')) {
    return defaultFallback;
  }

  // Must begin with a single slash
  if (!trimmed.startsWith('/')) {
    return defaultFallback;
  }

  // Extra safety: disallow newline characters
  if (/[\r\n]/.test(trimmed)) {
    return defaultFallback;
  }

  return trimmed;
}

/**
 * Standard session cookie name
 */
export const SESSION_COOKIE_NAME = 'helpu_session';

/**
 * Generate secure cookie header string
 */
export function createSessionCookie(token: string, rememberMe: boolean, isHttps: boolean): string {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days
  const secure = isHttps ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}
