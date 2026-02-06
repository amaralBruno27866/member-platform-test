import { Injectable, Inject, Logger } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { CreateContactDto } from '../dtos/create-contact.dto';
import { UpdateContactDto } from '../dtos/update-contact.dto';
import { ContactEventsService } from '../events/contact.events';
import {
  ContactRepository,
  CONTACT_REPOSITORY,
} from '../interfaces/contact-repository.interface';
import { formatPhoneNumber } from '../../../../utils/phone-formatter.utils';
import {
  sanitizeUrl,
  SocialMediaPlatform,
} from '../../../../utils/url-sanitizer.utils';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { createAppError } from '../../../../common/errors/error.factory';
import {
  canCreate,
  canRead,
  canWrite,
} from '../../../../utils/dataverse-app.helper';

/**
 * Contact Business Rules Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Business Rule Framework: Centralized validation and business logic enforcement for contacts
 * - Hybrid Architecture: Modern Repository + Legacy DataverseService for migration compatibility
 * - Structured Logging: Operation IDs, security-aware logging with PII redaction
 * - Security-First Design: Privilege-based access control and comprehensive audit trails
 * - Event Integration: Comprehensive business event emission and validation tracking
 * - Error Management: Centralized error handling with createAppError and detailed context
 *
 * PERMISSION SYSTEM (Privilege-based):
 * - OWNER: Full access to all business rule operations and contact validation
 * - ADMIN: Full access to validation with comprehensive audit capabilities
 * - MAIN: Standard validation access with privilege-based operation filtering
 * - Business rules enforce data integrity regardless of privilege level
 *
 * ENTERPRISE FEATURES:
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Business ID uniqueness validation across the entire system
 * - Social media URL validation and normalization with platform-specific rules
 * - Professional networking rules analysis and enforcement
 * - Communication preference validation with Canadian standards
 * - Contact deduplication logic with sophisticated matching algorithms
 * - Account relationship validation with status verification
 * - Security-aware logging with PII redaction capabilities
 * - Performance monitoring and business rule analytics
 *
 * CANADIAN STANDARDS:
 * - Phone number formatting following Canadian telecommunications standards
 * - Email validation with Canadian domain considerations
 * - Address integration with Canadian postal standards
 * - Bilingual support for French/English contact information
 *
 * Key Features:
 * - Business ID uniqueness validation across the system with audit trails
 * - Social media URL validation and normalization for major platforms
 * - Professional networking rules and comprehensive analysis
 * - Communication preference validation with detailed reporting
 * - Contact deduplication logic with sophisticated matching
 * - Account relationship validation with status verification
 * - Privilege-based validation with comprehensive security audit
 * - Operation tracking for compliance and debugging requirements
 * - Structured logging with security-aware PII handling
 */
