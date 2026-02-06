import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  DataverseService,
  DataverseCredentials,
} from '../../../../integrations/dataverse.service';
import { OTA_EDUCATION_ODATA } from '../constants/ota-education.constants';
import {
  DegreeType,
  OtaCollege,
  GraduationYear,
  EducationCategory,
  Country,
} from '../../../../common/enums';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { canRead } from '../../../../utils/dataverse-app.helper';
// Repository and interface imports
import {
  OtaEducationRepository,
  OTA_EDUCATION_REPOSITORY,
} from '../interfaces/ota-education-repository.interface';
// Mapper imports
import { mapInternalToResponse } from '../mappers/ota-education.mapper';
import { OtaEducationResponseDto } from '../dtos/ota-education-response.dto';

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
  osot_work_declaration?: string | boolean;
  osot_ota_degree_type?: string | number;
  osot_ota_college?: string | number;
  osot_ota_country?: string | number;
  osot_education_category?: string | number;
  osot_ota_grad_year?: string | number;
  [key: string]: unknown;
}

/**
 * OTA Education Lookup Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: OtaEducationRepositoryService for clean data access abstraction
 * - Structured Logging: Logger with operation IDs and security-aware PII redaction
 * - Security-First Design: Role-based permission checking (canRead)
 * - Error Management: Comprehensive error handling with createAppError and detailed context
 *
 * Provides specialized query operations for OTA Education entities:
 * - Find education records by various criteria (work declaration, college, graduation year)
 * - College and education-based lookups (country, degree type, category)
 * - Work declaration queries (validation status, completeness)
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
 * - DegreeType enum for degree classification filtering
 * - OtaCollege enum for institution-specific lookups
 * - GraduationYear enum for temporal-based queries
 * - EducationCategory enum for classification filtering
 * - Country enum for geographic-based lookups
 * - Type-safe operations using project enums
 */
@Injectable()
export class OtaEducationLookupService {
  private readonly logger = new Logger(OtaEducationLookupService.name);

