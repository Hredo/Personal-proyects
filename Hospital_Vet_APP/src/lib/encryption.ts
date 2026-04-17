import crypto from 'crypto';

/**
 * RGPD-compliant encryption utilities
 * Encrypts sensitive personal data at rest using AES-256-GCM
 */

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');

interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypts sensitive string data
 */
export function encryptSensitiveData(data: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    const result: EncryptedData = {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
    
    return Buffer.from(JSON.stringify(result)).toString('base64');
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('RGPD encryption failed');
  }
}

/**
 * Decrypts sensitive string data
 */
export function decryptSensitiveData(encryptedBase64: string): string {
  try {
    const result: EncryptedData = JSON.parse(
      Buffer.from(encryptedBase64, 'base64').toString('utf8')
    );
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(result.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(result.authTag, 'hex'));
    
    let decrypted = decipher.update(result.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('RGPD decryption failed');
  }
}

/**
 * Hash sensitive data for storage (one-way, for comparison)
 */
export function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data + process.env.HASH_SALT || '').digest('hex');
}

/**
 * Generate secure random token for GDPR operations
 */
export function generateGDPRToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
