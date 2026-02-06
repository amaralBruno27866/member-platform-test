/**
 * Email Masking Utility
 *
 * Provides secure email masking for user feedback when duplicates are detected.
 *
 * Examples:
 * - john.doe@gmail.com → joh*****@gmail.com
 * - a@b.co → a@b.co (too short, returns as-is)
 * - test.user+tag@yahoo.com → tes********@yahoo.com
 */

/**
 * Masks an email address for privacy while keeping it recognizable
 *
 * @param email - Full email address to mask
 * @returns Masked email (e.g., "joh*****@gmail.com")
 *
 * Rules:
 * - Local part: Show first 3 chars, mask the rest
 * - Domain: Show FULL DOMAIN (gmail.com, yahoo.com, etc.) for user recognition
 * - If too short, return as-is to avoid confusion
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email;
  }

  const [localPart, domainPart] = email.split('@');

  // Mask local part (username)
  let maskedLocal: string;
  if (localPart.length <= 3) {
    maskedLocal = localPart; // Too short to mask meaningfully
  } else {
    const visibleChars = Math.min(3, Math.floor(localPart.length / 2));
    const maskLength = localPart.length - visibleChars;
    maskedLocal = localPart.substring(0, visibleChars) + '*'.repeat(maskLength);
  }

  // Keep domain FULLY VISIBLE for user recognition
  // Examples: gmail.com, yahoo.com, outlook.com, company.com
  return `${maskedLocal}@${domainPart}`;
}

/**
 * Creates a user-friendly message for duplicate account scenarios
 *
 * @param email - User's email address
 * @param duplicateType - Type of duplicate detected ('email' | 'person')
 * @returns Object with masked email and user-facing message
 */
export function createDuplicateAccountMessage(
  email: string,
  duplicateType: 'email' | 'person',
): {
  maskedEmail: string;
  message: string;
  suggestion: string;
} {
  const maskedEmail = maskEmail(email);

  const messages = {
    email: {
      message: 'An account with this email address already exists.',
      suggestion: `If this is your account (${maskedEmail}), please try logging in. If you forgot your password, use the password recovery option. If you believe this is an error, please contact support.`,
    },
    person: {
      message:
        'An account with the same name and date of birth already exists.',
      suggestion: `If this is your account (${maskedEmail}), please try logging in. If you forgot your password, use the password recovery option. If you believe this is an error or need assistance, please contact support.`,
    },
  };

  return {
    maskedEmail,
    message: messages[duplicateType].message,
    suggestion: messages[duplicateType].suggestion,
  };
}