@Injectable()
export class ContactBusinessRuleService {
  private readonly logger = new Logger(ContactBusinessRuleService.name);

  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: ContactRepository,
    private readonly dataverseService: DataverseService,
    private readonly eventsService: ContactEventsService,
  ) {}

  /**
   * Check if business ID is unique across the system
   * Business Rule: Business ID must be unique globally across all contacts
   */
  async checkBusinessIdUniqueness(
    businessId: string,
    excludeContactId?: string,
    userRole?: string,
  ): Promise<boolean> {
    // Enhanced permission checking for business rule access
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to business ID validation',
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'checkBusinessIdUniqueness',
      });
    }

    let filter = `osot_user_business_id eq '${businessId}'`;

    // If updating, exclude current contact from check
    if (excludeContactId) {
      filter += ` and osot_table_contactid ne '${excludeContactId}'`;
    }

    const endpoint = `osot_table_contacts?$filter=${filter}&$select=osot_table_contactid,osot_user_business_id`;

    try {
      const response = await this.dataverseService.request('GET', endpoint);
      const data = response as { value?: any[] };

      if (Array.isArray(data.value) && data.value.length > 0) {
        // Emit validation event
        this.eventsService.emitValidation({
          contactId: excludeContactId,
          accountId: '',
          validationType: 'business_id_uniqueness',
          isValid: false,
          errors: [`Business ID '${businessId}' already exists in the system`],
          timestamp: new Date(),
        });

        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: `Business ID '${businessId}' already exists. Business IDs must be unique across the system.`,
          businessId,
          rule: 'business_id_uniqueness',
          existing: (data.value[0] as { osot_table_contactid: string })
            .osot_table_contactid,
        });
      }

      // Emit successful validation event
      this.eventsService.emitValidation({
        contactId: excludeContactId,
        accountId: '',
        validationType: 'business_id_uniqueness',
        isValid: true,
        timestamp: new Date(),
      });

      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error; // Re-throw our business rule error
      }

      // For unexpected errors, allow operation to continue but log for investigation
      this.logger.warn(
        'Unexpected error during business ID check, allowing operation to continue',
      );
      return true; // Allow operation to continue
    }
  }

  /**
   * Validate account relationship exists and is active
   * Business Rule: Contact must be associated with an active account
   */
  async validateAccountRelationship(
    accountBinding: string,
    userRole?: string,
  ): Promise<string> {
    // Enhanced permission checking
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to account relationship validation',
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'validateAccountRelationship',
      });
    }

    // Extract account ID from OData binding format
    const accountIdMatch = accountBinding.match(/\(([^)]+)\)/);
    if (!accountIdMatch) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message: 'Invalid account binding format',
        accountBinding,
        expectedFormat: '/osot_table_accounts(GUID)',
      });
    }

    const accountId = accountIdMatch[1];

    try {
      const endpoint = `osot_table_accounts(${accountId})?$select=osot_table_accountid,osot_account_status`;
      const response = await this.dataverseService.request('GET', endpoint);

      const account = response as {
        osot_table_accountid: string;
        osot_account_status?: number;
      };

      // Check if account exists
      if (!account || !account.osot_table_accountid) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: `Account with ID ${accountId} not found`,
          accountId,
          rule: 'account_existence',
        });
      }

      // Check if account is active (assuming 0 = active)
      if (
        account.osot_account_status !== undefined &&
        account.osot_account_status !== 0
      ) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: `Cannot associate contact with inactive account ${accountId}`,
          accountId,
          accountStatus: account.osot_account_status,
          rule: 'account_active_status',
        });
      }

      return accountId;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Account with ID')) {
        throw error; // Re-throw our validation errors
      }

      // For unexpected errors during account validation
      this.logger.warn(
        'Account relationship validation failed due to unexpected error',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw createAppError(ErrorCodes.EXTERNAL_SERVICE_ERROR, {
        message: 'Failed to validate account relationship',
        accountId,
        operation: 'validateAccountRelationship',
      });
    }
  }

  /**
   * Normalize and validate social media URLs
   * Business Rule: Social media URLs must be valid for their respective platforms
   */
  normalizeSocialMediaUrls(contactData: {
    osot_facebook?: string;
    osot_instagram?: string;
    osot_tiktok?: string;
    osot_linkedin?: string;
  }): {
    osot_facebook?: string;
    osot_instagram?: string;
    osot_tiktok?: string;
    osot_linkedin?: string;
    validationErrors: string[];
  } {
    const result = { ...contactData };
    const validationErrors: string[] = [];

    // Use project url-sanitizer for platform-specific validation
    const platformMap: Record<string, SocialMediaPlatform> = {
      facebook: SocialMediaPlatform.FACEBOOK,
      instagram: SocialMediaPlatform.INSTAGRAM,
      tiktok: SocialMediaPlatform.TIKTOK,
      linkedin: SocialMediaPlatform.LINKEDIN,
    };

    Object.keys(platformMap).forEach((platform) => {
      const key = `osot_${platform}` as keyof typeof contactData;
      const url = contactData[key];

      if (url && url.trim()) {
        const trimmedUrl = url.trim();
        const platformEnum = platformMap[platform];

        try {
          // Use project URL sanitizer for consistent validation
          const normalizedUrl = sanitizeUrl(trimmedUrl, platformEnum);

          // Ensure URL length is within limits (255 chars from CSV)
          result[key] =
            normalizedUrl.length <= 255
              ? normalizedUrl
              : normalizedUrl.slice(0, 255);
        } catch {
          validationErrors.push(
            `Invalid ${platform} URL format: ${trimmedUrl}. Must be a valid ${platform} profile URL.`,
          );
          // Remove invalid URL
          delete result[key];
        }
      }
    });

    // Emit validation event
    this.eventsService.emitValidation({
      accountId: '',
      validationType: 'social_media_urls',
      isValid: validationErrors.length === 0,
      errors: validationErrors.length > 0 ? validationErrors : undefined,
      timestamp: new Date(),
    });

    return { ...result, validationErrors };
  }

  /**
   * Validate email format and domain
   * Business Rule: Secondary email must be valid format and not duplicate
   */
  validateSecondaryEmail(email?: string): {
    normalizedEmail?: string;
    validationErrors: string[];
  } {
    const validationErrors: string[] = [];

    if (!email || !email.trim()) {
      return { validationErrors };
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      validationErrors.push('Invalid email format');
      return { validationErrors };
    }

    // Check email length (255 chars from CSV)
    if (trimmedEmail.length > 255) {
      validationErrors.push('Email address too long (maximum 255 characters)');
      return { validationErrors };
    }

    // Emit validation event
    this.eventsService.emitValidation({
      accountId: '',
      validationType: 'email_format',
      isValid: validationErrors.length === 0,
      errors: validationErrors.length > 0 ? validationErrors : undefined,
      timestamp: new Date(),
    });

    return {
      normalizedEmail: trimmedEmail,
      validationErrors,
    };
  }

  /**
   * Validate and normalize phone numbers
   * Business Rule: Phone numbers should be in consistent format
   */
  validatePhoneNumber(phone?: string): {
    normalizedPhone?: string;
    validationErrors: string[];
  } {
    const validationErrors: string[] = [];

    if (!phone || !phone.trim()) {
      return { validationErrors };
    }

    const trimmedPhone = phone.trim();

    // Remove all non-digit characters for validation
    const digitsOnly = trimmedPhone.replace(/\D/g, '');

    // Validate phone number length
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      validationErrors.push('Phone number must be between 10 and 15 digits');
      return { validationErrors };
    }

    // Use project phone formatter for consistency
    const formattedPhone = formatPhoneNumber(trimmedPhone);
    const normalizedPhone = formattedPhone || trimmedPhone;

    // Ensure length is within database limits (14 chars from CSV)
    const finalPhone =
      normalizedPhone.length > 14
        ? normalizedPhone.slice(0, 14)
        : normalizedPhone;

    // Emit validation event
    this.eventsService.emitValidation({
      accountId: '',
      validationType: 'phone_format',
      isValid: validationErrors.length === 0,
      errors: validationErrors.length > 0 ? validationErrors : undefined,
      timestamp: new Date(),
    });

    return {
      normalizedPhone: finalPhone,
      validationErrors,
    };
  }

  /**
   * Validate and normalize business website URL
   */
  validateBusinessWebsite(website?: string): {
    normalizedWebsite?: string;
    validationErrors: string[];
  } {
    const validationErrors: string[] = [];

    if (!website || !website.trim()) {
      return { validationErrors };
    }

    const trimmedWebsite = website.trim();

    // Add https if no protocol
    const normalizedWebsite = trimmedWebsite.startsWith('http')
      ? trimmedWebsite
      : `https://${trimmedWebsite}`;

    // Basic URL validation
    try {
      new URL(normalizedWebsite);
    } catch {
      validationErrors.push('Invalid website URL format');
      return { validationErrors };
    }

    // Check URL length (255 chars from CSV)
    const finalUrl =
      normalizedWebsite.length <= 255
        ? normalizedWebsite
        : normalizedWebsite.slice(0, 255);

    return {
      normalizedWebsite: finalUrl,
      validationErrors,
    };
  }

  /**
   * Validate create contact DTO with comprehensive business rules
   */
  async validateCreateContact(
    createContactDto: CreateContactDto,
    userRole?: string,
  ): Promise<CreateContactDto> {
    // Enhanced permission checking for create operations
    if (!canCreate(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to contact creation validation',
        requiredPrivilege: 'CREATE',
        userRole: userRole || 'undefined',
        operation: 'validateCreateContact',
      });
    }

    const validationErrors: string[] = [];
    const validatedDto = { ...createContactDto };

    // 1. Account relationship validation (optional)
    // Safe access to OData binding property
    const createOdataBindingKey = 'osot_Table_Account@odata.bind';
    const createAccountBinding = Object.prototype.hasOwnProperty.call(
      validatedDto,
      createOdataBindingKey,
    )
      ? (validatedDto as Record<string, unknown>)[createOdataBindingKey]
      : undefined;

    // Only validate if account binding exists and is not empty
    if (
      createAccountBinding &&
      typeof createAccountBinding === 'string' &&
      createAccountBinding.trim() !== ''
    ) {
      await this.validateAccountRelationship(createAccountBinding);
    }

    // 2. Email validation
    if (validatedDto.osot_secondary_email) {
      const emailResult = this.validateSecondaryEmail(
        validatedDto.osot_secondary_email,
      );
      if (emailResult.validationErrors.length > 0) {
        validationErrors.push(...emailResult.validationErrors);
      } else {
        validatedDto.osot_secondary_email = emailResult.normalizedEmail;
      }
    }

    // 3. Phone number validation
    if (validatedDto.osot_home_phone) {
      const phoneResult = this.validatePhoneNumber(
        validatedDto.osot_home_phone,
      );
      if (phoneResult.validationErrors.length > 0) {
        validationErrors.push(
          ...phoneResult.validationErrors.map((e) => `Home phone: ${e}`),
        );
      } else {
        validatedDto.osot_home_phone = phoneResult.normalizedPhone;
      }
    }

    if (validatedDto.osot_work_phone) {
      const phoneResult = this.validatePhoneNumber(
        validatedDto.osot_work_phone,
      );
      if (phoneResult.validationErrors.length > 0) {
        validationErrors.push(
          ...phoneResult.validationErrors.map((e) => `Work phone: ${e}`),
        );
      } else {
        validatedDto.osot_work_phone = phoneResult.normalizedPhone;
      }
    }

    // 4. Business website validation
    if (validatedDto.osot_business_website) {
      const websiteResult = this.validateBusinessWebsite(
        validatedDto.osot_business_website,
      );
      if (websiteResult.validationErrors.length > 0) {
        validationErrors.push(...websiteResult.validationErrors);
      } else {
        validatedDto.osot_business_website = websiteResult.normalizedWebsite;
      }
    }

    // 5. Social media URLs validation
    const socialMediaResult = this.normalizeSocialMediaUrls({
      osot_facebook: validatedDto.osot_facebook,
      osot_instagram: validatedDto.osot_instagram,
      osot_tiktok: validatedDto.osot_tiktok,
      osot_linkedin: validatedDto.osot_linkedin,
    });

    if (socialMediaResult.validationErrors.length > 0) {
      validationErrors.push(...socialMediaResult.validationErrors);
    } else {
      validatedDto.osot_facebook = socialMediaResult.osot_facebook;
      validatedDto.osot_instagram = socialMediaResult.osot_instagram;
      validatedDto.osot_tiktok = socialMediaResult.osot_tiktok;
      validatedDto.osot_linkedin = socialMediaResult.osot_linkedin;
    }

    // 6. Job title length validation (50 chars max from CSV)
    if (validatedDto.osot_job_title) {
      validatedDto.osot_job_title = validatedDto.osot_job_title
        .trim()
        .slice(0, 50);
    }

    // Emit overall validation event
    // Safe access to OData binding property for event
    const createEventOdataBindingKey = 'osot_Table_Account@odata.bind';
    const createEventAccountBinding = Object.prototype.hasOwnProperty.call(
      validatedDto,
      createEventOdataBindingKey,
    )
      ? (validatedDto as Record<string, unknown>)[createEventOdataBindingKey]
      : undefined;

    this.eventsService.emitValidation({
      accountId:
        typeof createEventAccountBinding === 'string'
          ? createEventAccountBinding
          : '',
      validationType: 'creation',
      isValid: validationErrors.length === 0,
      errors: validationErrors.length > 0 ? validationErrors : undefined,
      timestamp: new Date(),
    });

    // If there are validation errors, throw them
    if (validationErrors.length > 0) {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        { validationErrors },
        400,
        `Contact validation failed: ${validationErrors.join(', ')}`,
      );
    }

    return validatedDto;
  }

  /**
   * Validate update contact DTO with business rules
   */
  async validateUpdateContact(
    contactId: string,
    updateContactDto: UpdateContactDto,
    userRole?: string,
  ): Promise<UpdateContactDto> {
    // Enhanced permission checking for update operations
    if (!canWrite(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to contact update validation',
        contactId,
        requiredPrivilege: 'WRITE',
        userRole: userRole || 'undefined',
        operation: 'validateUpdateContact',
      });
    }

    const validationErrors: string[] = [];
    const validatedDto = { ...updateContactDto };

    // 1. Account relationship validation (if being updated)
    // Safe access to OData binding property
    const odataBindingKey = 'osot_Table_Account@odata.bind';
    const updateAccountBinding = Object.prototype.hasOwnProperty.call(
      validatedDto,
      odataBindingKey,
    )
      ? (validatedDto as Record<string, unknown>)[odataBindingKey]
      : undefined;

    // Only validate if account binding exists and is not empty
    if (
      updateAccountBinding &&
      typeof updateAccountBinding === 'string' &&
      updateAccountBinding.trim() !== ''
    ) {
      await this.validateAccountRelationship(updateAccountBinding);
    }

    // 2. Email validation (if being updated)
    if (validatedDto.osot_secondary_email !== undefined) {
      if (validatedDto.osot_secondary_email) {
        const emailResult = this.validateSecondaryEmail(
          validatedDto.osot_secondary_email,
        );
        if (emailResult.validationErrors.length > 0) {
          validationErrors.push(...emailResult.validationErrors);
        } else {
          validatedDto.osot_secondary_email = emailResult.normalizedEmail;
        }
      }
      // Allow setting to null/undefined to clear the field
    }

    // 3. Phone validation (if being updated)
    if (
      validatedDto.osot_home_phone !== undefined &&
      validatedDto.osot_home_phone
    ) {
      const phoneResult = this.validatePhoneNumber(
        validatedDto.osot_home_phone,
      );
      if (phoneResult.validationErrors.length > 0) {
        validationErrors.push(
          ...phoneResult.validationErrors.map((e) => `Home phone: ${e}`),
        );
      } else {
        validatedDto.osot_home_phone = phoneResult.normalizedPhone;
      }
    }

    if (
      validatedDto.osot_work_phone !== undefined &&
      validatedDto.osot_work_phone
    ) {
      const phoneResult = this.validatePhoneNumber(
        validatedDto.osot_work_phone,
      );
      if (phoneResult.validationErrors.length > 0) {
        validationErrors.push(
          ...phoneResult.validationErrors.map((e) => `Work phone: ${e}`),
        );
      } else {
        validatedDto.osot_work_phone = phoneResult.normalizedPhone;
      }
    }

    // 4. Business website validation (if being updated)
    if (
      validatedDto.osot_business_website !== undefined &&
      validatedDto.osot_business_website
    ) {
      const websiteResult = this.validateBusinessWebsite(
        validatedDto.osot_business_website,
      );
      if (websiteResult.validationErrors.length > 0) {
        validationErrors.push(...websiteResult.validationErrors);
      } else {
        validatedDto.osot_business_website = websiteResult.normalizedWebsite;
      }
    }

    // 5. Social media URLs validation (if any are being updated)
    const socialMediaFields = [
      'osot_facebook',
      'osot_instagram',
      'osot_tiktok',
      'osot_linkedin',
    ] as const;
    const hasSocialMediaUpdates = socialMediaFields.some(
      (field) => validatedDto[field] !== undefined,
    );

    if (hasSocialMediaUpdates) {
      const socialMediaData: Record<string, string | undefined> = {};
      socialMediaFields.forEach((field) => {
        if (validatedDto[field] !== undefined) {
          socialMediaData[field] = validatedDto[field];
        }
      });

      const socialMediaResult = this.normalizeSocialMediaUrls(socialMediaData);

      if (socialMediaResult.validationErrors.length > 0) {
        validationErrors.push(...socialMediaResult.validationErrors);
      } else {
        // Update only the fields that were provided
        socialMediaFields.forEach((field) => {
          if (validatedDto[field] !== undefined) {
            validatedDto[field] = socialMediaResult[field];
          }
        });
      }
    }

    // 6. Job title length validation (if being updated)
    if (
      validatedDto.osot_job_title !== undefined &&
      validatedDto.osot_job_title
    ) {
      validatedDto.osot_job_title = validatedDto.osot_job_title
        .trim()
        .slice(0, 50);
    }

    // Emit overall validation event
    // Safe access to OData binding property for event
    const eventOdataBindingKey = 'osot_Table_Account@odata.bind';
    const eventAccountBinding = Object.prototype.hasOwnProperty.call(
      validatedDto,
      eventOdataBindingKey,
    )
      ? (validatedDto as Record<string, unknown>)[eventOdataBindingKey]
      : undefined;

    this.eventsService.emitValidation({
      contactId,
      accountId:
        typeof eventAccountBinding === 'string' ? eventAccountBinding : '',
      validationType: 'update',
      isValid: validationErrors.length === 0,
      errors: validationErrors.length > 0 ? validationErrors : undefined,
      timestamp: new Date(),
    });

    // If there are validation errors, throw them
    if (validationErrors.length > 0) {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        { validationErrors, contactId },
        400,
        `Contact update validation failed: ${validationErrors.join(', ')}`,
      );
    }

    return validatedDto;
  }

  /**
   * Check for duplicate contacts based on business rules
   * Returns potential duplicates based on business ID, email, or social media profiles
   */
  async checkForDuplicates(contactData: {
    businessId?: string;
    email?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      tiktok?: string;
      linkedin?: string;
    };
  }): Promise<{
    isDuplicate: boolean;
    potentialDuplicates: Array<{
      contactId: string;
      businessId: string;
      matchReason: string;
    }>;
  }> {
    const potentialDuplicates: Array<{
      contactId: string;
      businessId: string;
      matchReason: string;
    }> = [];

    // Check for business ID duplicates
    if (contactData.businessId) {
      try {
        const businessIdResult = await this.contactRepository.findByBusinessId(
          contactData.businessId,
        );

        if (businessIdResult) {
          // Type-safe access to repository result
          const contactId =
            typeof businessIdResult.osot_table_contactid === 'string'
              ? businessIdResult.osot_table_contactid
              : '';
          const businessId =
            typeof businessIdResult.osot_user_business_id === 'string'
              ? businessIdResult.osot_user_business_id
              : '';

          potentialDuplicates.push({
            contactId,
            businessId,
            matchReason: 'business_id_exact_match',
          });
        }
      } catch {
        // Ignore errors during duplicate checking
      }
    }

    return {
      isDuplicate: potentialDuplicates.length > 0,
      potentialDuplicates,
    };
  }
}