  constructor(
    private readonly dataverseService: DataverseService,
    @Inject(OTA_EDUCATION_REPOSITORY)
    private readonly otaEducationRepository: OtaEducationRepository,
  ) {
    this.logger.log(
      'OtaEducationLookupService initialized with Enterprise patterns',
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
  ): Promise<OtaEducationResponseDto> {
    const operationId = Math.random().toString(36).substring(2, 15);

    this.logger.log(
      `OTA education GUID lookup initiated - Operation: ${operationId}`,
      {
        operation: 'findOneByGuid',
        operationId,
        otaEducationGuid: guid?.substring(0, 8) + '...',
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking for read operations
    if (!canRead(userRole)) {
      this.logger.warn(
        `OTA education GUID lookup denied - insufficient privileges - Operation: ${operationId}`,
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
        message: 'Access denied to OTA education GUID lookup',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findOneByGuid',
      });
    }

    try {
      const record = await this.otaEducationRepository.findById(guid);

      if (!record) {
        this.logger.log(`OTA education not found - Operation: ${operationId}`, {
          operation: 'findOneByGuid',
          operationId,
          otaEducationGuid: guid?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          found: false,
          timestamp: new Date().toISOString(),
        });

        throw createAppError(ErrorCodes.NOT_FOUND, {
          operation: 'findOneByGuid',
          operationId,
          entityId: guid,
          entityType: 'OtaEducation',
        });
      }

      this.logger.log(
        `OTA education found successfully - Operation: ${operationId}`,
        {
          operation: 'findOneByGuid',
          operationId,
          otaEducationGuid: guid?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          found: true,
          timestamp: new Date().toISOString(),
        },
      );

      return mapInternalToResponse(record);
    } catch (error) {
      this.logger.error(
        `OTA education GUID lookup failed - Operation: ${operationId}`,
        {
          operation: 'findOneByGuid',
          operationId,
          otaEducationGuid: guid?.substring(0, 8) + '...',
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
   * Find education records by work declaration status with security and logging
   */
  async findByWorkDeclarationStatus(
    hasWorkDeclaration: boolean,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<Record<string, unknown>[]> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Permission checking for read operations
    if (!canRead(userRole)) {
      this.logger.warn(
        `OTA education work declaration lookup denied - Operation: ${operationId}`,
        {
          operation: 'findByWorkDeclarationStatus',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OTA education work declaration lookup',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByWorkDeclarationStatus',
      });
    }

    try {
      this.logger.log(
        `OTA education work declaration lookup initiated - Operation: ${operationId}`,
        {
          operation: 'findByWorkDeclarationStatus',
          operationId,
          hasWorkDeclaration,
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      let filter: string;
      if (hasWorkDeclaration) {
        filter = `osot_work_declaration ne null and osot_work_declaration ne ''`;
      } else {
        filter = `osot_work_declaration eq null or osot_work_declaration eq ''`;
      }

      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      const dataverseResponse = response as DataverseResponse;
      const result = dataverseResponse?.value || [];

      this.logger.log(
        `OTA education work declaration lookup completed - Operation: ${operationId}`,
        {
          operation: 'findByWorkDeclarationStatus',
          operationId,
          hasWorkDeclaration,
          count: result.length,
          timestamp: new Date().toISOString(),
        },
      );

      return result;
    } catch (error) {
      this.logger.error(
        `OTA education work declaration lookup failed - Operation: ${operationId}`,
        {
          operation: 'findByWorkDeclarationStatus',
          operationId,
          hasWorkDeclaration,
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findByWorkDeclarationStatus',
        operationId,
        hasWorkDeclaration,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education records by college with security
   */
  async findByCollege(
    college: OtaCollege,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<Record<string, unknown>[]> {
    // Permission checking
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OTA education college lookup',
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByCollege',
      });
    }

    try {
      const filter = `osot_ota_college eq ${college}`;
      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

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
        operation: 'findByCollege',
        college,
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
    userRole?: string,
  ): Promise<Record<string, unknown>[]> {
    // Permission checking
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OTA education graduation year lookup',
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByGraduationYear',
      });
    }

    try {
      const filter = `osot_ota_grad_year eq ${graduationYear}`;
      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

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
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education records by education category
   */
  async findByEducationCategory(
    educationCategory: EducationCategory,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<Record<string, unknown>[]> {
    // Permission checking
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OTA education category lookup',
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByEducationCategory',
      });
    }

    try {
      const filter = `osot_education_category eq ${educationCategory}`;
      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

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
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education records by country
   */
  async findByCountry(
    country: Country,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<Record<string, unknown>[]> {
    // Permission checking
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OTA education country lookup',
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByCountry',
      });
    }

    try {
      const filter = `osot_ota_country eq ${country}`;
      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

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
        originalError: error instanceof Error ? error.message : 'Unknown error',
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
  ): Promise<OtaEducationResponseDto | null> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Redact sensitive data for logging (show only first 4 characters)
    const redactedBusinessId = userBusinessId?.substring(0, 4) + '...';

    this.logger.log(
      `OTA education Business ID lookup initiated - Operation: ${operationId}`,
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
        `OTA education Business ID lookup denied - insufficient privileges - Operation: ${operationId}`,
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
        message: 'Access denied to OTA education business ID lookup',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByUserBusinessId',
      });
    }

    try {
      const record =
        await this.otaEducationRepository.findByUserBusinessId(userBusinessId);

      this.logger.log(
        `OTA education Business ID lookup completed - Operation: ${operationId}`,
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
        `OTA education Business ID lookup failed - Operation: ${operationId}`,
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
   * Returns all OTA education records associated with a specific account
   */
  async findByAccountId(
    accountId: string,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<OtaEducationResponseDto[]> {
    const operationId = Math.random().toString(36).substring(2, 15);

    this.logger.log(
      `OTA education Account lookup initiated - Operation: ${operationId}`,
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
        `OTA education Account lookup denied - insufficient privileges - Operation: ${operationId}`,
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
        message: 'Access denied to OTA education account lookup',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByAccountId',
      });
    }

    try {
      const records =
        await this.otaEducationRepository.findByAccountId(accountId);

      this.logger.log(
        `OTA education Account lookup completed - Operation: ${operationId}`,
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
        `OTA education Account lookup failed - Operation: ${operationId}`,
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
   * Find education records with work declarations
   */
  async findWithWorkDeclarations(
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<Record<string, unknown>[]> {
    // Permission checking
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OTA education work declarations lookup',
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findWithWorkDeclarations',
      });
    }

    try {
      const filter = `osot_work_declaration ne null and osot_work_declaration ne ''`;
      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

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
        operation: 'findWithWorkDeclarations',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find new graduates (recent graduation years)
   */
  async findNewGraduates(
    currentYear?: number,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<Record<string, unknown>[]> {
    // Permission checking
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OTA education new graduates lookup',
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findNewGraduates',
      });
    }

    try {
      const year = currentYear || new Date().getFullYear();
      const cutoffYear = year - 2; // Last 2 years considered "new"

      const filter = `osot_ota_grad_year ge ${cutoffYear}`;
      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

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
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find international education records (non-Canadian)
   */
  async findInternationalEducation(
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<Record<string, unknown>[]> {
    // Permission checking
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OTA education international lookup',
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findInternationalEducation',
      });
    }

    try {
      const filter = `osot_ota_country ne ${Country.CANADA}`;
      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

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
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education records by degree type
   */
  async findByDegreeType(
    degreeType: DegreeType,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<Record<string, unknown>[]> {
    // Permission checking
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OTA education degree type lookup',
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByDegreeType',
      });
    }

    try {
      const filter = `osot_ota_degree_type eq ${degreeType}`;
      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

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
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find Canadian college education records
   */
  async findCanadianCollegeEducation(
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    try {
      // Find records with Canadian colleges (excluding OTHER and NOT_APPLICABLE)
      const filter = `osot_ota_country eq ${Country.CANADA} and osot_ota_college ne ${OtaCollege.OTHER} and osot_ota_college ne ${OtaCollege.NOT_APPLICABLE}`;
      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

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
        operation: 'findCanadianCollegeEducation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education records requiring verification
   */
  async findRequiringVerification(
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    try {
      // Find international education OR "Other" college selections
      const filter = `osot_ota_country ne ${Country.CANADA} or osot_ota_college eq ${OtaCollege.OTHER}`;
      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

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
        operation: 'findRequiringVerification',
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
      workDeclaration?: boolean;
      college?: OtaCollege;
      graduationYear?: GraduationYear;
      educationCategory?: EducationCategory;
      country?: Country;
      degreeType?: DegreeType;
      requiresVerification?: boolean;
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
        `OTA education criteria search denied - Operation: ${operationId}`,
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
        message: 'Access denied to OTA education criteria search',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findWithCriteria',
      });
    }

    try {
      this.logger.log(
        `OTA education criteria search initiated - Operation: ${operationId}`,
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
      if (criteria.workDeclaration !== undefined) {
        if (criteria.workDeclaration) {
          filters.push(
            `osot_work_declaration ne null and osot_work_declaration ne ''`,
          );
        } else {
          filters.push(
            `osot_work_declaration eq null or osot_work_declaration eq ''`,
          );
        }
      }
      if (criteria.college !== undefined) {
        filters.push(`osot_ota_college eq ${criteria.college}`);
      }
      if (criteria.graduationYear !== undefined) {
        filters.push(`osot_ota_grad_year eq ${criteria.graduationYear}`);
      }
      if (criteria.educationCategory !== undefined) {
        filters.push(
          `osot_education_category eq ${criteria.educationCategory}`,
        );
      }
      if (criteria.country !== undefined) {
        filters.push(`osot_ota_country eq ${criteria.country}`);
      }
      if (criteria.degreeType !== undefined) {
        filters.push(`osot_ota_degree_type eq ${criteria.degreeType}`);
      }
      if (criteria.requiresVerification !== undefined) {
        if (criteria.requiresVerification) {
          filters.push(
            `osot_ota_country ne ${Country.CANADA} or osot_ota_college eq ${OtaCollege.OTHER}`,
          );
        } else {
          filters.push(
            `osot_ota_country eq ${Country.CANADA} and osot_ota_college ne ${OtaCollege.OTHER}`,
          );
        }
      }

      // Build query
      let endpoint = OTA_EDUCATION_ODATA.TABLE_NAME;
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
        `OTA education criteria search completed - Operation: ${operationId}`,
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
        `OTA education criteria search failed - Operation: ${operationId}`,
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
    byWorkDeclarationStatus: Record<string, number>;
    byCollege: Record<string, number>;
    byCountry: Record<string, number>;
    byEducationCategory: Record<string, number>;
    byDegreeType: Record<string, number>;
    byGraduationYear: Record<string, number>;
    internationalEducationCount: number;
    verificationRequiredCount: number;
  }> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Enhanced permission checking
    if (!canRead(userRole)) {
      this.logger.warn(
        `OTA education statistics denied - Operation: ${operationId}`,
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
        message: 'Access denied to OTA education statistics',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'getEducationStatistics',
      });
    }

    try {
      this.logger.log(
        `OTA education statistics generation initiated - Operation: ${operationId}`,
        {
          operation: 'getEducationStatistics',
          operationId,
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      // Get all records for statistics
      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$count=true`;
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
      const byWorkDeclarationStatus: Record<string, number> = {
        'With Declaration': 0,
        'Without Declaration': 0,
      };
      const byCollege: Record<string, number> = {};
      const byCountry: Record<string, number> = {};
      const byEducationCategory: Record<string, number> = {};
      const byDegreeType: Record<string, number> = {};
      const byGraduationYear: Record<string, number> = {};
      let internationalEducationCount = 0;
      let verificationRequiredCount = 0;

      records.forEach((record: EducationRecord) => {
        // Work Declaration statistics
        if (record.osot_work_declaration) {
          byWorkDeclarationStatus['With Declaration']++;
        } else {
          byWorkDeclarationStatus['Without Declaration']++;
        }

        // College statistics
        const college = String(record.osot_ota_college || 'Unknown');
        byCollege[college] = (byCollege[college] || 0) + 1;

        // Country statistics
        const country = String(record.osot_ota_country || 'Unknown');
        byCountry[country] = (byCountry[country] || 0) + 1;

        // International education count
        if (country !== String(Country.CANADA)) {
          internationalEducationCount++;
        }

        // Verification required count
        if (
          country !== String(Country.CANADA) ||
          college === String(OtaCollege.OTHER)
        ) {
          verificationRequiredCount++;
        }

        // Education Category statistics
        const category = String(record.osot_education_category || 'Unknown');
        byEducationCategory[category] =
          (byEducationCategory[category] || 0) + 1;

        // Degree Type statistics
        const degreeType = String(record.osot_ota_degree_type || 'Unknown');
        byDegreeType[degreeType] = (byDegreeType[degreeType] || 0) + 1;

        // Graduation Year statistics
        const gradYear = String(record.osot_ota_grad_year || 'Unknown');
        byGraduationYear[gradYear] = (byGraduationYear[gradYear] || 0) + 1;
      });

      const result = {
        totalRecords,
        byWorkDeclarationStatus,
        byCollege,
        byCountry,
        byEducationCategory,
        byDegreeType,
        byGraduationYear,
        internationalEducationCount,
        verificationRequiredCount,
      };

      this.logger.log(
        `OTA education statistics generated successfully - Operation: ${operationId}`,
        {
          operation: 'getEducationStatistics',
          operationId,
          totalRecords: result.totalRecords,
          uniqueColleges: Object.keys(result.byCollege).length,
          uniqueCountries: Object.keys(result.byCountry).length,
          timestamp: new Date().toISOString(),
        },
      );

      return result;
    } catch (error) {
      this.logger.error(
        `OTA education statistics generation failed - Operation: ${operationId}`,
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

  /**
   * Search education records by work declaration content
   */
  async searchByWorkDeclarationContent(
    searchTerm: string,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<Record<string, unknown>[]> {
    // Permission checking
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OTA education work declaration search',
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'searchByWorkDeclarationContent',
      });
    }

    try {
      const filter = `contains(osot_work_declaration, '${searchTerm}')`;
      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

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
        operation: 'searchByWorkDeclarationContent',
        searchTerm,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find education records by experience level (based on graduation year)
   */
  async findByExperienceLevel(
    experienceLevel: 'new' | 'mid' | 'senior',
    currentYear?: number,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<Record<string, unknown>[]> {
    // Permission checking
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OTA education experience level lookup',
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByExperienceLevel',
      });
    }

    try {
      const year = currentYear || new Date().getFullYear();
      let filter: string;

      switch (experienceLevel) {
        case 'new':
          // 0-2 years experience
          filter = `osot_ota_grad_year ge ${year - 2}`;
          break;
        case 'mid':
          // 3-9 years experience
          filter = `osot_ota_grad_year le ${year - 3} and osot_ota_grad_year ge ${year - 9}`;
          break;
        case 'senior':
          // 10+ years experience
          filter = `osot_ota_grad_year le ${year - 10}`;
          break;
        default:
          throw createAppError(ErrorCodes.INVALID_INPUT, {
            experienceLevel,
            validLevels: ['new', 'mid', 'senior'],
          });
      }

      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}`;

      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      const dataverseResponse = response as DataverseResponse;
      return dataverseResponse?.value || [];
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findByExperienceLevel',
        experienceLevel,
        currentYear,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
