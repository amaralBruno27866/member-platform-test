/**
 * Insurance Report Signing Utility
 *
 * Provides cryptographic functions for signing and validating
 * insurance report payloads sent to insurance providers.
 *
 * Uses HMAC-SHA256 for:
 * - Signing report JSON payloads
 * - Validating authenticity of reports
 * - Preventing tampering/man-in-the-middle attacks
 *
 * @file insurance-report-signing.util.ts
 * @module InsuranceModule
 * @layer Utils
 */

import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate cryptographic HMAC-SHA256 signature for data
 *
 * @param data - JSON object or string to sign
 * @param secret - HMAC secret key (should be 32+ characters)
 * @returns Hex-encoded signature string
 *
 * @example
 * const data = { reportId: '123', total: 1000 };
 * const signature = generateSignature(data, process.env.INSURANCE_REPORT_HMAC_SECRET);
 */
export function generateSignature(
  data: Record<string, any> | string,
  secret: string,
): string {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(dataString);

  return hmac.digest('hex');
}

/**
 * Validate HMAC-SHA256 signature of data
 *
 * @param data - Original JSON object or string that was signed
 * @param signature - Signature to validate (hex string)
 * @param secret - HMAC secret key used for signing
 * @returns true if signature is valid, false otherwise
 *
 * @example
 * const isValid = validateSignature(data, signature, secret);
 * if (!isValid) throw new Error('Invalid signature - data may be tampered');
 */
export function validateSignature(
  data: Record<string, any> | string,
  signature: string,
  secret: string,
): boolean {
  try {
    const expectedSignature = generateSignature(data, secret);

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  } catch (_error) {
    // Signature format invalid or comparison failed
    return false;
  }
}

/**
 * Generate unique report token (GUID format)
 * Used for approve/reject links that are one-time use
 *
 * @returns UUID v4 string
 *
 * @example
 * const token = generateReportToken();
 * // 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
 */
export function generateReportToken(): string {
  return uuidv4();
}

/**
 * Hash a token for storage in database
 * Prevents storing tokens in plaintext (security best practice)
 *
 * @param token - Token to hash
 * @returns SHA256 hash of token (hex string)
 *
 * @example
 * const tokenHash = hashToken(approvalToken);
 * // Store tokenHash in database, not the original token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate HMAC-based signature for complete insurance report payload
 * Includes all relevant data to prevent partial tampering
 *
 * @param reportData - Report object to sign
 * @param secret - HMAC secret
 * @returns Signed payload with signature and metadata
 *
 * @example
 * const signed = signReportPayload(reportData, process.env.INSURANCE_REPORT_HMAC_SECRET);
 * // Returns: { ...reportData, signature: '...', signedAt: '2026-01-30T...' }
 */
export function signReportPayload<T extends Record<string, any>>(
  reportData: T,
  secret: string,
): T & { signature: string; signedAt: string } {
  // Create object without signature field for signing
  const { signature: _oldSig, signedAt: _oldTime, ...dataToSign } = reportData;

  const timestamp = new Date().toISOString();
  const signature = generateSignature(dataToSign, secret);

  return {
    ...reportData,
    signature,
    signedAt: timestamp,
  } as T & { signature: string; signedAt: string };
}

/**
 * Validate complete insurance report payload
 *
 * @param payload - Report payload with signature
 * @param secret - HMAC secret used for signing
 * @returns true if signature matches, false otherwise
 *
 * @example
 * const isValid = validateReportPayload(payload, secret);
 * if (!isValid) throw new Error('Report signature invalid');
 */
export function validateReportPayload(
  payload: Record<string, any>,
  secret: string,
): boolean {
  try {
    const { signature, signedAt: _time, ...dataToValidate } = payload;

    if (typeof signature !== 'string' || signature.length === 0) {
      return false;
    }

    return validateSignature(dataToValidate, signature, secret);
  } catch (_error) {
    return false;
  }
}
