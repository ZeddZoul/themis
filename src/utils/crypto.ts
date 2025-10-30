import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is not set. The application cannot start without it.');
}

if (Buffer.from(ENCRYPTION_KEY, 'hex').length !== 32) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte hex-encoded string.');
}

const key = Buffer.from(ENCRYPTION_KEY, 'hex');

/**
 * Encrypts a given text string.
 * @param {string} text The text to encrypt.
 * @returns {string} The encrypted text, formatted as iv:encryptedData.
 */
export const encrypt = (text: string): string => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

/**
 * Decrypts a given string.
 * @param {string} text The text to decrypt, formatted as iv:encryptedData.
 * @returns {string} The decrypted text.
 */
export const decrypt = (text: string): string => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
