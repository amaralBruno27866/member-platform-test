/**
 * Internal Affiliate interface with all fields including sensitive information.
 * Used for server-side operations and business logic.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums for type safety (AffiliateArea, AccountStatus, etc.)
 * - MATCHES Table Account Affiliate.csv specification exactly (27 fields total)
 * - Consolidates address, contact, identity, and account data in single entity
 *
 * WARNING: This interface contains sensitive fields (password, internal IDs, privileges)
 * and should NEVER be exposed directly to public APIs. Use AffiliateResponseDto for public responses.
 *
 * BUSINESS CONTEXT:
 * - Affiliate represents organizations that partner with OSOT
 * - Each affiliate has a designated representative (contact person)
 * - Includes comprehensive address and contact information
 * - Manages access control through privileges and access modifiers
 *
 * @author OSOT Development Team
 * @version 1.0.0
 */

import {
  AffiliateArea,
  AccountStatus,
  AccessModifier,
  Privilege,
  Province,
  Country,
  City,
} from '../../../../common/enums';

export interface AffiliateInternal {
  // ========================================
  // SYSTEM FIELDS (internal use only - never expose publicly)
  // ========================================

  /** GUID - Primary key for Dataverse table */
  osot_table_account_affiliateid?: string;

  /** Autonumber Business ID (affi-0000001) - public identifier */
  osot_affiliate_id?: string;

  /** ISO datetime string - record creation timestamp */
  createdon?: string;

  /** ISO datetime string - record modification timestamp */
  modifiedon?: string;

  /** Owner GUID - system ownership for security */
  ownerid?: string;

  // ========================================
  // ORGANIZATION PROFILE
  // ========================================

  /**
   * Organization name (Business Required)
   * Max length: 255 characters
   */
  osot_affiliate_name: string;

  /**
   * Business area/sector of the affiliate (Business Required)
   * Synchronized with global Choices_Affiliate_Areas
   */
  osot_affiliate_area: AffiliateArea;

  // ========================================
  // REPRESENTATIVE IDENTITY
  // ========================================

  /**
   * Representative's first name (Business Required)
   * Max length: 255 characters
   */
  osot_representative_first_name: string;

  /**
   * Representative's last name (Business Required)
   * Max length: 255 characters
   */
  osot_representative_last_name: string;

  /**
   * Representative's job title (Business Required)
   * Max length: 255 characters
   */
  osot_representative_job_title: string;

  // ========================================
  // CONTACT INFORMATION
  // ========================================

  /**
   * Primary email address (Business Required)
   * Max length: 255 characters
   * Used for authentication and communications
   */
  osot_affiliate_email: string;

  /**
   * Primary phone number (Business Required)
   * Max length: 14 characters
   * Format: international phone number format
   */
  osot_affiliate_phone: string;

  /**
   * Organization website URL (Optional)
   * Max length: 255 characters
   */
  osot_affiliate_website?: string;

  // ========================================
  // SOCIAL MEDIA LINKS
  // ========================================

  /**
   * Facebook page URL (Optional)
   * Max length: 255 characters
   */
  osot_affiliate_facebook?: string;

  /**
   * Instagram profile URL (Optional)
   * Max length: 255 characters
   */
  osot_affiliate_instagram?: string;

  /**
   * TikTok profile URL (Optional)
   * Max length: 255 characters
   */
  osot_affiliate_tiktok?: string;

  /**
   * LinkedIn company page URL (Optional)
   * Max length: 255 characters
   */
  osot_affiliate_linkedin?: string;

  // ========================================
  // ADDRESS INFORMATION
  // ========================================

  /**
   * Primary address line (Business Required)
   * Max length: 255 characters
   */
  osot_affiliate_address_1: string;

  /**
   * Secondary address line (Optional)
   * Max length: 255 characters
   */
  osot_affiliate_address_2?: string;

  /**
   * City (Business Required)
   * Synchronized with global Choices_Cities
   */
  osot_affiliate_city: City;

  /**
   * Other city name (Optional)
   * Custom city when not in enum
   * Max length: 255 characters
   */
  osot_other_city?: string;

  /**
   * Province/State (Business Required)
   * Synchronized with global Choices_Provinces
   * Default: Ontario
   */
  osot_affiliate_province: Province;

  /**
   * Other province/state name (Optional)
   * Custom province/state when not in enum
   * Max length: 255 characters
   */
  osot_other_province_state?: string;

