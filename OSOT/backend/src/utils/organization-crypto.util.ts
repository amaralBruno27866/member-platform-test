/**
 * Organization Crypto Utility
 *
 * Encrypts and decrypts organization GUIDs for secure JWT transmission.
 * Uses AES-256-CBC encryption to prevent exposing internal organization IDs.
 *
 * SECURITY CONSIDERATIONS:
 * - Organization GUID is sensitive (internal identifier)
 * - JWT is visible to client (base64 decoded easily)
 * - Encryption prevents GUID tampering and exposure
 * - Uses environment variable for encryption key
 *
 * USAGE:
 * ```typescript
 * // Encrypt for JWT
 * const encrypted = encryptOrganizationId('org-guid-123');
 * // JWT payload: { organizationId: encrypted }
 *
 * // Decrypt in backend
 * const orgGuid = decryptOrganizationId(encrypted);
 * // Use orgGuid for Dataverse queries
 * ```
 *
 * @module organization-crypto.util
 * @since 2026-01-12
 */

import * as crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

/**
 * Get encryption key from environment variable
 * Must be 32 characters (256 bits) for AES-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ORG_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'ORG_ENCRYPTION_KEY is not defined in environment variables',
    );
  }

  if (key.length !== 32) {
    throw new Error(
      'ORG_ENCRYPTION_KEY must be exactly 32 characters (256 bits)',
    );
  }

  return Buffer.from(key, 'utf8');
}

/**
 * Encrypt organization GUID for JWT storage
 *
 * @param orgGuid - Organization GUID to encrypt (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
 * @returns Encrypted string in format: "iv:encryptedData" (hex encoded)
 *
 * @example
 * ```typescript
 * const encrypted = encryptOrganizationId('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
 * // Returns: "3f2a1b9c...8d7e6f:9c8b7a6f...3e2d1c0b"
 * ```
 */
export function encryptOrganizationId(orgGuid: string): string {
  try {
    // Validate input
    if (!orgGuid || typeof orgGuid !== 'string') {
      throw new Error('Organization GUID must be a non-empty string');
    }

    // Generate random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);

    // Encrypt
    let encrypted = cipher.update(orgGuid, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return format: "iv:encryptedData"
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(
      `Failed to encrypt organization ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Decrypt organization GUID from JWT
 *
 * @param encrypted - Encrypted string from JWT (format: "iv:encryptedData")
 * @returns Original organization GUID
 *
 * @example
 * ```typescript
 * const encrypted = "3f2a1b9c...8d7e6f:9c8b7a6f...3e2d1c0b";
 * const orgGuid = decryptOrganizationId(encrypted);
 * // Returns: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 * ```
 */
export function decryptOrganizationId(encrypted: string): string {
  try {
    // Validate input
    if (!encrypted || typeof encrypted !== 'string') {
      throw new Error('Encrypted data must be a non-empty string');
    }

    // Parse IV and encrypted data
    const parts = encrypted.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format (expected "iv:data")');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];

    // Validate IV length
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length (expected ${IV_LENGTH} bytes)`);
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);

    // Decrypt
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(
      `Failed to decrypt organization ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Validate if a string is a valid encrypted organization ID
 *
 * @param encrypted - String to validate
 * @returns True if format is valid (doesn't decrypt, just checks format)
 *
 * @example
 * ```typescript
 * isValidEncryptedFormat("abc:def"); // true
 * isValidEncryptedFormat("invalid"); // false
 * ```
 */
export function isValidEncryptedFormat(encrypted: string): boolean {
  if (!encrypted || typeof encrypted !== 'string') {
    return false;
  }

  const parts = encrypted.split(':');
  if (parts.length !== 2) {
    return false;
  }

  // Check if parts are valid hex strings
  const hexPattern = /^[0-9a-f]+$/i;
  return hexPattern.test(parts[0]) && hexPattern.test(parts[1]);
}

/**
 * Generate a random 32-character encryption key
 * Use this once to generate ORG_ENCRYPTION_KEY for .env
 *
 * @returns Random 32-character string suitable for AES-256
 *
 * @example
 * ```typescript
 * const key = generateEncryptionKey();
 * console.log(`ORG_ENCRYPTION_KEY=${key}`);
 * // Copy to .env file
 * ```
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex').substring(0, 32);
}
