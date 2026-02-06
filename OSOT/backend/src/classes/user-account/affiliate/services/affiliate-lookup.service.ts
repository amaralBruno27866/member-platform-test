import { Injectable, Logger } from '@nestjs/common';

// External Dependencies - Core Platform
import { DataverseService } from '../../../../integrations/dataverse.service';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege } from '../../../../common/enums';
import {
  AffiliateArea,
  getAffiliateAreaDisplayName,
} from '../../../../common/enums/affiliate-area.enum';
import {
  Province,
  getProvinceDisplayName,
} from '../../../../common/enums/provinces.enum';
import {
  Country,
  getCountryDisplayName,
} from '../../../../common/enums/countries.enum';
import { City, getCityDisplayName } from '../../../../common/enums/cities.enum';

// Internal Module Dependencies
import { AffiliateBusinessRuleService } from './affiliate-business-rule.service';

// Constants
import {
  AFFILIATE_ODATA,
  AFFILIATE_ACCOUNT_STATUS_LABELS,
} from '../constants/affiliate.constants';

// Interfaces and Types
import { AffiliateInternal } from '../interfaces/affiliate-internal.interface';

// Type definitions for Dataverse responses
interface DataverseResponse {
  value?: unknown[];
  '@odata.count'?: number;
}

interface DataversePayload {
  osot_table_account_affiliateid?: string; // Primary key
  osot_affiliate_id?: string; // Public business ID (e.g., affi-0000014)
  osot_affiliate_name?: string;
  osot_affiliate_area?: number;
  osot_affiliate_email?: string;
  osot_affiliate_phone?: string;
  osot_affiliate_website?: string;
  osot_representative_first_name?: string;
  osot_representative_last_name?: string;
  osot_representative_job_title?: string;
  osot_affiliate_address_1?: string;
  osot_affiliate_address_2?: string;
  osot_affiliate_city?: string | number; // Can be enum value
  osot_affiliate_province?: string | number; // Can be enum value
  osot_affiliate_country?: string | number; // Can be enum value
  osot_affiliate_postal_code?: string;
  osot_other_city?: string; // Other city text field
  osot_other_province_state?: string; // Other province/state text field
  osot_affiliate_facebook?: string;
  osot_affiliate_instagram?: string;
  osot_affiliate_tiktok?: string;
  osot_affiliate_linkedin?: string;
  osot_account_declaration?: boolean;
  osot_password?: string;
  statuscode?: number;
  [key: string]: unknown;
}

/**
 * Enhanced affiliate response that includes human-readable labels instead of enum values
 */
interface EnhancedAffiliateResponse
  extends Omit<
    Partial<AffiliateInternal>,
    | 'osot_affiliate_area'
    | 'osot_affiliate_province'
    | 'osot_affiliate_country'
    | 'osot_affiliate_city'
    | 'osot_account_status'
  > {
  osot_affiliate_area?: string;
  osot_affiliate_province?: string;
  osot_affiliate_country?: string;
  osot_affiliate_city?: string;
  osot_account_status?: string;
}

/**
 * Affiliate Lookup Service
 *
 * LOOKUP OPERATION RESPONSIBILITIES:
 * - Secure search operations with privilege-based access control
 * - Type-safe query construction and response handling
 * - Input validation and sanitization for all lookup parameters
 * - Geographic and categorical filtering with performance optimization
 * - Status-based queries with proper enumeration handling
 * - Email and name-based lookups with collision detection
 *
 * SECURITY ARCHITECTURE:
 * - Privilege-based field filtering using Dataverse enum hierarchy
 * - Input sanitization against injection attacks
 * - Privilege verification via business rule service integration
 * - Response filtering based on user access levels
 * - Safe string conversion for OData query parameters
 * - GUID and email format validation
 *
 * INTEGRATION FEATURES:
 * - DataverseService integration for consistent API communication
 * - Business rule service integration for access control validation
 * - Type-safe response mapping with unknown data handling
 * - Comprehensive logging for audit trails and debugging
 * - Error handling with structured error codes
 * - Performance optimization through selective field queries
 *
 * @follows Enterprise Security Standards, Type Safety Patterns
 * @integrates DataverseService, AffiliateBusinessRuleService
 * @author OSOT Development Team
 * @version 1.0.0 - Initial Implementation
 */
@Injectable()
export class AffiliateLookupService {
  private readonly logger = new Logger(AffiliateLookupService.name);

  constructor(
    private readonly dataverseService: DataverseService,
    private readonly businessRuleService: AffiliateBusinessRuleService,
  ) {
    this.logger.log('Affiliate Lookup Service initialized successfully');
  }

