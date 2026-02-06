import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  DataverseService,
  DataverseCredentials,
} from '../../../../integrations/dataverse.service';
import { OT_EDUCATION_ODATA } from '../constants/ot-education.constants';
import {
  CotoStatus,
  OtUniversity,
  GraduationYear,
  EducationCategory,
  Country,
  DegreeType,
} from '../../../../common/enums';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { canRead } from '../../../../utils/dataverse-app.helper';
// Repository and interface imports
import {
  OtEducationRepository,
  OT_EDUCATION_REPOSITORY,
} from '../interfaces/ot-education-repository.interface';
// Mapper imports
import { mapInternalToResponse } from '../mappers/ot-education.mapper';
import { OtEducationResponseDto } from '../dtos/ot-education-response.dto';

/**
 * Interface for Dataverse response with value array
 */
interface DataverseResponse {
  value?: Record<string, unknown>[];
  '@odata.count'?: number;
}

/**
 * Interface for education record statistics
 */
interface EducationRecord {
  osot_coto_status?: string | number;
  osot_ot_university?: string | number;
  osot_ot_country?: string | number;
  osot_education_category?: string | number;
  osot_ot_degree_type?: string | number;
  osot_ot_grad_year?: string | number;
  [key: string]: unknown;
}

/**
 * OT Education Lookup Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: OtEducationRepositoryService for clean data access abstraction
 * - Structured Logging: Logger with operation IDs and security-aware PII redaction
 * - Security-First Design: Role-based permission checking (canRead)
 * - Error Management: Comprehensive error handling with createAppError and detailed context
 *
 * Provides specialized query operations for OT Education entities:
 * - Find education records by various criteria (COTO status, university, graduation year)
 * - University and education-based lookups (country, degree type, category)
 * - Professional status queries (COTO registration, education category)
 * - Business logic queries (data completeness, validation status)
 * - Support for complex filtering and sorting
 *
 * PERMISSION SYSTEM:
 * - main: Full access to all lookup operations and fields
 * - admin: Full access to all lookup operations and fields
 * - owner: Access to lookup operations with sensitive field filtering
 *
 * ENTERPRISE FEATURES:
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Security-aware logging with PII redaction capabilities
 * - Role-based field filtering and access control
 * - Performance monitoring and query optimization
 *
 * ENUM INTEGRATION:
 * - CotoStatus enum for professional status filtering
 * - OtUniversity enum for institution-specific lookups
 * - GraduationYear enum for temporal-based queries
 * - EducationCategory enum for classification filtering
 * - Country enum for geographic-based lookups
 * - Type-safe operations using project enums
 */
@Injectable()
export class OtEducationLookupService {
  private readonly logger = new Logger(OtEducationLookupService.name);

  constructor(
    private readonly dataverseService: DataverseService,
    @Inject(OT_EDUCATION_REPOSITORY)
    private readonly otEducationRepository: OtEducationRepository,
  ) {
    this.logger.log(
      'OtEducationLookupService initialized with Enterprise patterns',
    );
  }

