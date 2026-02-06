/**
 * Organization Business Rules Service
 *
 * ESSENTIAL BUSINESS RULES:
 * - Slug Validation: Format, reserved keywords, uniqueness
 * - Status Transitions: Valid state changes for organizations
 * - Deletion Rules: Dependency checks before delete operations
 * - Data Integrity: Contact info, branding URLs validation
 *
 * SLUG VALIDATION RULES:
 * 1. Format: Must match /^[a-z0-9-]+$/ (lowercase, alphanumeric, hyphens)
 * 2. Reserved: Cannot use system-reserved keywords (admin, api, login, etc.)
 * 3. Uniqueness: Must be unique across all organizations (case-insensitive)
 * 4. Immutability: Cannot be changed after creation
 *
 * STATUS TRANSITION RULES:
 * - ACTIVE (1) ↔ INACTIVE (2): Bidirectional (enable/disable org)
 * - PENDING (3) → ACTIVE (1): Approval flow
 * - PENDING (3) → INACTIVE (2): Rejection
 * - INACTIVE (2) → PENDING (3): Re-submission for approval
 * - Cannot transition ACTIVE → PENDING (must disable first)
 *
 * DELETION RULES:
 * - Soft Delete: Check for active accounts/affiliates
 * - Hard Delete: Check for any accounts/affiliates (active or inactive)
 * - Active organizations: Cannot delete if has dependencies
 * - Inactive organizations: Can delete if no dependencies
 *
 * DEPENDENCIES:
 * - IOrganizationRepository: Slug uniqueness checks
 * - Future: AccountLookupService, AffiliateLookupService for dependency checks
 *
 * @file organization-business-rules.service.ts
 * @module OrganizationModule
 * @layer Services
 * @since 2025-01-XX
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { AccountStatus } from '../../../../common/enums/account-status.enum';
import { IOrganizationRepository } from '../interfaces/organization-repository.interface';
import { ORGANIZATION_REPOSITORY } from '../constants/organization.constants';

/**
 * Slug validation result
 */
export interface SlugValidationResult {
  valid: boolean;
  reason?: string;
  field?: string;
}

/**
 * Status transition result
 */
export interface StatusTransitionResult {
  valid: boolean;
  reason?: string;
  currentStatus?: AccountStatus;
  newStatus?: AccountStatus;
}

/**
 * Deletion eligibility result
 */
export interface DeletionEligibilityResult {
  canDelete: boolean;
  reason?: string;
  dependencies?: {
    activeAccounts?: number;
    activeAffiliates?: number;
    totalAccounts?: number;
    totalAffiliates?: number;
  };
}

/**
 * Contact validation result
 */
export interface ContactValidationResult {
  valid: boolean;
  field?: string;
  reason?: string;
}

/**
 * URL validation result
 */
export interface UrlValidationResult {
  valid: boolean;
  field?: string;
  reason?: string;
}

@Injectable()
export class OrganizationBusinessRulesService {
  private readonly logger = new Logger(OrganizationBusinessRulesService.name);

  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  // ========================================
  // SLUG VALIDATION
  // ========================================

  /**
   * Validate slug format
   *
   * RULES:
   * - Must match pattern: ^[a-z0-9-]+$
   * - Only lowercase letters, numbers, hyphens
   * - No spaces, underscores, or special characters
   * - At least 1 character long
   *
   * @param slug - Slug to validate
   * @returns true if format is valid
   */
  validateSlugFormat(slug: string): boolean {
    if (!slug || slug.trim().length === 0) {
      return false;
    }

    const slugPattern = /^[a-z0-9-]+$/;
    return slugPattern.test(slug);
  }

  /**
   * Check if slug is reserved
   *
   * Reserved slugs are system keywords that cannot be used
   * for organization identification to avoid routing conflicts.
   *
   * @param slug - Slug to check
   * @returns true if slug is reserved
   */
  isSlugReserved(slug: string): boolean {
    const RESERVED_SLUGS = [
      'admin',
      'api',
      'auth',
      'login',
      'logout',
      'register',
      'signup',
      'signin',
      'signout',
      'dashboard',
      'profile',
      'settings',
      'account',
      'accounts',
      'user',
      'users',
      'organization',
      'organizations',
      'affiliate',
      'affiliates',
      'product',
      'products',
      'membership',
      'memberships',
      'public',
      'private',
      'static',
      'assets',
      'app',
      'osot',
      'system',
      'root',
      'test',
    ];

    return RESERVED_SLUGS.includes(slug.toLowerCase());
  }

