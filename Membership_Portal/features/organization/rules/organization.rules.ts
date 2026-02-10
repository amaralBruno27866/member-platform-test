import { OrganizationRepository } from '../interfaces/organization-repository.interface';

// Build a human-friendly business ID from a numeric sequence.
export const buildOrganizationBusinessId = (sequence: number): string => {
  const padded = String(sequence).padStart(6, '0');
  return `ORG-${padded}`;
};

// Normalize email to a consistent lowercase format.
export const normalizeOrganizationEmail = (email: string): string => email.trim().toLowerCase();

// Remove whitespace and trim phone numbers for consistent storage.
export const normalizeOrganizationPhone = (phone: string): string =>
  phone.replace(/\s+/g, '').trim();

// Uppercase acronyms and trim input when provided.
export const normalizeOrganizationAcronym = (acronym?: string): string | undefined =>
  acronym ? acronym.trim().toUpperCase() : undefined;

// Default to not verified unless explicitly set.
export const ensureEmailVerificationDefault = (isEmailVerified?: boolean): boolean =>
  isEmailVerified ?? false;

// Enforce email uniqueness at the business rule level.
export const ensureUniqueOrganizationEmail = async (
  repo: OrganizationRepository,
  email: string
): Promise<void> => {
  const normalizedEmail = normalizeOrganizationEmail(email);
  const existing = await repo.findByEmail(normalizedEmail);
  if (existing) {
    throw new Error('Organization email already exists');
  }
};
