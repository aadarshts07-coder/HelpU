import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.CREDENTIAL_ENCRYPTION_KEY;
  const salt = process.env.CREDENTIAL_SALT;
  if (!secret || !salt) {
    throw new Error('[Security] CREDENTIAL_ENCRYPTION_KEY and CREDENTIAL_SALT must be configured in environment variables (.env.local)');
  }
  return crypto.scryptSync(secret, salt, 32);
}

/**
 * Encrypt sensitive portal credentials using AES-256-GCM
 */
export function encryptCredential(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  
  // Format: iv:tag:encrypted
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive credentials
 */
export function decryptCredential(cipherText: string): string {
  if (!cipherText || !cipherText.includes(':')) return '';
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return '';
    
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return '';
  }
}
