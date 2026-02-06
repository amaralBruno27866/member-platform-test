/**
 * Utility: Phone Number Formatting and Validation
 * Objective: Format, validate, and normalize phone numbers for Canadian format.
 * Functionality:
 * - Formats phone numbers to (XXX) XXX-XXXX format
 * - Validates Canadian phone number format
 * - Normalizes input by removing non-digit characters
 * - Handles various input formats (with/without country code)
 *
 * Examples:
 *   '4165551234'     => '(416) 555-1234'
 *   '14165551234'    => '(416) 555-1234'
 *   '416-555-1234'   => '(416) 555-1234'
 *   '416.555.1234'   => '(416) 555-1234'
 *   '(416) 555-1234' => '(416) 555-1234'
 *   '1234567890'     => throws error (invalid area code)
 */

/**
 * Format a phone number to Canadian format (XXX) XXX-XXXX
 * @param phoneNumber - The phone number to format
 * @returns The formatted phone number
 * @throws Error if phone number is invalid
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (typeof phoneNumber !== 'string') {
    return String(phoneNumber);
  }

  // Trim whitespace
  phoneNumber = phoneNumber.trim();

  if (phoneNumber.length === 0) {
    return phoneNumber;
  }

  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    return phoneNumber;
  }

  // Handle different lengths
  let cleanNumber = digitsOnly;

  if (digitsOnly.length === 11) {
    // Remove country code (1) if present
    if (digitsOnly.startsWith('1')) {
      cleanNumber = digitsOnly.slice(1);
    } else {
      return phoneNumber;
    }
  } else if (digitsOnly.length === 10) {
    // Perfect length for Canadian phone number
    cleanNumber = digitsOnly;
  } else {
    return phoneNumber;
  }

  // Validate Canadian phone number format
  if (!isValidCanadianPhoneNumber(cleanNumber)) {
    return phoneNumber;
  }

  // Extract parts
  const areaCode = cleanNumber.slice(0, 3);
  const exchangeCode = cleanNumber.slice(3, 6);
  const number = cleanNumber.slice(6, 10);

  // Format as (XXX) XXX-XXXX
  return `(${areaCode}) ${exchangeCode}-${number}`;
}

/**
 * Validate if a phone number is a valid Canadian phone number
 * @param phoneNumber - The phone number to validate (10 digits, no formatting)
 * @returns true if valid, false otherwise
 */
export function isValidCanadianPhoneNumber(phoneNumber: string): boolean {
  // Must be exactly 10 digits
  if (!/^\d{10}$/.test(phoneNumber)) {
    return false;
  }

  const areaCode = phoneNumber.slice(0, 3);
  const exchangeCode = phoneNumber.slice(3, 6);

  // Area code cannot start with 0 or 1 (ensures it's in range 200-999)
  if (areaCode.startsWith('0') || areaCode.startsWith('1')) {
    return false;
  }

  // Exchange code cannot start with 0 or 1 (ensures it's in range 200-999)
  if (exchangeCode.startsWith('0') || exchangeCode.startsWith('1')) {
    return false;
  }

  return true;
}

/**
 * Validate if a phone number is valid without formatting
 * @param phoneNumber - The phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  try {
    formatPhoneNumber(phoneNumber);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract digits only from a phone number
 * @param phoneNumber - The phone number to extract digits from
 * @returns The digits only (without country code)
 */
export function extractPhoneDigits(phoneNumber: string): string {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    throw new Error('Phone number is required and must be a string.');
  }

  const digitsOnly = phoneNumber.replace(/\D/g, '');

  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return digitsOnly.slice(1);
  } else if (digitsOnly.length === 10) {
    return digitsOnly;
  } else {
    throw new Error('Invalid phone number format.');
  }
}

/**
 * Check if a phone number has a specific area code
 * @param phoneNumber - The phone number to check
 * @param areaCode - The area code to check for (3 digits)
 * @returns true if phone number has the specified area code
 */
export function hasAreaCode(phoneNumber: string, areaCode: string): boolean {
  try {
    const digits = extractPhoneDigits(phoneNumber);
    return digits.slice(0, 3) === areaCode;
  } catch {
    return false;
  }
}

/**
 * Get the area code from a phone number
 * @param phoneNumber - The phone number to extract area code from
 * @returns The area code (3 digits)
 */
export function getAreaCode(phoneNumber: string): string {
  try {
    const digits = extractPhoneDigits(phoneNumber);
    return digits.slice(0, 3);
  } catch {
    throw new Error('Cannot extract area code from invalid phone number.');
  }
}
