/**
 * Contact Sanitizer Utility
 *
 * Provides data sanitization and cleaning functions for contact data.
 * Ensures data consistency and removes potentially harmful content.
 */

import type { ContactInternal } from '../interfaces/contact-internal.interface';
import {
  sanitizeUrl,
  SocialMediaPlatform,
} from '../../../../utils/url-sanitizer.utils';
import { formatPhoneNumber } from '../../../../utils/phone-formatter.utils';

/**
 * Validation patterns for contact data
 */
const CONTACT_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CANADIAN_PHONE: /^\+?1?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
  URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
} as const;

/**
 * Contact Data Sanitizer
 * Sanitizes and cleans contact input data
 */
export class ContactDataSanitizer {
  /**
   * Sanitize user business ID
   * @param businessId Raw business ID
   * @returns Cleaned business ID
   */
  static sanitizeUserBusinessId(businessId: string): string {
    if (!businessId) return '';

    return businessId
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '') // Remove invalid characters
      .substring(0, 20); // Enforce max length from CSV
  }

  /**
   * Sanitize email address
   * @param email Raw email
   * @returns Cleaned email
   */
  static sanitizeEmail(email: string): string {
    if (!email) return '';

    return email.trim().toLowerCase();
  }

  /**
   * Sanitize job title
   * @param jobTitle Raw job title
   * @returns Cleaned job title
   */
  static sanitizeJobTitle(jobTitle: string): string {
    if (!jobTitle) return '';

    return jobTitle
      .trim()
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 50); // Enforce max length from CSV
  }

  /**
   * Sanitize phone number using global phone formatter
   * Uses global phone formatter for enhanced validation and formatting
   * @param phone Raw phone number
   * @returns Properly formatted Canadian phone number or original if invalid
   */
  static sanitizePhone(phone: string): string {
    if (!phone) return '';

    try {
      // Use global formatter which handles validation and formatting
      return formatPhoneNumber(phone);
    } catch {
      // If formatting fails, return empty string for consistency
      return '';
    }
  }

  /**
   * Sanitize URL for business website
   * Uses global URL sanitizer for enhanced security
   * @param url Raw URL input
   * @returns Sanitized URL or empty string if invalid
   */
  static sanitizeUrl(url: string): string {
    return sanitizeUrl(url);
  }

  /**
   * Sanitize social media URLs with platform-specific validation
   * Uses global URL sanitizer with platform enum for enhanced security
   * @param url Raw social media URL
   * @param platform Social media platform type
   * @returns Sanitized URL or empty string if invalid
   */
  static sanitizeSocialMediaUrl(
    url: string,
    platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin',
  ): string {
    const platformMap: Record<typeof platform, SocialMediaPlatform> = {
      facebook: SocialMediaPlatform.FACEBOOK,
      instagram: SocialMediaPlatform.INSTAGRAM,
      tiktok: SocialMediaPlatform.TIKTOK,
      linkedin: SocialMediaPlatform.LINKEDIN,
    };

    return sanitizeUrl(url, platformMap[platform]);
  }

  /**
   * Sanitize complete contact object
   * @param contact Raw contact data
   * @returns Sanitized contact data
   */
  static sanitizeContactData(
    contact: Partial<ContactInternal>,
  ): Partial<ContactInternal> {
    const sanitized: Partial<ContactInternal> = { ...contact };

    // Sanitize required fields
    if (contact.osot_user_business_id) {
      sanitized.osot_user_business_id = this.sanitizeUserBusinessId(
        contact.osot_user_business_id,
      );
    }

    // Sanitize optional fields
    if (contact.osot_secondary_email) {
      sanitized.osot_secondary_email = this.sanitizeEmail(
        contact.osot_secondary_email,
      );
    }

    if (contact.osot_job_title) {
      sanitized.osot_job_title = this.sanitizeJobTitle(contact.osot_job_title);
    }

    if (contact.osot_home_phone) {
      sanitized.osot_home_phone = this.sanitizePhone(contact.osot_home_phone);
    }

    if (contact.osot_work_phone) {
      sanitized.osot_work_phone = this.sanitizePhone(contact.osot_work_phone);
    }

    // Sanitize URLs
    if (contact.osot_business_website) {
      sanitized.osot_business_website = this.sanitizeUrl(
        contact.osot_business_website,
      );
    }

    if (contact.osot_facebook) {
      sanitized.osot_facebook = this.sanitizeSocialMediaUrl(
        contact.osot_facebook,
        'facebook',
      );
    }

    if (contact.osot_instagram) {
      sanitized.osot_instagram = this.sanitizeSocialMediaUrl(
        contact.osot_instagram,
        'instagram',
      );
    }

    if (contact.osot_tiktok) {
      sanitized.osot_tiktok = this.sanitizeSocialMediaUrl(
        contact.osot_tiktok,
        'tiktok',
      );
    }

    if (contact.osot_linkedin) {
      sanitized.osot_linkedin = this.sanitizeSocialMediaUrl(
        contact.osot_linkedin,
        'linkedin',
      );
    }

    return sanitized;
  }

  /**
   * Validate sanitized data against business rules
   * @param contact Sanitized contact data
   * @returns Validation result with errors
   */
  static validateSanitizedData(contact: Partial<ContactInternal>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required field
    if (!contact.osot_user_business_id) {
      errors.push('User Business ID is required');
    } else if (contact.osot_user_business_id.length < 3) {
      errors.push('User Business ID must be at least 3 characters');
    }

    // Validate email format if provided
    if (
      contact.osot_secondary_email &&
      !CONTACT_PATTERNS.EMAIL.test(contact.osot_secondary_email)
    ) {
      errors.push('Invalid email format');
    }

    // Validate phone formats if provided
    if (
      contact.osot_home_phone &&
      !CONTACT_PATTERNS.CANADIAN_PHONE.test(contact.osot_home_phone)
    ) {
      errors.push('Invalid home phone format (Canadian format required)');
    }

    if (
      contact.osot_work_phone &&
      !CONTACT_PATTERNS.CANADIAN_PHONE.test(contact.osot_work_phone)
    ) {
      errors.push('Invalid work phone format (Canadian format required)');
    }

    // Validate URLs if provided
    const urlFields = [
      'osot_business_website',
      'osot_facebook',
      'osot_instagram',
      'osot_tiktok',
      'osot_linkedin',
    ] as const;

    urlFields.forEach((field) => {
      if (contact[field] && !CONTACT_PATTERNS.URL.test(contact[field])) {
        errors.push(`Invalid URL format for ${field}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
