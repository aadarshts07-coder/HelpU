import crypto from 'crypto';

/**
 * Common disposable / temporary email domain blocklist
 */
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  '10minutemail.com',
  'throwawaymail.com',
  'yopmail.com',
  'sharklasers.com',
  'trashmail.com',
  'dispostable.com',
  'getairmail.com',
  'fakeinbox.com',
  'maildrop.cc',
  'inboxkitten.com',
  'mohmal.com',
  'nada.ltd',
  'temp-mail.org',
  'crazymailing.com',
  'mytemp.email',
  'generator.email',
]);

/**
 * Check if an email uses a disposable / temporary email provider
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase().trim();
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/**
 * Password Policy Enforcement:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special symbol
 * - No common easily-guessed words
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password || password.length < 12) {
    errors.push('Password must be at least 12 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z).');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z).');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number (0-9).');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*).');
  }

  // Common breached passwords
  const lower = password.toLowerCase();
  const commonPatterns = ['password', '12345678', 'qwertyuiop', 'admin12345', 'careerboost'];
  for (const pattern of commonPatterns) {
    if (lower.includes(pattern) && password.length < 16) {
      errors.push('Password contains a common, easily-guessed pattern.');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Hash a password using Node.js crypto.scrypt with a random 16-byte salt
 * Format: scrypt$16384$8$1$<saltHex>$<derivedKeyHex>
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const cost = 16384; // N
    const blockSize = 8; // r
    const parallelization = 1; // p
    const keyLength = 64;

    crypto.scrypt(
      password,
      salt,
      keyLength,
      { N: cost, r: blockSize, p: parallelization },
      (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`scrypt$${cost}$${blockSize}$${parallelization}$${salt}$${derivedKey.toString('hex')}`);
      }
    );
  });
}

/**
 * Verify a password against a stored scrypt hash using timingSafeEqual
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!storedHash || !storedHash.startsWith('scrypt$')) {
      return resolve(false);
    }

    const parts = storedHash.split('$');
    if (parts.length !== 6) return resolve(false);

    const cost = parseInt(parts[1], 10);
    const blockSize = parseInt(parts[2], 10);
    const parallelization = parseInt(parts[3], 10);
    const salt = parts[4];
    const originalKeyHex = parts[5];
    const keyLength = Buffer.from(originalKeyHex, 'hex').length;

    crypto.scrypt(
      password,
      salt,
      keyLength,
      { N: cost, r: blockSize, p: parallelization },
      (err, derivedKey) => {
        if (err) return resolve(false);
        const originalKey = Buffer.from(originalKeyHex, 'hex');
        if (derivedKey.length !== originalKey.length) return resolve(false);

        // Constant-time comparison prevents timing attacks
        const match = crypto.timingSafeEqual(derivedKey, originalKey);
        resolve(match);
      }
    );
  });
}

/**
 * Generate a cryptographically random single-use verification token (32 bytes).
 * Returns the raw token (sent to user) and SHA-256 hash (stored in DB).
 */
export function generateVerificationToken(bytes = 32): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(bytes).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

/**
 * Hash any input string using SHA-256
 */
export function sha256Hash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generate a 6-digit numeric OTP with its SHA-256 hash
 */
export function generateOTP(length = 6): { code: string; otpHash: string } {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const code = crypto.randomInt(min, max + 1).toString();
  const otpHash = sha256Hash(code);
  return { code, otpHash };
}

// --- RFC 6238 TOTP Two-Factor Authentication Engine ---

const B32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += B32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += B32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = B32_CHARS.indexOf(cleaned[i]);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generate standard RFC 6238 TOTP code for a secret and time step
 */
function computeTOTPCode(secretBuffer: Buffer, counter: number): string {
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', secretBuffer).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Generate new TOTP setup credentials (secret key + otpauth QR URI)
 */
export function generateTOTPSecret(accountName: string, issuer = 'HELP U'): { secret: string; otpauthUrl: string } {
  const randomBytes = crypto.randomBytes(20);
  const secret = base32Encode(randomBytes);
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  const otpauthUrl = `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
  return { secret, otpauthUrl };
}

/**
 * Verify a 6-digit TOTP code against the secret (tolerates 1 step clock drift, +/- 30s)
 */
export function verifyTOTPCode(secret: string, userCode: string): boolean {
  if (!secret || !userCode || userCode.trim().length !== 6) return false;

  try {
    const secretBuffer = base32Decode(secret);
    const currentStep = Math.floor(Date.now() / 1000 / 30);
    const cleanCode = userCode.trim();

    // Check t-1, t, t+1
    for (const drift of [0, -1, 1]) {
      const generated = computeTOTPCode(secretBuffer, currentStep + drift);
      if (crypto.timingSafeEqual(Buffer.from(cleanCode), Buffer.from(generated))) {
        return true;
      }
    }
    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Generate 8 backup recovery codes with their SHA-256 hashes
 */
export function generateBackupCodes(count = 8): { plainCodes: string[]; hashedCodes: string[] } {
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = `${crypto.randomBytes(4).toString('hex')}-${crypto.randomBytes(4).toString('hex')}`;
    plainCodes.push(code);
    hashedCodes.push(sha256Hash(code));
  }

  return { plainCodes, hashedCodes };
}