  // Type guards for runtime type checking
  private isDataverseResponse(obj: unknown): obj is DataverseResponse {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      (Array.isArray((obj as DataverseResponse).value) ||
        typeof (obj as DataverseResponse)['@odata.count'] === 'number')
    );
  }

  private isAffiliateRecord(obj: unknown): obj is DataversePayload {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as DataversePayload).osot_affiliate_name === 'string'
    );
  }

  // Helper methods for safe data extraction
  private extractAffiliateData(obj: unknown): DataversePayload | null {
    if (!this.isAffiliateRecord(obj)) {
      return null;
    }
    return obj;
  }

  /**
   * Safely convert a value to string for OData queries
   */
  private safeStringifyForOData(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      // Escape single quotes for OData
      return value.replace(/'/g, "''");
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    // For objects, convert to JSON string
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value).replace(/'/g, "''");
      } catch {
        return '[object Object]';
      }
    }

    // For primitives like symbol, bigint, etc.
    if (typeof value === 'symbol') {
      return value.description || 'Symbol()';
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    // Fallback for any unexpected types
    return '[Unknown Type]';
  }

  /**
   * Validate and sanitize email input
   */
  private validateAndSanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        {
          field: 'email',
          message: 'Email is required and must be a string',
        },
        400,
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        {
          field: 'email',
          message: 'Invalid email format',
        },
        400,
      );
    }

    return email.toLowerCase().trim();
  }

  /**
   * Validate GUID format
   */
  private validateGuid(guid: string): string {
    if (!guid || typeof guid !== 'string') {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        {
          field: 'guid',
          message: 'GUID is required and must be a string',
        },
        400,
      );
    }

    // Basic GUID format validation
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!guidRegex.test(guid)) {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        {
          field: 'guid',
          message: 'Invalid GUID format',
        },
        400,
      );
    }

    return guid.toLowerCase();
  }

  /**
   * Validate affiliate name
   */
  private validateAffiliateName(name: string): string {
    if (!name || typeof name !== 'string') {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        {
          field: 'name',
          message: 'Affiliate name is required and must be a string',
        },
        400,
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        {
          field: 'name',
          message: 'Affiliate name must be at least 2 characters long',
        },
        400,
      );
    }

    return trimmedName;
  }

  /**
   * Filter response fields based on user privilege level
   */
  private filterResponseFields(
    data: DataversePayload,
    userPrivilege?: Privilege,
  ): Partial<DataversePayload> {
    const publicFields = [
      'osot_affiliate_id', // Public business ID (e.g., affi-0000014) for user support
      'osot_affiliate_name',
      'osot_affiliate_area',
      'osot_affiliate_city',
      'osot_affiliate_province',
      'osot_affiliate_country',
      'osot_affiliate_website',
    ];

    const authenticatedFields = [
      ...publicFields,
      'osot_affiliate_email',
      'osot_affiliate_phone',
      'osot_affiliate_facebook',
      'osot_affiliate_instagram',
      'osot_affiliate_tiktok',
      'osot_affiliate_linkedin',
    ];

    const privilegedFields = [
      ...authenticatedFields,
      'osot_table_account_affiliateid', // Internal system ID - admin/owner only
      'osot_representative_first_name',
      'osot_representative_last_name',
      'osot_representative_job_title',
      'osot_affiliate_address_1',
      'osot_affiliate_address_2',
      'osot_affiliate_postal_code',
      'osot_account_declaration',
      'osot_password', // Only for owner access
      'statuscode',
    ];

    let allowedFields: string[] = [];

    // Determine allowed fields based on user privilege
    if (!userPrivilege) {
      // Public access (non-authenticated users)
      allowedFields = publicFields;
    } else if (userPrivilege === Privilege.MAIN) {
      // Authenticated users
      allowedFields = authenticatedFields;
    } else if (userPrivilege === Privilege.ADMIN) {
      // Admin users get privileged access
      allowedFields = privilegedFields;
    } else if (userPrivilege === Privilege.OWNER) {
      // Owner gets full access
      allowedFields = privilegedFields;
    } else {
      // Fallback to public fields
      allowedFields = publicFields;
    }

    const filteredData: Partial<DataversePayload> = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        filteredData[field] = data[field];
      }
    }

    return filteredData;
  }

  /**
   * Check if user has read privileges
   */
  private canRead(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.OWNER ||
      userPrivilege === Privilege.ADMIN ||
      userPrivilege === Privilege.MAIN
    );
  }

  /**
   * Safely convert string or number to enum type
   */
  private safeEnumConversion<T>(
    value: string | number | undefined,
  ): T | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    // Return the value as is, letting TypeScript handle the conversion
    // This is safer than using 'as any' and maintains type information
    return value as unknown as T;
  }

  /**
   * Convert DataversePayload to EnhancedAffiliateResponse with labels
   */
  private mapToAffiliateInternal(
    data: Partial<DataversePayload>,
  ): EnhancedAffiliateResponse {
    const affiliate: EnhancedAffiliateResponse = {};

    // Primary key
    if (data.osot_table_account_affiliateid) {
      affiliate.osot_table_account_affiliateid =
        data.osot_table_account_affiliateid;
    }

    // Public business ID for user support
    if (data.osot_affiliate_id) {
      affiliate.osot_affiliate_id = data.osot_affiliate_id;
    }

    // Basic affiliate information
    if (data.osot_affiliate_name) {
      affiliate.osot_affiliate_name = data.osot_affiliate_name;
    }
    if (data.osot_affiliate_area) {
      // Store human-readable label only
      affiliate.osot_affiliate_area =
        typeof data.osot_affiliate_area === 'number'
          ? getAffiliateAreaDisplayName(
              data.osot_affiliate_area as AffiliateArea,
            ) || `Unknown Area (${data.osot_affiliate_area})`
          : String(data.osot_affiliate_area);
    }
    if (data.osot_affiliate_email) {
      affiliate.osot_affiliate_email = data.osot_affiliate_email;
    }
    if (data.osot_affiliate_phone) {
      affiliate.osot_affiliate_phone = data.osot_affiliate_phone;
    }
    if (data.osot_affiliate_website) {
      affiliate.osot_affiliate_website = data.osot_affiliate_website;
    }

    // Representative information
    if (data.osot_representative_first_name) {
      affiliate.osot_representative_first_name =
        data.osot_representative_first_name;
    }
    if (data.osot_representative_last_name) {
      affiliate.osot_representative_last_name =
        data.osot_representative_last_name;
    }
    if (data.osot_representative_job_title) {
      affiliate.osot_representative_job_title =
        data.osot_representative_job_title;
    }

    // Address information
    if (data.osot_affiliate_address_1) {
      affiliate.osot_affiliate_address_1 = data.osot_affiliate_address_1;
    }
    if (data.osot_affiliate_address_2) {
      affiliate.osot_affiliate_address_2 = data.osot_affiliate_address_2;
    }
    if (data.osot_affiliate_city) {
      // Store human-readable city name
      affiliate.osot_affiliate_city =
        typeof data.osot_affiliate_city === 'number'
          ? getCityDisplayName(data.osot_affiliate_city as City)
          : String(data.osot_affiliate_city);
    }
    if (data.osot_affiliate_province) {
      // Store human-readable province name
      affiliate.osot_affiliate_province =
        typeof data.osot_affiliate_province === 'number'
          ? getProvinceDisplayName(data.osot_affiliate_province as Province)
          : String(data.osot_affiliate_province);
    }
    if (data.osot_affiliate_country) {
      // Store human-readable country name
      affiliate.osot_affiliate_country =
        typeof data.osot_affiliate_country === 'number'
          ? getCountryDisplayName(data.osot_affiliate_country as Country)
          : String(data.osot_affiliate_country);
    }
    if (data.osot_affiliate_postal_code) {
      affiliate.osot_affiliate_postal_code = data.osot_affiliate_postal_code;
    }
    if (data.osot_other_city) {
      affiliate.osot_other_city = data.osot_other_city;
    }
    if (data.osot_other_province_state) {
      affiliate.osot_other_province_state = data.osot_other_province_state;
    }

    // Social media information
    if (data.osot_affiliate_facebook) {
      affiliate.osot_affiliate_facebook = data.osot_affiliate_facebook;
    }
    if (data.osot_affiliate_instagram) {
      affiliate.osot_affiliate_instagram = data.osot_affiliate_instagram;
    }
    if (data.osot_affiliate_tiktok) {
      affiliate.osot_affiliate_tiktok = data.osot_affiliate_tiktok;
    }
    if (data.osot_affiliate_linkedin) {
      affiliate.osot_affiliate_linkedin = data.osot_affiliate_linkedin;
    }

    // Account information
    if (data.osot_account_declaration !== undefined) {
      affiliate.osot_account_declaration = data.osot_account_declaration;
    }
    if (data.osot_password) {
      affiliate.osot_password = data.osot_password;
    }
    if (data.statuscode) {
      // Store human-readable status label
      affiliate.osot_account_status =
        typeof data.statuscode === 'number'
          ? AFFILIATE_ACCOUNT_STATUS_LABELS[
              data.statuscode as keyof typeof AFFILIATE_ACCOUNT_STATUS_LABELS
            ] || `Unknown Status (${data.statuscode})`
          : String(data.statuscode);
    }

    return affiliate;
  }

  /**
   * Find affiliate by business ID (e.g., affi-0000016)
   * @param businessId - Public business ID to search for
   * @param userPrivilege - Current user's privilege level
   * @returns Promise<EnhancedAffiliateResponse | null>
   */
  async findByBusinessId(
    businessId: string,
    userPrivilege?: Privilege,
  ): Promise<EnhancedAffiliateResponse | null> {
    const operationId = `lookup_business_id_${Date.now()}`;

    this.logger.log(`Starting business ID lookup - Operation: ${operationId}`, {
      operation: 'findByBusinessId',
      operationId,
      userPrivilege: userPrivilege || 'undefined',
      timestamp: new Date().toISOString(),
    });

    try {
      // Validate input
      if (!businessId || typeof businessId !== 'string') {
        throw createAppError(
          ErrorCodes.VALIDATION_ERROR,
          {
            field: 'businessId',
            message: 'Business ID is required and must be a string',
          },
          400,
        );
      }

      const trimmedBusinessId = businessId.trim();
      if (trimmedBusinessId.length < 1) {
        throw createAppError(
          ErrorCodes.VALIDATION_ERROR,
          {
            field: 'businessId',
            message: 'Business ID cannot be empty',
          },
          400,
        );
      }

      // Check read privileges for authenticated/privileged access
      if (
        userPrivilege && // Only check permissions if user privilege is provided
        !this.canRead(userPrivilege)
      ) {
        this.logger.warn(
          `Business ID lookup denied - insufficient privileges - Operation: ${operationId}`,
          {
            operation: 'findByBusinessId',
            operationId,
            requiredPrivilege: 'READ',
            userPrivilege: userPrivilege || 'undefined',
            error: 'PERMISSION_DENIED',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(
          ErrorCodes.PERMISSION_DENIED,
          {
            operation: 'findByBusinessId',
            message: 'Insufficient privileges for affiliate business ID lookup',
            requiredPrivilege: 'READ',
            userPrivilege: userPrivilege || 'undefined',
          },
          403,
        );
      }

      // Construct OData query with all required fields
      const businessIdFilter = `osot_affiliate_id eq '${this.safeStringifyForOData(trimmedBusinessId)}'`;
      const selectFields = [
        'osot_table_account_affiliateid',
        'osot_affiliate_id', // Public business ID for user support
        'osot_affiliate_name',
        'osot_affiliate_area',
        'osot_affiliate_email',
        'osot_affiliate_phone',
        'osot_affiliate_website',
        'osot_representative_first_name',
        'osot_representative_last_name',
        'osot_representative_job_title',
        'osot_affiliate_address_1',
        'osot_affiliate_address_2',
        'osot_affiliate_city',
        'osot_affiliate_province',
        'osot_affiliate_country',
        'osot_affiliate_postal_code',
        'osot_affiliate_facebook',
        'osot_affiliate_instagram',
        'osot_affiliate_tiktok',
        'osot_affiliate_linkedin',
        'osot_account_declaration',
        'osot_password',
        'statuscode',
      ].join(',');
      const query = `${AFFILIATE_ODATA.TABLE_NAME}?$filter=${businessIdFilter}&$select=${selectFields}`;

      this.logger.debug(
        `Executing Dataverse query - Operation: ${operationId}`,
        {
          operation: 'findByBusinessId',
          operationId,
          query: query.replace(trimmedBusinessId, '[REDACTED]'),
          timestamp: new Date().toISOString(),
        },
      );

      // Execute query
      const response = await this.dataverseService.request('GET', query);

      if (!this.isDataverseResponse(response)) {
        this.logger.error(
          `Invalid Dataverse response format - Operation: ${operationId}`,
          {
            operation: 'findByBusinessId',
            operationId,
            error: 'INVALID_RESPONSE_FORMAT',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(
          ErrorCodes.EXTERNAL_SERVICE_ERROR,
          {
            operation: 'findByBusinessId',
            message: 'Invalid response format from Dataverse',
            service: 'DataverseService',
          },
          500,
        );
      }

      // Process response
      const affiliateRecords = response.value || [];

      if (affiliateRecords.length === 0) {
        this.logger.log(
          `No affiliate found with business ID - Operation: ${operationId}`,
          {
            operation: 'findByBusinessId',
            operationId,
            result: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        );
        return null;
      }

      if (affiliateRecords.length > 1) {
        this.logger.warn(
          `Multiple affiliates found with same business ID - Operation: ${operationId}`,
          {
            operation: 'findByBusinessId',
            operationId,
            count: affiliateRecords.length,
            warning: 'BUSINESS_ID_COLLISION',
            timestamp: new Date().toISOString(),
          },
        );
      }

      // Use first matching record
      const affiliateData = this.extractAffiliateData(affiliateRecords[0]);
      if (!affiliateData) {
        this.logger.error(
          `Failed to extract affiliate data - Operation: ${operationId}`,
          {
            operation: 'findByBusinessId',
            operationId,
            error: 'DATA_EXTRACTION_FAILED',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(
          ErrorCodes.INTERNAL_ERROR,
          {
            operation: 'findByBusinessId',
            message: 'Failed to process affiliate data',
          },
          500,
        );
      }

      // Apply security filtering
      const filteredData = this.filterResponseFields(
        affiliateData,
        userPrivilege,
      );

      // Convert to internal format
      const affiliate = this.mapToAffiliateInternal(filteredData);

      this.logger.log(
        `Business ID lookup completed successfully - Operation: ${operationId}`,
        {
          operation: 'findByBusinessId',
          operationId,
          result: 'SUCCESS',
          fieldsReturned: Object.keys(affiliate).length,
          timestamp: new Date().toISOString(),
        },
      );

      return affiliate;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        // Re-throw known application errors
        throw error;
      }

      this.logger.error(
        `Unexpected error during business ID lookup - Operation: ${operationId}`,
        {
          operation: 'findByBusinessId',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(
        ErrorCodes.INTERNAL_ERROR,
        {
          operation: 'findByBusinessId',
          message: 'Unexpected error during affiliate business ID lookup',
          originalError:
            error instanceof Error ? error.message : 'Unknown error',
        },
        500,
      );
    }
  }

  /**
   * Find affiliate by email address
   * @param email - Affiliate email to search for
   * @param userPrivilege - Current user's privilege level
   * @returns Promise<EnhancedAffiliateResponse | null>
   */
  async findByEmail(
    email: string,
    userPrivilege?: Privilege,
  ): Promise<EnhancedAffiliateResponse | null> {
    const operationId = `lookup_email_${Date.now()}`;

    this.logger.log(`Starting email lookup - Operation: ${operationId}`, {
      operation: 'findByEmail',
      operationId,
      userPrivilege: userPrivilege || 'undefined',
      timestamp: new Date().toISOString(),
    });
    try {
      // Validate input
      const sanitizedEmail = this.validateAndSanitizeEmail(email);

      // Check read privileges for authenticated/privileged access
      if (
        userPrivilege && // Only check permissions if user privilege is provided
        !this.canRead(userPrivilege)
      ) {
        this.logger.warn(
          `Email lookup denied - insufficient privileges - Operation: ${operationId}`,
          {
            operation: 'findByEmail',
            operationId,
            requiredPrivilege: 'READ',
            userPrivilege: userPrivilege || 'undefined',
            error: 'PERMISSION_DENIED',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(
          ErrorCodes.PERMISSION_DENIED,
          {
            operation: 'findByEmail',
            message: 'Insufficient privileges for affiliate email lookup',
            requiredPrivilege: 'READ',
            userPrivilege: userPrivilege || 'undefined',
          },
          403,
        );
      }

      // Construct OData query with all required fields
      const emailFilter = `osot_affiliate_email eq '${this.safeStringifyForOData(sanitizedEmail)}'`;
      const selectFields = [
        'osot_table_account_affiliateid',
        'osot_affiliate_id', // Public business ID for user support
        'osot_affiliate_name',
        'osot_affiliate_area',
        'osot_affiliate_email',
        'osot_affiliate_phone',
        'osot_affiliate_website',
        'osot_representative_first_name',
        'osot_representative_last_name',
        'osot_representative_job_title',
        'osot_affiliate_address_1',
        'osot_affiliate_address_2',
        'osot_affiliate_city',
        'osot_affiliate_province',
        'osot_affiliate_country',
        'osot_affiliate_postal_code',
        'osot_affiliate_facebook',
        'osot_affiliate_instagram',
        'osot_affiliate_tiktok',
        'osot_affiliate_linkedin',
        'osot_account_declaration',
        'osot_password',
        'statuscode',
      ].join(',');
      const query = `${AFFILIATE_ODATA.TABLE_NAME}?$filter=${emailFilter}&$select=${selectFields}`;

      this.logger.debug(
        `Executing Dataverse query - Operation: ${operationId}`,
        {
          operation: 'findByEmail',
          operationId,
          query: query.replace(sanitizedEmail, '[REDACTED]'),
          timestamp: new Date().toISOString(),
        },
      );

      // Execute query
      const response = await this.dataverseService.request('GET', query);

      if (!this.isDataverseResponse(response)) {
        this.logger.error(
          `Invalid Dataverse response format - Operation: ${operationId}`,
          {
            operation: 'findByEmail',
            operationId,
            error: 'INVALID_RESPONSE_FORMAT',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(
          ErrorCodes.EXTERNAL_SERVICE_ERROR,
          {
            operation: 'findByEmail',
            message: 'Invalid response format from Dataverse',
            service: 'DataverseService',
          },
          500,
        );
      }

      // Process response
      const affiliateRecords = response.value || [];

      if (affiliateRecords.length === 0) {
        this.logger.log(
          `No affiliate found with email - Operation: ${operationId}`,
          {
            operation: 'findByEmail',
            operationId,
            result: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        );
        return null;
      }

      if (affiliateRecords.length > 1) {
        this.logger.warn(
          `Multiple affiliates found with same email - Operation: ${operationId}`,
          {
            operation: 'findByEmail',
            operationId,
            count: affiliateRecords.length,
            warning: 'EMAIL_COLLISION',
            timestamp: new Date().toISOString(),
          },
        );
      }

      // Use first matching record
      const affiliateData = this.extractAffiliateData(affiliateRecords[0]);
      if (!affiliateData) {
        this.logger.error(
          `Failed to extract affiliate data - Operation: ${operationId}`,
          {
            operation: 'findByEmail',
            operationId,
            error: 'DATA_EXTRACTION_FAILED',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(
          ErrorCodes.INTERNAL_ERROR,
          {
            operation: 'findByEmail',
            message: 'Failed to process affiliate data',
          },
          500,
        );
      }

      // Apply security filtering
      const filteredData = this.filterResponseFields(
        affiliateData,
        userPrivilege,
      );

      // Convert to internal format
      const affiliate = this.mapToAffiliateInternal(filteredData);

      this.logger.log(
        `Email lookup completed successfully - Operation: ${operationId}`,
        {
          operation: 'findByEmail',
          operationId,
          result: 'SUCCESS',
          fieldsReturned: Object.keys(affiliate).length,
          timestamp: new Date().toISOString(),
        },
      );

      return affiliate;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        // Re-throw known application errors
        throw error;
      }

      this.logger.error(
        `Unexpected error during email lookup - Operation: ${operationId}`,
        {
          operation: 'findByEmail',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(
        ErrorCodes.INTERNAL_ERROR,
        {
          operation: 'findByEmail',
          message: 'Unexpected error during affiliate email lookup',
          originalError:
            error instanceof Error ? error.message : 'Unknown error',
        },
        500,
      );
    }
  }

  /**
   * Find affiliates by organization name
   * @param name - Organization name to search for (supports partial matching)
   * @param userPrivilege - Current user's privilege level
   * @param limit - Maximum number of results to return (default: 50)
   * @param offset - Number of records to skip for pagination (default: 0)
   * @returns Promise<{affiliates: EnhancedAffiliateResponse[], total: number}>
   */
  async findByName(
    name: string,
    userPrivilege?: Privilege,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ affiliates: EnhancedAffiliateResponse[]; total: number }> {
    const operationId = `lookup_name_${Date.now()}`;

    this.logger.log(`Starting name lookup - Operation: ${operationId}`, {
      operation: 'findByName',
      operationId,
      userPrivilege: userPrivilege || 'undefined',
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });

    try {
      // Validate input
      const sanitizedName = this.validateAffiliateName(name);

      // Check read privileges for authenticated/privileged access
      if (
        userPrivilege && // Only check permissions if user privilege is provided
        !this.canRead(userPrivilege)
      ) {
        this.logger.warn(
          `Name lookup denied - insufficient privileges - Operation: ${operationId}`,
          {
            operation: 'findByName',
            operationId,
            requiredPrivilege: 'READ',
            userPrivilege: userPrivilege || 'undefined',
            error: 'PERMISSION_DENIED',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(
          ErrorCodes.PERMISSION_DENIED,
          {
            operation: 'findByName',
            message: 'Insufficient privileges for affiliate name lookup',
            requiredPrivilege: 'READ',
            userPrivilege: userPrivilege || 'undefined',
          },
          403,
        );
      }

      // Validate pagination parameters
      const validLimit = Math.min(Math.max(1, limit), 100); // Limit between 1-100
      const validOffset = Math.max(0, offset);

      // Construct OData query with partial name matching
      const nameFilter = `contains(osot_affiliate_name, '${this.safeStringifyForOData(sanitizedName)}')`;
      const query = `${AFFILIATE_ODATA.TABLE_NAME}?$filter=${nameFilter}&$count=true&$top=${validLimit}&$skip=${validOffset}`;

      this.logger.debug(
        `Executing Dataverse query - Operation: ${operationId}`,
        {
          operation: 'findByName',
          operationId,
          query: query.replace(sanitizedName, '[REDACTED]'),
          limit: validLimit,
          offset: validOffset,
          timestamp: new Date().toISOString(),
        },
      );

      // Execute query
      const response = await this.dataverseService.request('GET', query);

      if (!this.isDataverseResponse(response)) {
        this.logger.error(
          `Invalid Dataverse response format - Operation: ${operationId}`,
          {
            operation: 'findByName',
            operationId,
            error: 'INVALID_RESPONSE_FORMAT',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(
          ErrorCodes.EXTERNAL_SERVICE_ERROR,
          {
            operation: 'findByName',
            message: 'Invalid response format from Dataverse',
            service: 'DataverseService',
          },
          500,
        );
      }

      // Process response
      const affiliateRecords = response.value || [];
      const totalCount = response['@odata.count'] || 0;

      this.logger.log(
        `Name lookup query completed - Operation: ${operationId}`,
        {
          operation: 'findByName',
          operationId,
          recordsFound: affiliateRecords.length,
          totalCount,
          limit: validLimit,
          offset: validOffset,
          timestamp: new Date().toISOString(),
        },
      );

      // Process each record
      const affiliates: EnhancedAffiliateResponse[] = [];

      for (const record of affiliateRecords) {
        const affiliateData = this.extractAffiliateData(record);
        if (affiliateData) {
          // Apply security filtering
          const filteredData = this.filterResponseFields(
            affiliateData,
            userPrivilege,
          );

          // Convert to internal format
          const affiliate = this.mapToAffiliateInternal(filteredData);
          affiliates.push(affiliate);
        } else {
          this.logger.warn(
            `Failed to extract affiliate data for record - Operation: ${operationId}`,
            {
              operation: 'findByName',
              operationId,
              warning: 'DATA_EXTRACTION_FAILED',
              timestamp: new Date().toISOString(),
            },
          );
        }
      }

      this.logger.log(
        `Name lookup completed successfully - Operation: ${operationId}`,
        {
          operation: 'findByName',
          operationId,
          result: 'SUCCESS',
          affiliatesProcessed: affiliates.length,
          totalCount,
          timestamp: new Date().toISOString(),
        },
      );

      return {
        affiliates,
        total: totalCount,
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        // Re-throw known application errors
        throw error;
      }

      this.logger.error(
        `Unexpected error during name lookup - Operation: ${operationId}`,
        {
          operation: 'findByName',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(
        ErrorCodes.INTERNAL_ERROR,
        {
          operation: 'findByName',
          message: 'Unexpected error during affiliate name lookup',
          originalError:
            error instanceof Error ? error.message : 'Unknown error',
        },
        500,
      );
    }
  }

  /**
   * Find affiliates by city
   * @param city - City name or ID to search for
   * @param userPrivilege - Current user's privilege level
   * @param securityLevel - Security level for response filtering
   * @param limit - Maximum number of results to return (default: 50)
   * @param offset - Number of records to skip for pagination (default: 0)
   * @returns Promise<{affiliates: EnhancedAffiliateResponse[], total: number}>
   */
  async findByCity(
    city: string | number,
    userPrivilege?: Privilege,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ affiliates: EnhancedAffiliateResponse[]; total: number }> {
    const operationId = `lookup_city_${Date.now()}`;

    this.logger.log(`Starting city lookup - Operation: ${operationId}`, {
      operation: 'findByCity',
      operationId,
      userPrivilege: userPrivilege || 'undefined',
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });

    try {
      // Check read privileges
      if (userPrivilege && !this.canRead(userPrivilege)) {
        throw createAppError(
          ErrorCodes.PERMISSION_DENIED,
          {
            operation: 'findByCity',
            message: 'Insufficient privileges for affiliate city lookup',
            requiredPrivilege: 'READ',
            userPrivilege: userPrivilege || 'undefined',
          },
          403,
        );
      }

      // Validate pagination parameters
      const validLimit = Math.min(Math.max(1, limit), 100);
      const validOffset = Math.max(0, offset);

      // Construct filter based on city type
      let cityFilter: string;
      if (typeof city === 'number') {
        cityFilter = `osot_affiliate_city eq ${city}`;
      } else {
        const sanitizedCity = this.safeStringifyForOData(city);
        cityFilter = `osot_affiliate_city eq '${sanitizedCity}'`;
      }

      const query = `${AFFILIATE_ODATA.TABLE_NAME}?$filter=${cityFilter}&$count=true&$top=${validLimit}&$skip=${validOffset}`;

      // Execute query
      const response = await this.dataverseService.request('GET', query);

      if (!this.isDataverseResponse(response)) {
        throw createAppError(
          ErrorCodes.EXTERNAL_SERVICE_ERROR,
          {
            operation: 'findByCity',
            message: 'Invalid response format from Dataverse',
            service: 'DataverseService',
          },
          500,
        );
      }

      // Process response
      const affiliateRecords = response.value || [];
      const totalCount = response['@odata.count'] || 0;

      const affiliates: EnhancedAffiliateResponse[] = [];

      for (const record of affiliateRecords) {
        const affiliateData = this.extractAffiliateData(record);
        if (affiliateData) {
          const filteredData = this.filterResponseFields(
            affiliateData,
            userPrivilege,
          );
          const affiliate = this.mapToAffiliateInternal(filteredData);
          affiliates.push(affiliate);
        }
      }

      this.logger.log(
        `City lookup completed successfully - Operation: ${operationId}`,
        {
          operation: 'findByCity',
          operationId,
          result: 'SUCCESS',
          affiliatesFound: affiliates.length,
          totalCount,
          timestamp: new Date().toISOString(),
        },
      );

      return { affiliates, total: totalCount };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      this.logger.error(
        `Unexpected error during city lookup - Operation: ${operationId}`,
        {
          operation: 'findByCity',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(
        ErrorCodes.INTERNAL_ERROR,
        {
          operation: 'findByCity',
          message: 'Unexpected error during affiliate city lookup',
          originalError:
            error instanceof Error ? error.message : 'Unknown error',
        },
        500,
      );
    }
  }

  /**
   * Find affiliates by province
   * @param province - Province name or ID to search for
   * @param userPrivilege - Current user's privilege level
   * @param securityLevel - Security level for response filtering
   * @param limit - Maximum number of results to return (default: 50)
   * @param offset - Number of records to skip for pagination (default: 0)
   * @returns Promise<{affiliates: EnhancedAffiliateResponse[], total: number}>
   */
  async findByProvince(
    province: string | number,
    userPrivilege?: Privilege,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ affiliates: EnhancedAffiliateResponse[]; total: number }> {
    const operationId = `lookup_province_${Date.now()}`;

    this.logger.log(`Starting province lookup - Operation: ${operationId}`, {
      operation: 'findByProvince',
      operationId,
      userPrivilege: userPrivilege || 'undefined',
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });

    try {
      // Check read privileges
      if (userPrivilege && !this.canRead(userPrivilege)) {
        throw createAppError(
          ErrorCodes.PERMISSION_DENIED,
          {
            operation: 'findByProvince',
            message: 'Insufficient privileges for affiliate province lookup',
            requiredPrivilege: 'READ',
            userPrivilege: userPrivilege || 'undefined',
          },
          403,
        );
      }

      // Validate pagination parameters
      const validLimit = Math.min(Math.max(1, limit), 100);
      const validOffset = Math.max(0, offset);

      // Construct filter based on province type
      let provinceFilter: string;
      if (typeof province === 'number') {
        provinceFilter = `osot_affiliate_province eq ${province}`;
      } else {
        const sanitizedProvince = this.safeStringifyForOData(province);
        provinceFilter = `osot_affiliate_province eq '${sanitizedProvince}'`;
      }

      const query = `${AFFILIATE_ODATA.TABLE_NAME}?$filter=${provinceFilter}&$count=true&$top=${validLimit}&$skip=${validOffset}`;

      // Execute query
      const response = await this.dataverseService.request('GET', query);

      if (!this.isDataverseResponse(response)) {
        throw createAppError(
          ErrorCodes.EXTERNAL_SERVICE_ERROR,
          {
            operation: 'findByProvince',
            message: 'Invalid response format from Dataverse',
            service: 'DataverseService',
          },
          500,
        );
      }

      // Process response
      const affiliateRecords = response.value || [];
      const totalCount = response['@odata.count'] || 0;

      const affiliates: EnhancedAffiliateResponse[] = [];

      for (const record of affiliateRecords) {
        const affiliateData = this.extractAffiliateData(record);
        if (affiliateData) {
          const filteredData = this.filterResponseFields(
            affiliateData,
            userPrivilege,
          );
          const affiliate = this.mapToAffiliateInternal(filteredData);
          affiliates.push(affiliate);
        }
      }

      this.logger.log(
        `Province lookup completed successfully - Operation: ${operationId}`,
        {
          operation: 'findByProvince',
          operationId,
          result: 'SUCCESS',
          affiliatesFound: affiliates.length,
          totalCount,
          timestamp: new Date().toISOString(),
        },
      );

      return { affiliates, total: totalCount };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      this.logger.error(
        `Unexpected error during province lookup - Operation: ${operationId}`,
        {
          operation: 'findByProvince',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(
        ErrorCodes.INTERNAL_ERROR,
        {
          operation: 'findByProvince',
          message: 'Unexpected error during affiliate province lookup',
          originalError:
            error instanceof Error ? error.message : 'Unknown error',
        },
        500,
      );
    }
  }

  /**
   * Find affiliates by country
   * @param country - Country name or ID to search for
   * @param userPrivilege - Current user's privilege level
   * @param securityLevel - Security level for response filtering
   * @param limit - Maximum number of results to return (default: 50)
   * @param offset - Number of records to skip for pagination (default: 0)
   * @returns Promise<{affiliates: EnhancedAffiliateResponse[], total: number}>
   */
  async findByCountry(
    country: string | number,
    userPrivilege?: Privilege,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ affiliates: EnhancedAffiliateResponse[]; total: number }> {
    const operationId = `lookup_country_${Date.now()}`;

    this.logger.log(`Starting country lookup - Operation: ${operationId}`, {
      operation: 'findByCountry',
      operationId,
      userPrivilege: userPrivilege || 'undefined',
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });

    try {
      // Check read privileges
      if (userPrivilege && !this.canRead(userPrivilege)) {
        throw createAppError(
          ErrorCodes.PERMISSION_DENIED,
          {
            operation: 'findByCountry',
            message: 'Insufficient privileges for affiliate country lookup',
            requiredPrivilege: 'READ',
            userPrivilege: userPrivilege || 'undefined',
          },
          403,
        );
      }

      // Validate pagination parameters
      const validLimit = Math.min(Math.max(1, limit), 100);
      const validOffset = Math.max(0, offset);

      // Construct filter based on country type
      let countryFilter: string;
      if (typeof country === 'number') {
        countryFilter = `osot_affiliate_country eq ${country}`;
      } else {
        const sanitizedCountry = this.safeStringifyForOData(country);
        countryFilter = `osot_affiliate_country eq '${sanitizedCountry}'`;
      }

      const query = `${AFFILIATE_ODATA.TABLE_NAME}?$filter=${countryFilter}&$count=true&$top=${validLimit}&$skip=${validOffset}`;

      // Execute query
      const response = await this.dataverseService.request('GET', query);

      if (!this.isDataverseResponse(response)) {
        throw createAppError(
          ErrorCodes.EXTERNAL_SERVICE_ERROR,
          {
            operation: 'findByCountry',
            message: 'Invalid response format from Dataverse',
            service: 'DataverseService',
          },
          500,
        );
      }

      // Process response
      const affiliateRecords = response.value || [];
      const totalCount = response['@odata.count'] || 0;

      const affiliates: EnhancedAffiliateResponse[] = [];

      for (const record of affiliateRecords) {
        const affiliateData = this.extractAffiliateData(record);
        if (affiliateData) {
          const filteredData = this.filterResponseFields(
            affiliateData,
            userPrivilege,
          );
          const affiliate = this.mapToAffiliateInternal(filteredData);
          affiliates.push(affiliate);
        }
      }

      this.logger.log(
        `Country lookup completed successfully - Operation: ${operationId}`,
        {
          operation: 'findByCountry',
          operationId,
          result: 'SUCCESS',
          affiliatesFound: affiliates.length,
          totalCount,
          timestamp: new Date().toISOString(),
        },
      );

      return { affiliates, total: totalCount };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      this.logger.error(
        `Unexpected error during country lookup - Operation: ${operationId}`,
        {
          operation: 'findByCountry',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(
        ErrorCodes.INTERNAL_ERROR,
        {
          operation: 'findByCountry',
          message: 'Unexpected error during affiliate country lookup',
          originalError:
            error instanceof Error ? error.message : 'Unknown error',
        },
        500,
      );
    }
  }

  /**
   * Find affiliates by business area
   * @param area - Business area ID to search for
   * @param userPrivilege - Current user's privilege level
   * @param securityLevel - Security level for response filtering
   * @param limit - Maximum number of results to return (default: 50)
   * @param offset - Number of records to skip for pagination (default: 0)
   * @returns Promise<{affiliates: EnhancedAffiliateResponse[], total: number}>
   */
  async findByArea(
    area: number,
    userPrivilege?: Privilege,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ affiliates: EnhancedAffiliateResponse[]; total: number }> {
    const operationId = `lookup_area_${Date.now()}`;

    this.logger.log(`Starting area lookup - Operation: ${operationId}`, {
      operation: 'findByArea',
      operationId,
      area,
      userPrivilege: userPrivilege || 'undefined',
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });

    try {
      // Check read privileges
      if (userPrivilege && !this.canRead(userPrivilege)) {
        throw createAppError(
          ErrorCodes.PERMISSION_DENIED,
          {
            operation: 'findByArea',
            message: 'Insufficient privileges for affiliate area lookup',
            requiredPrivilege: 'READ',
            userPrivilege: userPrivilege || 'undefined',
          },
          403,
        );
      }

      // Validate area parameter
      if (!Number.isInteger(area) || area < 0) {
        throw createAppError(
          ErrorCodes.VALIDATION_ERROR,
          {
            field: 'area',
            message: 'Area must be a valid positive integer',
            value: area,
          },
          400,
        );
      }

      // Validate pagination parameters
      const validLimit = Math.min(Math.max(1, limit), 100);
      const validOffset = Math.max(0, offset);

      const areaFilter = `osot_affiliate_area eq ${area}`;
      const query = `${AFFILIATE_ODATA.TABLE_NAME}?$filter=${areaFilter}&$count=true&$top=${validLimit}&$skip=${validOffset}`;

      // Execute query
      const response = await this.dataverseService.request('GET', query);

      if (!this.isDataverseResponse(response)) {
        throw createAppError(
          ErrorCodes.EXTERNAL_SERVICE_ERROR,
          {
            operation: 'findByArea',
            message: 'Invalid response format from Dataverse',
            service: 'DataverseService',
          },
          500,
        );
      }

      // Process response
      const affiliateRecords = response.value || [];
      const totalCount = response['@odata.count'] || 0;

      const affiliates: EnhancedAffiliateResponse[] = [];

      for (const record of affiliateRecords) {
        const affiliateData = this.extractAffiliateData(record);
        if (affiliateData) {
          const filteredData = this.filterResponseFields(
            affiliateData,
            userPrivilege,
          );
          const affiliate = this.mapToAffiliateInternal(filteredData);
          affiliates.push(affiliate);
        }
      }

      this.logger.log(
        `Area lookup completed successfully - Operation: ${operationId}`,
        {
          operation: 'findByArea',
          operationId,
          result: 'SUCCESS',
          affiliatesFound: affiliates.length,
          totalCount,
          area,
          timestamp: new Date().toISOString(),
        },
      );

      return { affiliates, total: totalCount };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      this.logger.error(
        `Unexpected error during area lookup - Operation: ${operationId}`,
        {
          operation: 'findByArea',
          operationId,
          area,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(
        ErrorCodes.INTERNAL_ERROR,
        {
          operation: 'findByArea',
          message: 'Unexpected error during affiliate area lookup',
          originalError:
            error instanceof Error ? error.message : 'Unknown error',
        },
        500,
      );
    }
  }

  /**
   * Find active affiliates
   * @param userPrivilege - Current user's privilege level
   * @param securityLevel - Security level for response filtering
   * @param limit - Maximum number of results to return (default: 50)
   * @param offset - Number of records to skip for pagination (default: 0)
   * @returns Promise<{affiliates: EnhancedAffiliateResponse[], total: number}>
   */
  async findActiveAffiliates(
    userPrivilege?: Privilege,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ affiliates: EnhancedAffiliateResponse[]; total: number }> {
    const operationId = `lookup_active_${Date.now()}`;

    this.logger.log(
      `Starting active affiliates lookup - Operation: ${operationId}`,
      {
        operation: 'findActiveAffiliates',
        operationId,
        userPrivilege: userPrivilege || 'undefined',
        limit,
        offset,
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Check read privileges
      if (userPrivilege && !this.canRead(userPrivilege)) {
        throw createAppError(
          ErrorCodes.PERMISSION_DENIED,
          {
            operation: 'findActiveAffiliates',
            message: 'Insufficient privileges for active affiliates lookup',
            requiredPrivilege: 'READ',
            userPrivilege: userPrivilege || 'undefined',
          },
          403,
        );
      }

      // Validate pagination parameters
      const validLimit = Math.min(Math.max(1, limit), 100);
      const validOffset = Math.max(0, offset);

      // Active status typically means statuscode = 1 in Dataverse
      const activeFilter = 'statuscode eq 1';
      const query = `${AFFILIATE_ODATA.TABLE_NAME}?$filter=${activeFilter}&$count=true&$top=${validLimit}&$skip=${validOffset}`;

      // Execute query
      const response = await this.dataverseService.request('GET', query);

      if (!this.isDataverseResponse(response)) {
        throw createAppError(
          ErrorCodes.EXTERNAL_SERVICE_ERROR,
          {
            operation: 'findActiveAffiliates',
            message: 'Invalid response format from Dataverse',
            service: 'DataverseService',
          },
          500,
        );
      }

      // Process response
      const affiliateRecords = response.value || [];
      const totalCount = response['@odata.count'] || 0;

      const affiliates: EnhancedAffiliateResponse[] = [];

      for (const record of affiliateRecords) {
        const affiliateData = this.extractAffiliateData(record);
        if (affiliateData) {
          const filteredData = this.filterResponseFields(
            affiliateData,
            userPrivilege,
          );
          const affiliate = this.mapToAffiliateInternal(filteredData);
          affiliates.push(affiliate);
        }
      }

      this.logger.log(
        `Active affiliates lookup completed successfully - Operation: ${operationId}`,
        {
          operation: 'findActiveAffiliates',
          operationId,
          result: 'SUCCESS',
          affiliatesFound: affiliates.length,
          totalCount,
          timestamp: new Date().toISOString(),
        },
      );

      return { affiliates, total: totalCount };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      this.logger.error(
        `Unexpected error during active affiliates lookup - Operation: ${operationId}`,
        {
          operation: 'findActiveAffiliates',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(
        ErrorCodes.INTERNAL_ERROR,
        {
          operation: 'findActiveAffiliates',
          message: 'Unexpected error during active affiliates lookup',
          originalError:
            error instanceof Error ? error.message : 'Unknown error',
        },
        500,
      );
    }
  }

  /**
   * Find inactive affiliates
   * @param userPrivilege - Current user's privilege level
   * @param securityLevel - Security level for response filtering
   * @param limit - Maximum number of results to return (default: 50)
   * @param offset - Number of records to skip for pagination (default: 0)
   * @returns Promise<{affiliates: EnhancedAffiliateResponse[], total: number}>
   */
  async findInactiveAffiliates(
    userPrivilege?: Privilege,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ affiliates: EnhancedAffiliateResponse[]; total: number }> {
    const operationId = `lookup_inactive_${Date.now()}`;

    this.logger.log(
      `Starting inactive affiliates lookup - Operation: ${operationId}`,
      {
        operation: 'findInactiveAffiliates',
        operationId,
        userPrivilege: userPrivilege || 'undefined',
        limit,
        offset,
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Check read privileges
      if (userPrivilege && !this.canRead(userPrivilege)) {
        throw createAppError(
          ErrorCodes.PERMISSION_DENIED,
          {
            operation: 'findInactiveAffiliates',
            message: 'Insufficient privileges for inactive affiliates lookup',
            requiredPrivilege: 'READ',
            userPrivilege: userPrivilege || 'undefined',
          },
          403,
        );
      }

      // Validate pagination parameters
      const validLimit = Math.min(Math.max(1, limit), 100);
      const validOffset = Math.max(0, offset);

      // Inactive status typically means statuscode = 2 in Dataverse
      const inactiveFilter = 'statuscode eq 2';
      const query = `${AFFILIATE_ODATA.TABLE_NAME}?$filter=${inactiveFilter}&$count=true&$top=${validLimit}&$skip=${validOffset}`;

      // Execute query
      const response = await this.dataverseService.request('GET', query);

      if (!this.isDataverseResponse(response)) {
        throw createAppError(
          ErrorCodes.EXTERNAL_SERVICE_ERROR,
          {
            operation: 'findInactiveAffiliates',
            message: 'Invalid response format from Dataverse',
            service: 'DataverseService',
          },
          500,
        );
      }

      // Process response
      const affiliateRecords = response.value || [];
      const totalCount = response['@odata.count'] || 0;

      const affiliates: EnhancedAffiliateResponse[] = [];

      for (const record of affiliateRecords) {
        const affiliateData = this.extractAffiliateData(record);
        if (affiliateData) {
          const filteredData = this.filterResponseFields(
            affiliateData,
            userPrivilege,
          );
          const affiliate = this.mapToAffiliateInternal(filteredData);
          affiliates.push(affiliate);
        }
      }

      this.logger.log(
        `Inactive affiliates lookup completed successfully - Operation: ${operationId}`,
        {
          operation: 'findInactiveAffiliates',
          operationId,
          result: 'SUCCESS',
          affiliatesFound: affiliates.length,
          totalCount,
          timestamp: new Date().toISOString(),
        },
      );

      return { affiliates, total: totalCount };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      this.logger.error(
        `Unexpected error during inactive affiliates lookup - Operation: ${operationId}`,
        {
          operation: 'findInactiveAffiliates',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(
        ErrorCodes.INTERNAL_ERROR,
        {
          operation: 'findInactiveAffiliates',
          message: 'Unexpected error during inactive affiliates lookup',
          originalError:
            error instanceof Error ? error.message : 'Unknown error',
        },
        500,
      );
    }
  }
}