  /**
   * Check slug uniqueness
   *
   * Validates that slug is not already in use by another organization.
   * Case-insensitive check.
   *
   * @param slug - Slug to check
   * @param excludeId - Organization ID to exclude from check (for updates)
   * @returns Promise<true> if slug is unique (available)
   */
  async validateSlugUniqueness(
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    try {
      return await this.organizationRepository.isSlugUnique(slug, excludeId);
    } catch (error) {
      this.logger.error(
        `Error checking slug uniqueness: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Comprehensive slug validation
   *
   * Validates slug against all rules:
   * 1. Format validation
   * 2. Reserved keywords check
   * 3. Uniqueness check
   *
   * @param slug - Slug to validate
   * @param excludeId - Organization ID to exclude from uniqueness check
   * @returns Validation result with details
   */
  async validateSlug(
    slug: string,
    excludeId?: string,
  ): Promise<SlugValidationResult> {
    // 1. Format validation
    if (!this.validateSlugFormat(slug)) {
      return {
        valid: false,
        reason:
          'Slug format is invalid. Use only lowercase letters, numbers, and hyphens.',
        field: 'osot_slug',
      };
    }

    // 2. Reserved keywords check
    if (this.isSlugReserved(slug)) {
      return {
        valid: false,
        reason: `Slug '${slug}' is a reserved keyword and cannot be used.`,
        field: 'osot_slug',
      };
    }

    // 3. Uniqueness check
    const isUnique = await this.validateSlugUniqueness(slug, excludeId);
    if (!isUnique) {
      return {
        valid: false,
        reason: `Slug '${slug}' is already in use by another organization.`,
        field: 'osot_slug',
      };
    }

    return { valid: true };
  }

  /**
   * Normalize slug
   *
   * Converts slug to lowercase and trims whitespace.
   * Does NOT validate format.
   *
   * @param slug - Slug to normalize
   * @returns Normalized slug
   */
  normalizeSlug(slug: string): string {
    return slug.toLowerCase().trim();
  }

  /**
   * Sanitize slug
   *
   * Removes invalid characters and converts to valid slug format.
   * Useful for auto-generating slugs from organization names.
   *
   * TRANSFORMATIONS:
   * - Convert to lowercase
   * - Replace spaces with hyphens
   * - Remove special characters
   * - Remove consecutive hyphens
   * - Trim hyphens from start/end
   *
   * @param input - String to sanitize
   * @returns Sanitized slug
   */
  sanitizeSlug(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // spaces → hyphens
      .replace(/[^a-z0-9-]/g, '') // remove invalid chars
      .replace(/-+/g, '-') // multiple hyphens → single hyphen
      .replace(/^-+|-+$/g, ''); // trim hyphens from edges
  }

  // ========================================
  // STATUS VALIDATION
  // ========================================

  /**
   * Validate status transition
   *
   * ALLOWED TRANSITIONS:
   * - ACTIVE (1) ↔ INACTIVE (2): Bidirectional (enable/disable)
   * - PENDING (3) → ACTIVE (1): Approval
   * - PENDING (3) → INACTIVE (2): Rejection
   * - INACTIVE (2) → PENDING (3): Re-submission for approval
   *
   * FORBIDDEN TRANSITIONS:
   * - ACTIVE (1) → PENDING (3): Cannot go back to pending once active
   *
   * @param currentStatus - Current organization status
   * @param newStatus - Desired new status
   * @returns true if transition is valid
   */
  validateStatusTransition(
    currentStatus: AccountStatus,
    newStatus: AccountStatus,
  ): boolean {
    // Same status is always valid (no-op)
    if (currentStatus === newStatus) {
      return true;
    }

    const validTransitions: Record<AccountStatus, AccountStatus[]> = {
      [AccountStatus.ACTIVE]: [
        AccountStatus.INACTIVE, // Disable
      ],
      [AccountStatus.INACTIVE]: [
        AccountStatus.ACTIVE, // Re-enable
        AccountStatus.PENDING, // Re-submit for approval
      ],
      [AccountStatus.PENDING]: [
        AccountStatus.ACTIVE, // Approve
        AccountStatus.INACTIVE, // Reject
      ],
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * Can transition to status
   *
   * Enhanced status transition validation with detailed result.
   *
   * @param currentStatus - Current organization status
   * @param newStatus - Desired new status
   * @returns Transition validation result with reason
   */
  canTransitionToStatus(
    currentStatus: AccountStatus,
    newStatus: AccountStatus,
  ): StatusTransitionResult {
    if (currentStatus === newStatus) {
      return {
        valid: true,
        currentStatus,
        newStatus,
      };
    }

    const isValid = this.validateStatusTransition(currentStatus, newStatus);

    if (!isValid) {
      const statusNames = {
        [AccountStatus.ACTIVE]: 'Active',
        [AccountStatus.INACTIVE]: 'Inactive',
        [AccountStatus.PENDING]: 'Pending',
      };

      return {
        valid: false,
        reason: `Cannot transition from ${statusNames[currentStatus]} to ${statusNames[newStatus]}. Invalid status transition.`,
        currentStatus,
        newStatus,
      };
    }

    return {
      valid: true,
      currentStatus,
      newStatus,
    };
  }

  // ========================================
  // DELETION VALIDATION
  // ========================================

  /**
   * Check if organization can be deleted
   *
   * SOFT DELETE RULES:
   * - Cannot delete if has ACTIVE accounts
   * - Cannot delete if has ACTIVE affiliates
   * - Can delete if all dependencies are INACTIVE
   *
   * HARD DELETE RULES:
   * - Cannot delete if has ANY accounts (active or inactive)
   * - Cannot delete if has ANY affiliates (active or inactive)
   * - Must clean up all dependencies first
   *
   * @param organizationId - Organization GUID
   * @param _isHardDelete - Whether this is a hard delete (permanent) - unused until Account/Affiliate modules available
   * @returns Deletion eligibility result
   */
  canDelete(
    organizationId: string,
    _isHardDelete: boolean = false,
  ): DeletionEligibilityResult {
    try {
      // TODO: Implement when Account and Affiliate modules are available
      // For now, return true to allow deletion

      // Future implementation:
      // 1. Query accounts by organization_id
      // 2. Query affiliates by organization_id
      // 3. Check status of dependencies
      // 4. Return eligibility based on rules

      /*
      const activeAccounts = await this.accountLookupService.countByOrganization(
        organizationId,
        { status: AccountStatus.ACTIVE }
      );
      const activeAffiliates = await this.affiliateLookupService.countByOrganization(
        organizationId,
        { status: AccountStatus.ACTIVE }
      );

      if (isHardDelete) {
        const totalAccounts = await this.accountLookupService.countByOrganization(organizationId);
        const totalAffiliates = await this.affiliateLookupService.countByOrganization(organizationId);

        if (totalAccounts > 0 || totalAffiliates > 0) {
          return {
            canDelete: false,
            reason: 'Cannot permanently delete organization with existing accounts or affiliates. Delete all dependencies first.',
            dependencies: {
              totalAccounts,
              totalAffiliates,
            },
          };
        }
      } else {
        if (activeAccounts > 0 || activeAffiliates > 0) {
          return {
            canDelete: false,
            reason: 'Cannot delete organization with active accounts or affiliates. Deactivate all dependencies first.',
            dependencies: {
              activeAccounts,
              activeAffiliates,
            },
          };
        }
      }
      */

      this.logger.warn(
        `Deletion dependency check not yet implemented. Allowing deletion of organization ${organizationId}`,
      );

      return {
        canDelete: true,
        dependencies: {
          activeAccounts: 0,
          activeAffiliates: 0,
          totalAccounts: 0,
          totalAffiliates: 0,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error checking deletion eligibility: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      return {
        canDelete: false,
        reason: 'Error checking organization dependencies.',
      };
    }
  }

  /**
   * Check if organization has active accounts
   *
   * @param organizationId - Organization GUID
   * @returns Promise<true> if organization has active accounts
   */
  hasActiveAccounts(organizationId: string): boolean {
    // TODO: Implement when Account module is available
    // For now, return false

    /*
    try {
      const count = await this.accountLookupService.countByOrganization(
        organizationId,
        { status: AccountStatus.ACTIVE }
      );
      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking active accounts: ${error.message}`);
      return false;
    }
    */

    this.logger.warn(
      `hasActiveAccounts check not yet implemented. Returning false for organization ${organizationId}`,
    );
    return false;
  }