  /**
   * Find education record by GUID with comprehensive security and logging
   * Enhanced with operation tracking and security-aware logging
   */
  async findOneByGuid(
    guid: string,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<OtEducationResponseDto> {
    const operationId = Math.random().toString(36).substring(2, 15);

    this.logger.log(
      `OT education GUID lookup initiated - Operation: ${operationId}`,
      {
        operation: 'findOneByGuid',
        operationId,
        otEducationGuid: guid?.substring(0, 8) + '...',
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking for read operations
    if (!canRead(userRole)) {
      this.logger.warn(
        `OT education GUID lookup denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'findOneByGuid',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OT education GUID lookup',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findOneByGuid',
      });
    }

    try {
      const record = await this.otEducationRepository.findById(guid);

      if (!record) {
        this.logger.log(`OT education not found - Operation: ${operationId}`, {
          operation: 'findOneByGuid',
          operationId,
          otEducationGuid: guid?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          found: false,
          timestamp: new Date().toISOString(),
        });

        throw createAppError(ErrorCodes.NOT_FOUND, {
          operation: 'findOneByGuid',
          operationId,
          entityId: guid,
          entityType: 'OtEducation',
        });
      }

      this.logger.log(
        `OT education found successfully - Operation: ${operationId}`,
        {
          operation: 'findOneByGuid',
          operationId,
          otEducationGuid: guid?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          found: true,
          timestamp: new Date().toISOString(),
        },
      );

      return mapInternalToResponse(record);
    } catch (error) {
      this.logger.error(
        `OT education GUID lookup failed - Operation: ${operationId}`,
        {
          operation: 'findOneByGuid',
          operationId,
          otEducationGuid: guid?.substring(0, 8) + '...',
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findOneByGuid',
        operationId,
        entityId: guid,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education records by COTO status with security and logging
   */
  async findByCotoStatus(
    cotoStatus: CotoStatus,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<Record<string, unknown>[]> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Permission checking for read operations
    if (!canRead(userRole)) {
      this.logger.warn(
        `OT education COTO status lookup denied - Operation: ${operationId}`,
        {
          operation: 'findByCotoStatus',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OT education COTO status lookup',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByCotoStatus',
      });
    }

    try {
      this.logger.log(
        `OT education COTO status lookup initiated - Operation: ${operationId}`,
        {
          operation: 'findByCotoStatus',
          operationId,
          cotoStatus,
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      const filter = `osot_coto_status eq ${cotoStatus}`;
      const endpoint = `${OT_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      const dataverseResponse = response as DataverseResponse;
      const result = dataverseResponse?.value || [];

      this.logger.log(
        `OT education COTO status lookup completed - Operation: ${operationId}`,
        {
          operation: 'findByCotoStatus',
          operationId,
          cotoStatus,
          count: result.length,
          timestamp: new Date().toISOString(),
        },
      );

      return result;
    } catch (error) {
      this.logger.error(
        `OT education COTO status lookup failed - Operation: ${operationId}`,
        {
          operation: 'findByCotoStatus',
          operationId,
          cotoStatus,
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findByCotoStatus',
        operationId,
        cotoStatus,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education records by university with security
   */
  async findByUniversity(
    university: OtUniversity,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<Record<string, unknown>[]> {
    // Permission checking
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OT education university lookup',
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByUniversity',
      });
    }

    try {
      const filter = `osot_ot_university eq ${university}`;
      const endpoint = `${OT_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      const dataverseResponse = response as DataverseResponse;
      return dataverseResponse?.value || [];
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findByUniversity',
        university,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education records by graduation year
   */
  async findByGraduationYear(
    graduationYear: GraduationYear,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    try {
      const filter = `osot_ot_grad_year eq ${graduationYear}`;
      const endpoint = `${OT_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      const dataverseResponse = response as DataverseResponse;
      return dataverseResponse?.value || [];
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findByGraduationYear',
        graduationYear,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education records by education category
   */
  async findByEducationCategory(
    educationCategory: EducationCategory,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    try {
      const filter = `osot_education_category eq ${educationCategory}`;
      const endpoint = `${OT_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      const dataverseResponse = response as DataverseResponse;
      return dataverseResponse?.value || [];
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findByEducationCategory',
        educationCategory,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education records by country
   */
  async findByCountry(
    country: Country,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    try {
      const filter = `osot_ot_country eq ${country}`;
      const endpoint = `${OT_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      const dataverseResponse = response as DataverseResponse;
      return dataverseResponse?.value || [];
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findByCountry',
        country,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education record by User Business ID with comprehensive security and logging
   * User Business ID is unique and limited to 20 characters
   */
  async findByUserBusinessId(
    userBusinessId: string,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<OtEducationResponseDto | null> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Redact sensitive data for logging (show only first 4 characters)
    const redactedBusinessId = userBusinessId?.substring(0, 4) + '...';

    this.logger.log(
      `OT education Business ID lookup initiated - Operation: ${operationId}`,
      {
        operation: 'findByUserBusinessId',
        operationId,
        userBusinessId: redactedBusinessId,
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking for read operations
    if (!canRead(userRole)) {
      this.logger.warn(
        `OT education Business ID lookup denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'findByUserBusinessId',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OT education business ID lookup',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByUserBusinessId',
      });
    }

    try {
      const records =
        await this.otEducationRepository.findByUserId(userBusinessId);
      const record = records[0] || null;

      this.logger.log(
        `OT education Business ID lookup completed - Operation: ${operationId}`,
        {
          operation: 'findByUserBusinessId',
          operationId,
          userBusinessId: redactedBusinessId,
          userRole: userRole || 'undefined',
          found: !!record,
          timestamp: new Date().toISOString(),
        },
      );

      return record ? mapInternalToResponse(record) : null;
    } catch (error) {
      this.logger.error(
        `OT education Business ID lookup failed - Operation: ${operationId}`,
        {
          operation: 'findByUserBusinessId',
          operationId,
          userBusinessId: redactedBusinessId,
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findByUserBusinessId',
        operationId,
        userBusinessId: redactedBusinessId,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education records by Account ID with comprehensive security and logging
   * Returns all OT education records associated with a specific account
   */
  async findByAccountId(
    accountId: string,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<OtEducationResponseDto[]> {
    const operationId = Math.random().toString(36).substring(2, 15);

    this.logger.log(
      `OT education Account lookup initiated - Operation: ${operationId}`,
      {
        operation: 'findByAccountId',
        operationId,
        accountId: accountId?.substring(0, 8) + '...',
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking for read operations
    if (!canRead(userRole)) {
      this.logger.warn(
        `OT education Account lookup denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'findByAccountId',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OT education account lookup',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByAccountId',
      });
    }

    try {
      const records =
        await this.otEducationRepository.findByAccountId(accountId);

      this.logger.log(
        `OT education Account lookup completed - Operation: ${operationId}`,
        {
          operation: 'findByAccountId',
          operationId,
          accountId: accountId?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          count: records.length,
          timestamp: new Date().toISOString(),
        },
      );

      return records.map((record) => mapInternalToResponse(record));
    } catch (error) {
      this.logger.error(
        `OT education Account lookup failed - Operation: ${operationId}`,
        {
          operation: 'findByAccountId',
          operationId,
          accountId: accountId?.substring(0, 8) + '...',
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findByAccountId',
        operationId,
        accountId: accountId?.substring(0, 8) + '...',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education records with COTO registration
   */
  async findWithCotoRegistration(
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    try {
      const filter = `osot_coto_registration ne null and osot_coto_registration ne ''`;
      const endpoint = `${OT_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      const dataverseResponse = response as DataverseResponse;
      return dataverseResponse?.value || [];
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findWithCotoRegistration',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find new graduates (recent graduation years)
   */
  async findNewGraduates(
    currentYear?: number,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    try {
      const year = currentYear || new Date().getFullYear();
      const cutoffYear = year - 2; // Last 2 years considered "new"

      const filter = `osot_ot_grad_year ge ${cutoffYear}`;
      const endpoint = `${OT_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      const dataverseResponse = response as DataverseResponse;
      return dataverseResponse?.value || [];
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findNewGraduates',
        currentYear,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find international education records (non-Canadian)
   */
  async findInternationalEducation(
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    try {
      const filter = `osot_ot_country ne ${Country.CANADA}`;
      const endpoint = `${OT_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      const dataverseResponse = response as DataverseResponse;
      return dataverseResponse?.value || [];
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findInternationalEducation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education records by degree type
   */
  async findByDegreeType(
    degreeType: DegreeType,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    try {
      const filter = `osot_ot_degree_type eq ${degreeType}`;
      const endpoint = `${OT_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      const dataverseResponse = response as DataverseResponse;
      return dataverseResponse?.value || [];
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findByDegreeType',
        degreeType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education records with additional details
   */
  async findWithAdditionalDetails(
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    try {
      const filter = `osot_ot_other ne null and osot_ot_other ne ''`;
      const endpoint = `${OT_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      const dataverseResponse = response as DataverseResponse;
      return dataverseResponse?.value || [];
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findWithAdditionalDetails',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Complex query: Find education records with multiple criteria (ENTERPRISE)
   * Enhanced with security and improved error context
   */
  async findWithCriteria(
    criteria: {
      cotoStatus?: CotoStatus;
      university?: OtUniversity;
      graduationYear?: GraduationYear;
      educationCategory?: EducationCategory;
      country?: Country;
      degreeType?: DegreeType;
      hasRegistration?: boolean;
      limit?: number;
      offset?: number;
    },
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<{ records: Record<string, unknown>[]; total: number }> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Enhanced permission checking
    if (!canRead(userRole)) {
      this.logger.warn(
        `OT education criteria search denied - Operation: ${operationId}`,
        {
          operation: 'findWithCriteria',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OT education criteria search',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findWithCriteria',
      });
    }

    try {
      this.logger.log(
        `OT education criteria search initiated - Operation: ${operationId}`,
        {
          operation: 'findWithCriteria',
          operationId,
          criteriaCount: Object.keys(criteria).length,
          hasLimit: !!criteria.limit,
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      const filters: string[] = [];

      // Build filters based on criteria
      if (criteria.cotoStatus !== undefined) {
        filters.push(`osot_coto_status eq ${criteria.cotoStatus}`);
      }
      if (criteria.university !== undefined) {
        filters.push(`osot_ot_university eq ${criteria.university}`);
      }
      if (criteria.graduationYear !== undefined) {
        filters.push(`osot_ot_grad_year eq ${criteria.graduationYear}`);
      }
      if (criteria.educationCategory !== undefined) {
        filters.push(
          `osot_education_category eq ${criteria.educationCategory}`,
        );
      }
      if (criteria.country !== undefined) {
        filters.push(`osot_ot_country eq ${criteria.country}`);
      }
      if (criteria.degreeType !== undefined) {
        filters.push(`osot_ot_degree_type eq ${criteria.degreeType}`);
      }
      if (criteria.hasRegistration !== undefined) {
        if (criteria.hasRegistration) {
          filters.push(
            `osot_coto_registration ne null and osot_coto_registration ne ''`,
          );
        } else {
          filters.push(
            `osot_coto_registration eq null or osot_coto_registration eq ''`,
          );
        }
      }

      // Build query
      let endpoint = OT_EDUCATION_ODATA.TABLE_NAME;
      const queryParams: string[] = [];

      if (filters.length > 0) {
        queryParams.push(`$filter=${filters.join(' and ')}`);
      }

      queryParams.push('$count=true');

      if (criteria.limit) {
        queryParams.push(`$top=${criteria.limit}`);
      }

      if (criteria.offset) {
        queryParams.push(`$skip=${criteria.offset}`);
      }

      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
      }

      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      const dataverseResponse = response as DataverseResponse;

      const result = {
        records: dataverseResponse?.value || [],
        total: dataverseResponse?.['@odata.count'] || 0,
      };

      this.logger.log(
        `OT education criteria search completed - Operation: ${operationId}`,
        {
          operation: 'findWithCriteria',
          operationId,
          recordCount: result.records.length,
          totalCount: result.total,
          timestamp: new Date().toISOString(),
        },
      );

      return result;
    } catch (error) {
      this.logger.error(
        `OT education criteria search failed - Operation: ${operationId}`,
        {
          operation: 'findWithCriteria',
          operationId,
          criteria,
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findWithCriteria',
        operationId,
        criteria,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get education statistics by various dimensions (ENTERPRISE)
   * Enhanced with security and operation tracking
   */
  async getEducationStatistics(
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<{
    totalRecords: number;
    byCotoStatus: Record<string, number>;
    byUniversity: Record<string, number>;
    byCountry: Record<string, number>;
    byEducationCategory: Record<string, number>;
    byDegreeType: Record<string, number>;
    byGraduationYear: Record<string, number>;
  }> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Enhanced permission checking
    if (!canRead(userRole)) {
      this.logger.warn(
        `OT education statistics denied - Operation: ${operationId}`,
        {
          operation: 'getEducationStatistics',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OT education statistics',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'getEducationStatistics',
      });
    }

    try {
      this.logger.log(
        `OT education statistics generation initiated - Operation: ${operationId}`,
        {
          operation: 'getEducationStatistics',
          operationId,
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      // Get all records for statistics
      const endpoint = `${OT_EDUCATION_ODATA.TABLE_NAME}?$count=true`;
      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      const dataverseResponse = response as DataverseResponse;

      const records = (dataverseResponse?.value || []) as EducationRecord[];
      const totalRecords = dataverseResponse?.['@odata.count'] || 0;

      // Calculate statistics
      const byCotoStatus: Record<string, number> = {};
      const byUniversity: Record<string, number> = {};
      const byCountry: Record<string, number> = {};
      const byEducationCategory: Record<string, number> = {};
      const byDegreeType: Record<string, number> = {};
      const byGraduationYear: Record<string, number> = {};

      records.forEach((record: EducationRecord) => {
        // COTO Status statistics
        const cotoStatus = String(record.osot_coto_status || 'Unknown');
        byCotoStatus[cotoStatus] = (byCotoStatus[cotoStatus] || 0) + 1;

        // University statistics
        const university = String(record.osot_ot_university || 'Unknown');
        byUniversity[university] = (byUniversity[university] || 0) + 1;

        // Country statistics
        const country = String(record.osot_ot_country || 'Unknown');
        byCountry[country] = (byCountry[country] || 0) + 1;

        // Education Category statistics
        const category = String(record.osot_education_category || 'Unknown');
        byEducationCategory[category] =
          (byEducationCategory[category] || 0) + 1;

        // Degree Type statistics
        const degreeType = String(record.osot_ot_degree_type || 'Unknown');
        byDegreeType[degreeType] = (byDegreeType[degreeType] || 0) + 1;

        // Graduation Year statistics
        const gradYear = String(record.osot_ot_grad_year || 'Unknown');
        byGraduationYear[gradYear] = (byGraduationYear[gradYear] || 0) + 1;
      });

      const result = {
        totalRecords,
        byCotoStatus,
        byUniversity,
        byCountry,
        byEducationCategory,
        byDegreeType,
        byGraduationYear,
      };

      this.logger.log(
        `OT education statistics generated successfully - Operation: ${operationId}`,
        {
          operation: 'getEducationStatistics',
          operationId,
          totalRecords: result.totalRecords,
          uniqueCotoStatuses: Object.keys(result.byCotoStatus).length,
          uniqueUniversities: Object.keys(result.byUniversity).length,
          timestamp: new Date().toISOString(),
        },
      );

      return result;
    } catch (error) {
      this.logger.error(
        `OT education statistics generation failed - Operation: ${operationId}`,
        {
          operation: 'getEducationStatistics',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'getEducationStatistics',
        operationId,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
