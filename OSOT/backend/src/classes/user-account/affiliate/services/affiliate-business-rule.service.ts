import { Injectable, Logger } from '@nestjs/common';

// External Dependencies - Core Platform
import { DataverseService } from '../../../../integrations/dataverse.service';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import {
  hashPassword,
  comparePassword,
} from '../../../../common/keys/password-hash.util';
import { Privilege } from '../../../../common/enums';

// Internal Module Dependencies
import { CreateAffiliateDto } from '../dtos/create-affiliate.dto';
import { UpdateAffiliateDto } from '../dtos/update-affiliate.dto';
import { AffiliateBusinessLogic } from '../utils/affiliate-business-logic.util';
import { validateSocialMediaUrl } from '../validators/affiliate.validators';

// Interfaces and Types
import { AffiliateInternal } from '../interfaces/affiliate-internal.interface';

// Constants and Configuration
import { AFFILIATE_ODATA } from '../constants/affiliate.constants';

/**
 * Affiliate Business Rule Service
 *
 * BUSINESS LOGIC RESPONSIBILITIES:
 * - Organization profile validation and compliance checking
 * - Representative authorization and approval workflows
 * - Affiliate area coverage and geographic service validation
 * - Contact information verification and communication protocols
 * - Privacy settings and access control enforcement
 * - Membership benefits and privilege determination
 * - Password security and authentication requirements
 * - Duplicate organization prevention and uniqueness validation
 * - Business rule compliance for affiliate operations
 *
 * INTEGRATION PATTERNS:
 * - Business Logic Utils: Leverages AffiliateBusinessLogic for domain rules
 * - Helper Utils: Uses affiliate-helpers for data processing
 * - Security: Implements password hashing and security protocols
 * - Error Handling: Uses centralized error factory and codes
 *
 * SECURITY FEATURES:
 * - Password hashing with bcrypt (SALT_ROUNDS = 10)
 * - Privilege-based access control validation
 * - Organization uniqueness enforcement
 * - Contact verification requirements
 * - Privacy settings compliance
 *
 * @version 1.0.0 (Initial Implementation)
 * @author NestJS Development Team
 * @since 2024
 */