  /**
   * Check if organization has active affiliates
   *
   * @param organizationId - Organization GUID
   * @returns Promise<true> if organization has active affiliates
   */
  hasActiveAffiliates(organizationId: string): boolean {
    // TODO: Implement when Affiliate module is available
    // For now, return false

    /*
    try {
      const count = await this.affiliateLookupService.countByOrganization(
        organizationId,
        { status: AccountStatus.ACTIVE }
      );
      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking active affiliates: ${error.message}`);
      return false;
    }
    */

    this.logger.warn(
      `hasActiveAffiliates check not yet implemented. Returning false for organization ${organizationId}`,
    );
    return false;
  }

  // ========================================
  // DATA INTEGRITY VALIDATION
  // ========================================

  /**
   * Validate email format
   *
   * Basic email validation using regex pattern.
   *
   * @param email - Email address to validate
   * @returns true if email format is valid
   */
  validateEmail(email: string): boolean {
    if (!email || email.trim().length === 0) {
      return false;
    }

    // Basic email regex (RFC 5322 simplified)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * Validate phone format
   *
   * Accepts various international phone formats.
   * Allows: digits, spaces, hyphens, parentheses, plus sign
   *
   * @param phone - Phone number to validate
   * @returns true if phone format is valid
   */
  validatePhone(phone: string): boolean {
    if (!phone || phone.trim().length === 0) {
      return false;
    }

    // International phone format (flexible)
    // Allows: +1 (555) 123-4567, +351 21 123 4567, etc.
    const phonePattern = /^[\d\s\-()+]+$/;
    const cleanPhone = phone.trim();

    if (!phonePattern.test(cleanPhone)) {
      return false;
    }

    // Must have at least 7 digits
    const digitCount = cleanPhone.replace(/\D/g, '').length;
    return digitCount >= 7 && digitCount <= 15;
  }

  /**
   * Validate URL format
   *
   * Checks for valid HTTP/HTTPS URL format.
   *
   * @param url - URL to validate
   * @returns true if URL format is valid
   */
  validateUrl(url: string): boolean {
    if (!url || url.trim().length === 0) {
      return false;
    }

    try {
      const urlObject = new URL(url);
      // Only allow http and https protocols
      return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Validate contact information
   *
   * Validates organization email and phone number.
   *
   * @param email - Organization email (optional)
   * @param phone - Organization phone (optional)
   * @returns Validation result
   */
  validateContactInformation(
    email?: string,
    phone?: string,
  ): ContactValidationResult {
    // Email validation
    if (email && !this.validateEmail(email)) {
      return {
        valid: false,
        field: 'organization_email',
        reason: 'Invalid email format.',
      };
    }

    // Phone validation
    if (phone && !this.validatePhone(phone)) {
      return {
        valid: false,
        field: 'organization_phone',
        reason:
          'Invalid phone format. Use international format with 7-15 digits.',
      };
    }

    return { valid: true };
  }

  /**
   * Validate branding URLs
   *
   * Validates organization logo and website URLs.
   *
   * @param logoUrl - Organization logo URL (optional)
   * @param websiteUrl - Organization website URL (optional)
   * @returns Validation result
   */
  validateBrandingUrls(
    logoUrl?: string,
    websiteUrl?: string,
  ): UrlValidationResult {
    // Logo URL validation
    if (logoUrl && !this.validateUrl(logoUrl)) {
      return {
        valid: false,
        field: 'organization_logo',
        reason: 'Invalid logo URL format. Must be a valid HTTP/HTTPS URL.',
      };
    }

    // Website URL validation
    if (websiteUrl && !this.validateUrl(websiteUrl)) {
      return {
        valid: false,
        field: 'organization_website',
        reason: 'Invalid website URL format. Must be a valid HTTP/HTTPS URL.',
      };
    }

    return { valid: true };
  }

  /**
   * Validate organization data integrity
   *
   * Comprehensive validation of organization data.
   * Validates:
   * - Slug (format, reserved, uniqueness)
   * - Contact information (email, phone)
   * - Branding URLs (logo, website)
   *
   * @param data - Organization data to validate
   * @param excludeId - Organization ID to exclude from uniqueness check
   * @returns Promise<true> if all validations pass, throws error otherwise
   */
  async validateOrganizationData(
    data: {
      osot_slug?: string;
      organization_email?: string;
      organization_phone?: string;
      organization_logo?: string;
      organization_website?: string;
    },
    excludeId?: string,
  ): Promise<boolean> {
    // Slug validation
    if (data.osot_slug) {
      const slugValidation = await this.validateSlug(data.osot_slug, excludeId);
      if (!slugValidation.valid) {
        throw new Error(slugValidation.reason);
      }
    }

    // Contact information validation
    const contactValidation = this.validateContactInformation(
      data.organization_email,
      data.organization_phone,
    );
    if (!contactValidation.valid) {
      throw new Error(contactValidation.reason);
    }

    // Branding URLs validation
    const brandingValidation = this.validateBrandingUrls(
      data.organization_logo,
      data.organization_website,
    );
    if (!brandingValidation.valid) {
      throw new Error(brandingValidation.reason);
    }

    return true;
  }
}
