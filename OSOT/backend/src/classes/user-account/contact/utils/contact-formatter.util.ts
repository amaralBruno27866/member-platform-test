/**
 * Contact Formatter Utility
 *
 * Provides formatting functions for contact-specific data including
 * social media URLs, business information, and display formats.
 *
 * Integration Features:
 * - url-sanitizer.utils integration for secure URL formatting
 * - phone-formatter.utils integration for consistent phone display
 * - Platform-specific URL validation using SocialMediaPlatform enum
 * - Security-focused formatting with automatic HTTPS enforcement
 */

import { ContactInternal } from '../interfaces/contact-internal.interface';
import {
  sanitizeUrl,
  SocialMediaPlatform,
} from '../../../../utils/url-sanitizer.utils';
import { formatPhoneNumber } from '../../../../utils/phone-formatter.utils';

/**
 * Social Media URL Formatter
 * Ensures consistent URL formats for different social media platforms
 */
export class SocialMediaUrlFormatter {
  /**
   * Format Facebook URL using project url-sanitizer.utils
   * @param url Raw Facebook URL or username
   * @returns Formatted Facebook URL
   */
  static formatFacebookUrl(url: string): string {
    if (!url) return '';

    try {
      // If it's just a username, create full URL
      if (!url.includes('http') && !url.includes('.')) {
        const username = url.trim().toLowerCase().replace(/^@?/, '');
        return sanitizeUrl(
          `https://facebook.com/${username}`,
          SocialMediaPlatform.FACEBOOK,
        );
      }

      // Use project utils for full URL sanitization
      return sanitizeUrl(url, SocialMediaPlatform.FACEBOOK);
    } catch {
      return '';
    }
  }

  /**
   * Format Instagram URL using project url-sanitizer.utils
   * @param url Raw Instagram URL or username
   * @returns Formatted Instagram URL
   */
  static formatInstagramUrl(url: string): string {
    if (!url) return '';

    try {
      if (!url.includes('http') && !url.includes('.')) {
        const username = url.trim().toLowerCase().replace(/^@?/, '');
        return sanitizeUrl(
          `https://instagram.com/${username}`,
          SocialMediaPlatform.INSTAGRAM,
        );
      }
      return sanitizeUrl(url, SocialMediaPlatform.INSTAGRAM);
    } catch {
      return '';
    }
  }

  /**
   * Format TikTok URL using project url-sanitizer.utils
   * @param url Raw TikTok URL or username
   * @returns Formatted TikTok URL
   */
  static formatTiktokUrl(url: string): string {
    if (!url) return '';

    try {
      if (!url.includes('http') && !url.includes('.')) {
        const username = url.trim().toLowerCase().replace(/^@?/, '');
        return sanitizeUrl(
          `https://tiktok.com/@${username}`,
          SocialMediaPlatform.TIKTOK,
        );
      }
      return sanitizeUrl(url, SocialMediaPlatform.TIKTOK);
    } catch {
      return '';
    }
  }

  /**
   * Format LinkedIn URL using project url-sanitizer.utils
   * @param url Raw LinkedIn URL or username
   * @returns Formatted LinkedIn URL
   */
  static formatLinkedinUrl(url: string): string {
    if (!url) return '';

    try {
      if (!url.includes('http') && !url.includes('.')) {
        const username = url.trim().toLowerCase().replace(/^@?/, '');
        return sanitizeUrl(
          `https://linkedin.com/in/${username}`,
          SocialMediaPlatform.LINKEDIN,
        );
      }
      return sanitizeUrl(url, SocialMediaPlatform.LINKEDIN);
    } catch {
      return '';
    }
  }

  /**
   * Format all social media URLs using project utils
   * @param contact Contact data
   * @returns Contact with formatted URLs
   */
  static formatAllUrls(
    contact: Partial<ContactInternal>,
  ): Partial<ContactInternal> {
    const formatted = { ...contact };

    try {
      if (contact.osot_facebook) {
        formatted.osot_facebook = this.formatFacebookUrl(contact.osot_facebook);
      }

      if (contact.osot_instagram) {
        formatted.osot_instagram = this.formatInstagramUrl(
          contact.osot_instagram,
        );
      }

      if (contact.osot_tiktok) {
        formatted.osot_tiktok = this.formatTiktokUrl(contact.osot_tiktok);
      }

      if (contact.osot_linkedin) {
        formatted.osot_linkedin = this.formatLinkedinUrl(contact.osot_linkedin);
      }

      if (contact.osot_business_website) {
        formatted.osot_business_website = sanitizeUrl(
          contact.osot_business_website,
          SocialMediaPlatform.WEBSITE,
        );
      }
    } catch {
      // If any URL formatting fails, return original contact
      return contact;
    }

    return formatted;
  }
}

/**
 * Contact Display Formatter
 * Formats contact information for display purposes
 */
export class ContactDisplayFormatter {
  /**
   * Format contact for display with masked sensitive information
   * @param contact Contact data
   * @returns Formatted display string
   */
  static formatContactSummary(contact: Partial<ContactInternal>): string {
    const parts: string[] = [];

    if (contact.osot_user_business_id) {
      parts.push(`ID: ${contact.osot_user_business_id}`);
    }

    if (contact.osot_job_title) {
      parts.push(`Job: ${contact.osot_job_title}`);
    }

    if (contact.osot_secondary_email) {
      parts.push(`Email: ${this.maskEmail(contact.osot_secondary_email)}`);
    }

    return parts.join(' | ');
  }

  /**
   * Mask email address for display
   * Example: john@example.com -> j***@example.com
   * @param email Email to mask
   * @returns Masked email
   */
  static maskEmail(email: string): string {
    if (!email) return '';

    const [username, domain] = email.split('@');
    if (!username || !domain) return email;

    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 1);
    return `${maskedUsername}@${domain}`;
  }

  /**
   * Mask phone number for display using project phone formatter
   * Enhanced with formatPhoneNumber for consistent Canadian formatting
   * @param phone Phone to mask
   * @returns Masked phone
   */
  static maskPhone(phone: string): string {
    if (!phone) return '';

    try {
      // First format using project utils for consistency
      const formatted = formatPhoneNumber(phone);

      // Then mask the middle digits: (416) 555-1234 -> (416) ***-1234
      return formatted.replace(/(\(\d{3}\)\s)\d{3}(-\d{4})/, '$1***$2');
    } catch {
      // Fallback to simple masking if formatting fails
      const digits = phone.replace(/\D/g, '');
      if (digits.length >= 7) {
        const start = digits.slice(0, 3);
        const end = digits.slice(-4);
        return `${start}***${end}`;
      }
      return phone;
    }
  }

  /**
   * Format social media summary
   * @param contact Contact data
   * @returns Summary of social media presence
   */
  static formatSocialMediaSummary(contact: Partial<ContactInternal>): string {
    const platforms: string[] = [];

    if (contact.osot_facebook) platforms.push('Facebook');
    if (contact.osot_instagram) platforms.push('Instagram');
    if (contact.osot_tiktok) platforms.push('TikTok');
    if (contact.osot_linkedin) platforms.push('LinkedIn');
    if (contact.osot_business_website) platforms.push('Website');

    if (platforms.length === 0) return 'No social media';
    if (platforms.length === 1) return platforms[0];
    if (platforms.length === 2) return platforms.join(' and ');

    const last = platforms.pop();
    return `${platforms.join(', ')}, and ${last}`;
  }
}