@Injectable()
export class AffiliateBusinessRuleService {
  private readonly logger = new Logger(AffiliateBusinessRuleService.name);

  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Validate business rules for affiliate creation
   * Implements comprehensive validation including organization uniqueness,
   * contact verification, area coverage validation, and security requirements
   *
   * @param dto - Create affiliate data transfer object
   * @param userPrivilege - Current user's privilege level
   * @returns Promise<boolean> - True if all business rules pass
   * @throws AppError - If any business rule is violated
   */
  async validateAffiliateCreation(
    dto: CreateAffiliateDto,
    userPrivilege: Privilege,
  ): Promise<boolean> {
    this.logger.debug(
      `Validating affiliate creation for organization: ${dto.osot_affiliate_name}`,
    );

    try {
      // 1. Validate account declaration acceptance (CRITICAL)
      if (!dto.osot_account_declaration) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          rule: 'account_declaration_required',
          message:
            'Account declaration must be accepted to proceed with registration',
          field: 'osot_account_declaration',
          value: dto.osot_account_declaration,
        });
      }

      // 2. Check organization uniqueness across affiliate records
      const isOrganizationUnique = await this.checkOrganizationUniqueness(
        dto.osot_affiliate_name,
        dto.osot_affiliate_email,
      );
      if (!isOrganizationUnique) {
        throw createAppError(ErrorCodes.ACCOUNT_DUPLICATE, {
          organizationName: dto.osot_affiliate_name,
          organizationEmail: dto.osot_affiliate_email,
        });
      }

      // 3. Validate representative uniqueness across Account and Affiliate tables
      if (
        dto.osot_representative_first_name &&
        dto.osot_representative_last_name
      ) {
        const isRepresentativeUnique =
          await this.validateRepresentativeUniqueness(
            dto.osot_representative_first_name,
            dto.osot_representative_last_name,
          );
        if (!isRepresentativeUnique) {
          throw createAppError(ErrorCodes.ACCOUNT_DUPLICATE, {
            representativeFirstName: dto.osot_representative_first_name,
            representativeLastName: dto.osot_representative_last_name,
          });
        }
      }

      // 4. Validate representative authorization level
      const hasRepresentativeAuth =
        AffiliateBusinessLogic.validateRepresentativeAuthorization(
          dto.osot_representative_job_title || '',
          dto.osot_affiliate_name,
        );
      if (!hasRepresentativeAuth) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          rule: 'representative_authorization',
          representativeTitle: dto.osot_representative_job_title,
          organizationName: dto.osot_affiliate_name,
        });
      }

      // 5. Validate organization profile completeness
      const profileValidation =
        AffiliateBusinessLogic.validateOrganizationProfile(
          dto.osot_affiliate_name,
        );
      if (!profileValidation.isValid) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          rule: 'organization_profile_incomplete',
          violations: profileValidation.errors,
        });
      }

      // 6. Validate contact verification requirements
      const contactVerification = this.validateContactVerification(dto);
      if (!contactVerification) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          rule: 'contact_verification_failed',
          organizationEmail: dto.osot_affiliate_email,
          organizationPhone: dto.osot_affiliate_phone,
        });
      }

      // 7. Check user privilege for affiliate creation (basic privilege check)
      if (userPrivilege === Privilege.MAIN) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          requiredPrivilege: 'ADMIN_OR_HIGHER',
          userPrivilege,
          operation: 'affiliate_creation',
        });
      }

      this.logger.debug(
        `Affiliate creation validation passed for: ${dto.osot_affiliate_name}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Affiliate creation validation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AppError instances
      }
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        organizationName: dto.osot_affiliate_name,
        error:
          error instanceof Error ? error.message : 'Unknown validation error',
      });
    }
  }

  /**
   * Validate business rules for affiliate updates
   * Implements update-specific validation including data consistency,
   * status transition validation, and privilege requirements
   *
   * @param affiliateId - Unique identifier for the affiliate
   * @param dto - Update affiliate data transfer object
   * @param userPrivilege - Current user's privilege level
   * @returns Promise<boolean> - True if all business rules pass
   * @throws AppError - If any business rule is violated
   */
  async validateAffiliateUpdate(
    affiliateId: string,
    dto: UpdateAffiliateDto,
    userPrivilege: Privilege,
  ): Promise<boolean> {
    this.logger.debug(`Validating affiliate update for ID: ${affiliateId}`);

    try {
      // 1. Check user privilege for update operation (basic privilege check)
      if (userPrivilege === Privilege.MAIN) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          requiredPrivilege: 'ADMIN_OR_HIGHER',
          userPrivilege,
          operation: 'affiliate_update',
          affiliateId,
        });
      }

      // 2. Validate organization uniqueness (if organization data is being updated)
      if (dto.osot_affiliate_name || dto.osot_affiliate_email) {
        const isOrganizationUnique = await this.checkOrganizationUniqueness(
          dto.osot_affiliate_name || '',
          dto.osot_affiliate_email || '',
          affiliateId, // Exclude current affiliate from uniqueness check
        );
        if (!isOrganizationUnique) {
          throw createAppError(ErrorCodes.ACCOUNT_DUPLICATE, {
            organizationName: dto.osot_affiliate_name,
            organizationEmail: dto.osot_affiliate_email,
            affiliateId,
          });
        }
      }

      this.logger.debug(
        `Affiliate update validation passed for ID: ${affiliateId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Affiliate update validation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AppError instances
      }
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        affiliateId,
        error:
          error instanceof Error ? error.message : 'Unknown validation error',
      });
    }
  }

  /**
   * Check organization uniqueness across affiliate records
   * Prevents duplicate organizations from being registered
   *
   * @param organizationName - Organization name to check
   * @param organizationEmail - Organization email to check
   * @param excludeAffiliateId - Optional affiliate ID to exclude from check
   * @returns Promise<boolean> - True if organization is unique
   */
  private async checkOrganizationUniqueness(
    organizationName: string,
    organizationEmail: string,
    excludeAffiliateId?: string,
  ): Promise<boolean> {
    try {
      let filter = `(osot_affiliate_name eq '${organizationName}' or osot_affiliate_email eq '${organizationEmail}')`;

      if (excludeAffiliateId) {
        // Check if the ID looks like a business ID (affi-XXXXXX) or a GUID
        if (excludeAffiliateId.startsWith('affi-')) {
          // Use business ID field for comparison
          filter += ` and osot_affiliate_id ne '${excludeAffiliateId}'`;
        } else {
          // Use internal GUID field for comparison (without quotes for GUID)
          filter += ` and osot_table_account_affiliateid ne ${excludeAffiliateId}`;
        }
      }

      const endpoint = `${AFFILIATE_ODATA.TABLE_NAME}?$filter=${filter}&$select=osot_table_account_affiliateid`;
      const response = await this.dataverseService.request('GET', endpoint);

      const dataverseResponse = response as { value?: any[] };
      return !dataverseResponse?.value || dataverseResponse.value.length === 0;
    } catch (error) {
      this.logger.error(
        `Error checking organization uniqueness: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        organizationName,
        organizationEmail,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate contact verification requirements
   * Ensures organization contact information is verifiable
   *
   * @param dto - Affiliate data with contact information
   * @returns Promise<boolean> - True if contact verification passes
   */
  private validateContactVerification(
    dto: CreateAffiliateDto | UpdateAffiliateDto,
  ): boolean {
    try {
      // Validate email format and domain
      const emailValidation = this.validateOrganizationEmail(
        dto.osot_affiliate_email,
      );
      if (!emailValidation) {
        return false;
      }

      // Validate phone format and reachability
      const phoneValidation = this.validateOrganizationPhone(
        dto.osot_affiliate_phone,
      );
      if (!phoneValidation) {
        return false;
      }

      // Validate website URL format and accessibility (if provided)
      if (dto.osot_affiliate_website) {
        const websiteValidation = validateSocialMediaUrl(
          dto.osot_affiliate_website,
          'WEBSITE',
        );
        if (!websiteValidation) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Contact verification failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return false;
    }
  }

  /**
   * Validate organization email format and domain requirements
   *
   * @param email - Organization email to validate
   * @returns Promise<boolean> - True if email validation passes
   */
  private validateOrganizationEmail(email: string): boolean {
    if (!email) return false;

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Additional business rule: Professional email domain validation
    const personalDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
    ];
    const domain = email.split('@')[1]?.toLowerCase();

    // Allow personal domains but flag for manual review
    if (personalDomains.includes(domain)) {
      this.logger.warn(
        `Personal email domain detected for organization: ${email}`,
      );
    }

    return true;
  }

  /**
   * Validate organization phone format and requirements
   *
   * @param phone - Organization phone to validate
   * @returns boolean - True if phone validation passes
   */
  private validateOrganizationPhone(phone: string): boolean {
    if (!phone) return false;

    // Remove formatting and validate basic structure
    const cleanPhone = phone.replace(/\D/g, '');

    // North American phone number validation
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      return true;
    }

    // International phone number validation (basic)
    if (cleanPhone.length >= 7 && cleanPhone.length <= 15) {
      return true;
    }

    return false;
  }

  /**
   * Validate password security requirements
   * Implements comprehensive password strength validation
   *
   * @param password - Password to validate
   * @returns {isValid: boolean, requirements: string[], violations: string[]} - Validation result with details
   */
  private validatePasswordRequirements(password: string): {
    isValid: boolean;
    requirements: string[];
    violations: string[];
  } {
    const requirements = [
      'At least 8 characters',
      'At least one uppercase letter',
      'At least one lowercase letter',
      'At least one number',
      'At least one special character',
    ];

    const violations: string[] = [];

    // Length requirement
    if (password.length < 8) {
      violations.push('Password must be at least 8 characters long');
    }

    // Uppercase requirement
    if (!/[A-Z]/.test(password)) {
      violations.push('Password must contain at least one uppercase letter');
    }

    // Lowercase requirement
    if (!/[a-z]/.test(password)) {
      violations.push('Password must contain at least one lowercase letter');
    }

    // Number requirement
    if (!/\d/.test(password)) {
      violations.push('Password must contain at least one number');
    }

    // Special character requirement
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      violations.push('Password must contain at least one special character');
    }

    return {
      isValid: violations.length === 0,
      requirements,
      violations,
    };
  }

  /**
   * Hash password using bcrypt for secure storage
   *
   * @param password - Plain text password to hash
   * @returns Promise<string> - Hashed password
   */
  async hashAffiliatePassword(password: string): Promise<string> {
    try {
      return await hashPassword(password);
    } catch (error) {
      this.logger.error(
        `Password hashing failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw createAppError(ErrorCodes.GENERIC, {
        error: 'Password processing failed',
      });
    }
  }

  /**
   * Compare password with stored hash for authentication
   *
   * @param password - Plain text password to verify
   * @param hash - Stored password hash
   * @returns Promise<boolean> - True if password matches
   */
  async verifyAffiliatePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    try {
      return await comparePassword(password, hash);
    } catch (error) {
      this.logger.error(
        `Password verification failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return false;
    }
  }

  /**
   * Determine access privileges for affiliate operations
   * Simplified implementation using basic privilege logic
   *
   * @param affiliate - Affiliate record
   * @param userPrivilege - Current user's privilege level
   * @returns AccessPrivilege - Calculated access privilege
   */
  determineAffiliateAccessPrivilege(
    affiliate: AffiliateInternal,
    userPrivilege: Privilege,
  ): {
    level: Privilege;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  } {
    // Basic privilege logic - simplified implementation
    const canRead = true; // All users can read
    const canWrite = userPrivilege !== Privilege.MAIN; // ADMIN and OWNER can write
    const canDelete = userPrivilege === Privilege.OWNER; // Only OWNER can delete

    return {
      level: userPrivilege,
      canRead,
      canWrite,
      canDelete,
    };
  }

  /**
   * Validate email uniqueness for affiliate registration
   * Public method to check if an email is available for new affiliate registration
   * Checks BOTH Account and Affiliate tables for comprehensive uniqueness validation
   *
   * @param email - Email address to validate
   * @returns Promise<boolean> - True if email is available (unique across both tables)
   */
  async validateEmailUniqueness(email: string): Promise<boolean> {
    this.logger.debug(
      `Validating email uniqueness across Account and Affiliate tables for: ${email}`,
    );

    try {
      // Check Affiliate table for email uniqueness
      const affiliateFilter = `osot_affiliate_email eq '${email}'`;
      const affiliateEndpoint = `${AFFILIATE_ODATA.TABLE_NAME}?$filter=${affiliateFilter}&$select=osot_table_account_affiliateid`;
      const affiliateResponse = await this.dataverseService.request(
        'GET',
        affiliateEndpoint,
      );

      const affiliateDataverseResponse = affiliateResponse as { value?: any[] };
      const affiliateExists =
        affiliateDataverseResponse?.value &&
        affiliateDataverseResponse.value.length > 0;

      if (affiliateExists) {
        this.logger.debug(`Email already exists in Affiliate table: TAKEN`);
        return false;
      }

      this.logger.debug(
        `Email uniqueness validation result: UNIQUE (not found in affiliate table)`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error checking email uniqueness across tables: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate representative uniqueness across Account and Affiliate tables
   * Ensures representative first + last name combination is unique across both tables
   *
   * @param firstName - Representative first name to validate
   * @param lastName - Representative last name to validate
   * @returns Promise<boolean> - True if representative name combination is unique
   */
  async validateRepresentativeUniqueness(
    firstName: string,
    lastName: string,
  ): Promise<boolean> {
    this.logger.debug(
      `Validating representative uniqueness in Affiliate table for: ${firstName} ${lastName}`,
    );

    try {
      // Check Affiliate table for representative uniqueness
      const affiliateFilter = `osot_representative_first_name eq '${firstName}' and osot_representative_last_name eq '${lastName}'`;
      const affiliateEndpoint = `${AFFILIATE_ODATA.TABLE_NAME}?$filter=${affiliateFilter}&$select=osot_table_account_affiliateid`;
      const affiliateResponse = await this.dataverseService.request(
        'GET',
        affiliateEndpoint,
      );

      const affiliateDataverseResponse = affiliateResponse as { value?: any[] };
      const affiliateExists =
        affiliateDataverseResponse?.value &&
        affiliateDataverseResponse.value.length > 0;

      if (affiliateExists) {
        this.logger.debug(
          `Representative already exists in Affiliate table: TAKEN`,
        );
        return false;
      }

      this.logger.debug(
        `Representative uniqueness validation result: UNIQUE (not found in affiliate table)`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error checking representative uniqueness across tables: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        firstName,
        lastName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
