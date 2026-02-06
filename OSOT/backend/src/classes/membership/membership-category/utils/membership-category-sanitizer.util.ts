import {
  Category,
  MembershipEligilibility,
  AffiliateEligibility,
  AccessModifier,
  Privilege,
  UserGroup,
} from '../../../../common/enums';

/**
 * Sanitize and validate membership category
 */
export function sanitizeMembershipCategory(input: unknown): Category | null {
  if (input === null || input === undefined) return null;

  // Handle string inputs
  if (typeof input === 'string') {
    const parsed = parseInt(input.trim(), 10);
    if (isNaN(parsed)) return null;
    input = parsed;
  }

  // Handle numeric inputs
  if (typeof input === 'number') {
    if (Object.values(Category).includes(input)) {
      return input as Category;
    }
  }

  return null;
}

/**
 * Sanitize and validate membership year
 */
export function sanitizeMembershipYear(input: unknown): string | null {
  if (input === null || input === undefined) return null;

  // Handle string inputs
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed === '') return null;
    return trimmed;
  }

  // Handle numeric inputs
  if (typeof input === 'number') {
    return input.toString();
  }

  return null;
}

/**
 * Sanitize and validate eligibility
 */
export function sanitizeEligibility(
  input: unknown,
): MembershipEligilibility | null {
  if (input === null || input === undefined) return null;

  // Handle string inputs
  if (typeof input === 'string') {
    const parsed = parseInt(input.trim(), 10);
    if (isNaN(parsed)) return null;
    input = parsed;
  }

  // Handle numeric inputs
  if (typeof input === 'number') {
    if (Object.values(MembershipEligilibility).includes(input)) {
      return input as MembershipEligilibility;
    }
  }

  return null;
}

/**
 * Sanitize and validate affiliate eligibility
 */
export function sanitizeAffiliateEligibility(
  input: unknown,
): AffiliateEligibility | null {
  if (input === null || input === undefined) return null;

  // Handle string inputs
  if (typeof input === 'string') {
    const parsed = parseInt(input.trim(), 10);
    if (isNaN(parsed)) return null;
    input = parsed;
  }

  // Handle numeric inputs
  if (typeof input === 'number') {
    if (Object.values(AffiliateEligibility).includes(input)) {
      return input as AffiliateEligibility;
    }
  }

  return null;
}

/**
 * Sanitize and validate users group
 */
export function sanitizeUsersGroup(input: unknown): UserGroup | null {
  if (input === null || input === undefined) return null;

  // Handle string inputs
  if (typeof input === 'string') {
    const parsed = parseInt(input.trim(), 10);
    if (isNaN(parsed)) return null;
    input = parsed;
  }

  // Handle numeric inputs
  if (typeof input === 'number') {
    if (Object.values(UserGroup).includes(input)) {
      return input as UserGroup;
    }
  }

  return null;
}

/**
 * Sanitize and validate access modifier
 */
export function sanitizeAccessModifier(input: unknown): AccessModifier | null {
  if (input === null || input === undefined) return null;

  // Handle string inputs
  if (typeof input === 'string') {
    const upperValue = input.trim().toUpperCase();
    switch (upperValue) {
      case 'PUBLIC':
        return AccessModifier.PUBLIC;
      case 'PROTECTED':
        return AccessModifier.PROTECTED;
      case 'PRIVATE':
        return AccessModifier.PRIVATE;
      default:
        return null;
    }
  }

  // Handle numeric inputs
  if (typeof input === 'number') {
    if (Object.values(AccessModifier).includes(input)) {
      return input as AccessModifier;
    }
  }

  return null;
}

/**
 * Sanitize and validate privilege
 */
export function sanitizePrivilege(input: unknown): Privilege | null {
  if (input === null || input === undefined) return null;

  // Handle string inputs
  if (typeof input === 'string') {
    const upperValue = input.trim().toUpperCase();
    switch (upperValue) {
      case 'OWNER':
        return Privilege.OWNER;
      case 'ADMIN':
        return Privilege.ADMIN;
      case 'MAIN':
        return Privilege.MAIN;
      default:
        return null;
    }
  }

  // Handle numeric inputs
  if (typeof input === 'number') {
    if (Object.values(Privilege).includes(input)) {
      return input as Privilege;
    }
  }

  return null;
}

/**
 * Sanitize and validate GUID format
 */
export function sanitizeGuid(input: unknown): string | null {
  if (input === null || input === undefined) return null;

  if (typeof input !== 'string') return null;

  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  // GUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const guidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return guidPattern.test(trimmed) ? trimmed.toLowerCase() : null;
}

/**
 * Sanitize and validate boolean values
 */
export function sanitizeBoolean(input: unknown): boolean {
  if (input === null || input === undefined) return false;

  if (typeof input === 'boolean') return input;

  if (typeof input === 'number') return input === 1;

  if (typeof input === 'string') {
    const lower = input.trim().toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1';
  }

  return false;
}

/**
 * Sanitize and validate date strings (ISO format)
 */
export function sanitizeDateString(input: unknown): string | null {
  if (input === null || input === undefined) return null;

  if (typeof input !== 'string') return null;

  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  // Check ISO date format YYYY-MM-DD
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDatePattern.test(trimmed)) return null;

  // Validate actual date
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return null;

  return trimmed;
}

/**
 * Sanitize category ID (autonumber format)
 */
export function sanitizeCategoryId(input: unknown): string | null {
  if (input === null || input === undefined) return null;

  if (typeof input !== 'string') return null;

  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  // Check pattern (osot-cat-XXXXXXX format)
  const pattern = /^osot-cat-\d{7,}$/;
  return pattern.test(trimmed) ? trimmed : null;
}