  /**
   * Postal/ZIP code (Business Required)
   * Max length: 7 characters
   * Format depends on country (CA: A1A 1A1, US: 12345-1234)
   */
  osot_affiliate_postal_code: string;

  /**
   * Country (Business Required)
   * Synchronized with global Choices_Countries
   * Default: Canada
   */
  osot_affiliate_country: Country;

  // ========================================
  // ACCOUNT & SECURITY
  // ========================================

  /**
   * Encrypted password (Business Required)
   * Max length: 255 characters
   * SECURITY: Always store hashed, never expose in responses
   */
  osot_password: string;

  /**
   * Account status (Optional)
   * Synchronized with global Choices_Status
   * Default: Pending
   */
  osot_account_status?: AccountStatus;

  /**
   * Account declaration flag (Business Required)
   * User confirms information accuracy
   * Default: false (No)
   */
  osot_account_declaration: boolean;

  /**
   * Active membership status (Optional)
   * Indicates if affiliate is currently active
   * Default: false (No)
   */
  osot_active_member?: boolean;

  // ========================================
  // ACCESS CONTROL & PERMISSIONS
  // ========================================

  /**
   * Access modifier level (Optional)
   * Synchronized with global Choices_Access_Modifiers
   * Default: Private
   */
  osot_access_modifiers?: AccessModifier;

  /**
   * Privilege level (Optional)
   * Synchronized with global Choices_Privilege
   * Default: Owner
   * SECURITY: Controls application access levels
   */
  osot_privilege?: Privilege;
}

// ========================================
// DERIVED INTERFACES FOR SUBDOMAINS
// ========================================

/**
 * Representative information subset
 * Represents the contact person for the affiliate organization
 */
export interface AffiliateRepresentative {
  osot_representative_first_name: string;
  osot_representative_last_name: string;
  osot_representative_job_title: string;
}

/**
 * Organization profile subset
 * Core business information about the affiliate
 */
export interface AffiliateOrganization {
  osot_affiliate_name: string;
  osot_affiliate_area: AffiliateArea;
  osot_affiliate_website?: string;
}

/**
 * Contact information subset
 * All communication channels for the affiliate
 */
export interface AffiliateContact {
  osot_affiliate_email: string;
  osot_affiliate_phone: string;
  osot_affiliate_facebook?: string;
  osot_affiliate_instagram?: string;
  osot_affiliate_tiktok?: string;
  osot_affiliate_linkedin?: string;
}

/**
 * Address information subset
 * Physical location details for the affiliate
 */
export interface AffiliateAddress {
  osot_affiliate_address_1: string;
  osot_affiliate_address_2?: string;
  osot_affiliate_city: City;
  osot_other_city?: string;
  osot_affiliate_province: Province;
  osot_other_province_state?: string;
  osot_affiliate_postal_code: string;
  osot_affiliate_country: Country;
}

/**
 * Account security subset
 * Authentication and access control information
 */
export interface AffiliateAccount {
  osot_password: string;
  osot_account_status?: AccountStatus;
  osot_account_declaration: boolean;
  osot_active_member?: boolean;
  osot_access_modifiers?: AccessModifier;
  osot_privilege?: Privilege;
}

// ========================================
// TYPE UTILITIES
// ========================================

/**
 * Fields that are required for affiliate creation
 */
export type AffiliateRequiredFields = Pick<
  AffiliateInternal,
  | 'osot_affiliate_name'
  | 'osot_affiliate_area'
  | 'osot_representative_first_name'
  | 'osot_representative_last_name'
  | 'osot_representative_job_title'
  | 'osot_affiliate_email'
  | 'osot_affiliate_phone'
  | 'osot_affiliate_address_1'
  | 'osot_affiliate_city'
  | 'osot_affiliate_province'
  | 'osot_affiliate_postal_code'
  | 'osot_affiliate_country'
  | 'osot_password'
  | 'osot_account_declaration'
>;

/**
 * Fields that can be updated after creation
 */
export type AffiliateUpdatableFields = Omit<
  AffiliateInternal,
  | 'osot_table_account_affiliateid'
  | 'osot_affiliate_id'
  | 'createdon'
  | 'modifiedon'
  | 'ownerid'
>;

/**
 * Public fields safe for external exposure
 */
export type AffiliatePublicFields = Omit<
  AffiliateInternal,
  | 'osot_table_account_affiliateid'
  | 'ownerid'
  | 'osot_password'
  | 'osot_privilege'
>;
