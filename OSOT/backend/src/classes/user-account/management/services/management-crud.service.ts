import { Injectable, Inject, Logger } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import {
  canCreate,
  canRead,
  canWrite,
  canDelete,
} from '../../../../utils/dataverse-app.helper';

// Repository Pattern Integration
import {
  ManagementRepository,
  MANAGEMENT_REPOSITORY,
} from '../interfaces/management-repository.interface';

// DTOs
import { CreateManagementDto } from '../dtos/create-management.dto';
import { UpdateManagementDto } from '../dtos/update-management.dto';
import { ManagementResponseDto } from '../dtos/management-response.dto';

// Mappers
import {
  mapCreateDtoToInternal,
  mapUpdateDtoToInternal,
  mapInternalToDataverse,
  mapDataverseToInternal,
  mapInternalToResponseDto,
  mapCreateManagementForAccountDtoToInternal,
} from '../mappers/management.mapper';

/**
 * Management CRUD Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with ManagementRepository
 * - Structured Logging: Operation IDs, security-aware PII redaction capabilities
 * - Security-First Design: Role-based permission checking and field-level filtering
 * - Mapper Pattern: Automatic data transformation between layers
 * - Error Management: Centralized error handling with detailed context
 *
 * PERMISSION SYSTEM (Role-based):
 * - OWNER: Full CRUD access to all operations and fields
 * - ADMIN: Full CRUD access to all operations and fields
 * - MAIN: Limited access with sensitive field filtering
 * - Lower privileges: Read-only access with extensive field filtering
 *
 * ENTERPRISE FEATURES:
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Security-aware logging with PII redaction capabilities
 * - Role-based field filtering based on user permissions
 * - Repository pattern for clean data access abstraction
 * - Automatic data transformation using mappers
 * - Management structure hierarchy management
 * - Comprehensive error handling and logging
 *
 * Dependencies:
 * - ManagementRepository: Clean data access abstraction
 */
@Injectable()
export class ManagementCrudService {
  private readonly logger = new Logger(ManagementCrudService.name);

  constructor(
    @Inject(MANAGEMENT_REPOSITORY)
    private readonly managementRepository: ManagementRepository,
  ) {
    this.logger.log(
      'ManagementCrudService initialized with Enterprise patterns',
    );
  }

  /**
   * Create a new management record with basic validation
   */
  async create(
    createManagementDto: CreateManagementDto,
    userRole?: string,
  ): Promise<ManagementResponseDto | null> {
    const operationId = `management_create_${Date.now()}`;

    this.logger.log(
      `Starting management creation - Operation: ${operationId}`,
      {
        operation: 'create_management',
        operationId,
        userRole: userRole || 'undefined',
        hasUserBusinessId: !!createManagementDto.osot_user_business_id,
        timestamp: new Date().toISOString(),
      },
    );

    // Check create permissions
    if (!canCreate(userRole)) {
      this.logger.warn(
        `Management creation denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'create_management',
          operationId,
          requiredPrivilege: 'CREATE',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'create_management',
        operationId,
        message: 'Insufficient permissions to create management record',
        requiredRole: 'main or owner',
        currentRole: userRole,
      });
    }

    try {
      // Transform DTO to internal format using mapper
      const internalManagement = mapCreateDtoToInternal(createManagementDto);

      // Create the management record using repository (handles Dataverse transformation internally)
      const createdRecord =
        await this.managementRepository.create(internalManagement);

      // Transform response using mapper chain
      const internalResult = mapDataverseToInternal(createdRecord);
      const responseDto = mapInternalToResponseDto(internalResult);

      this.logger.log(
        `Management created successfully - Operation: ${operationId}`,
        {
          operation: 'create_management',
          operationId,
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Management creation failed - Operation: ${operationId}`,
        {
          operation: 'create_management',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );
      throw error;
    }
  }

  /**
   * Find a management record by its unique identifier
   */
  async findOne(
    id: string,
    userRole?: string,
  ): Promise<ManagementResponseDto | null> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Check read permissions
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Management findOne permission denied - Operation: ${operationId}`,
        {
          operation: 'find_management',
          operationId,
          userRole: userRole || 'undefined',
          requiredPermission: 'canRead',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'find_management',
        message: 'Insufficient permissions to read management record',
        requiredRole: 'main, admin, or owner',
        currentRole: userRole,
      });
    }

    try {
      this.logger.log(
        `Management findOne initiated - Operation: ${operationId}`,
        {
          operation: 'find_management',
          operationId,
          managementId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      const record = await this.managementRepository.findByGuid(id);

      if (!record) {
        this.logger.log(`Management not found - Operation: ${operationId}`, {
          operation: 'find_management',
          operationId,
          managementId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          found: false,
          timestamp: new Date().toISOString(),
        });
        return null;
      }

      // Transform response using mapper chain
      const internalResult = mapDataverseToInternal(record);
      const responseDto = mapInternalToResponseDto(internalResult);

      this.logger.log(
        `Management retrieved successfully - Operation: ${operationId}`,
        {
          operation: 'find_management',
          operationId,
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Management findOne failed - Operation: ${operationId}`,
        {
          operation: 'find_management',
          operationId,
          managementId: id?.substring(0, 8) + '...',
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );
      throw error;
    }
  }

  /**
   * Find management records by account ID
   */
  async findByAccountId(
    accountId: string,
    userRole?: string,
  ): Promise<ManagementResponseDto[]> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Check read permissions
    if (!canRead(userRole || '')) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'find_management_by_account',
        message: 'Insufficient permissions to read management records',
        requiredRole: 'main, admin, or owner',
        currentRole: userRole,
      });
    }

    try {
      this.logger.log(
        `Management findByAccountId initiated - Operation: ${operationId}`,
        {
          operation: 'find_management_by_account',
          operationId,
          accountId: accountId?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      const records =
        await this.managementRepository.findByAccountId(accountId);

      const responseDtos = records
        .map((record) => {
          const internalResult = mapDataverseToInternal(record);
          return mapInternalToResponseDto(internalResult);
        })
        .filter((dto): dto is ManagementResponseDto => dto !== null);

      this.logger.log(
        `Management findByAccountId completed - Operation: ${operationId}`,
        {
          operation: 'find_management_by_account',
          operationId,
          accountId: accountId?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          recordCount: responseDtos.length,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDtos;
    } catch (error) {
      this.logger.error(
        `Management findByAccountId failed - Operation: ${operationId}`,
        {
          operation: 'find_management_by_account',
          operationId,
          accountId: accountId?.substring(0, 8) + '...',
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );
      throw error;
    }
  }

  /**
   * Update a management record with comprehensive validation
   * Includes proper change tracking and event emission
   */
  async update(
    id: string,
    updateManagementDto: UpdateManagementDto,
    userRole?: string,
  ): Promise<ManagementResponseDto | null> {
    // Generate operation ID for tracking
    const operationId = `management-update-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    this.logger.log(`Starting management update - Operation: ${operationId}`, {
      operation: 'update',
      operationId,
      managementId: id,
      userRole,
      timestamp: new Date().toISOString(),
    });

    try {
      // Check write permissions
      if (!canWrite(userRole || '')) {
        this.logger.warn(
          `Permission denied for management update - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            managementId: id,
            requiredRole: 'main, admin, or owner',
            currentRole: userRole,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          operation: 'update',
          operationId,
          message: 'Insufficient permissions to update management record',
          requiredRole: 'main, admin, or owner',
          currentRole: userRole,
        });
      }

      // ID Resolution: Convert Business ID → GUID if needed
      const isBusinessId = /^osot-\d{7}$/.test(id);
      const isGuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        );

      let targetManagementId = id;

      if (isBusinessId) {
        // Find the management by business ID to get its GUID
        const management = await this.managementRepository.findByBusinessId(id);
        if (!management) {
          this.logger.error(
            `Management not found for update - Operation: ${operationId}`,
            {
              operation: 'update',
              operationId,
              managementId: id,
              idType: 'businessId',
              error: 'MANAGEMENT_NOT_FOUND',
              timestamp: new Date().toISOString(),
            },
          );

          throw createAppError(ErrorCodes.VALIDATION_ERROR, {
            message: 'Management not found for update',
            operationId,
            operation: 'update',
            resourceId: id,
          });
        }
        targetManagementId =
          management.osot_table_account_managementid as string;
        this.logger.debug(
          `Resolved business ID to GUID - Operation: ${operationId}`,
          {
            businessId: id,
            guid: targetManagementId,
            timestamp: new Date().toISOString(),
          },
        );
      } else if (!isGuid) {
        // Try to find by business ID first
        const managementByBusinessId =
          await this.managementRepository.findByBusinessId(id);
        if (managementByBusinessId) {
          targetManagementId =
            managementByBusinessId.osot_table_account_managementid as string;
        } else {
          targetManagementId = id;
        }
      }

      this.logger.debug(
        `Fetching existing management for validation - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          managementId: targetManagementId,
          timestamp: new Date().toISOString(),
        },
      );

      // Get existing management for validation context
      const existingManagement =
        await this.managementRepository.findByGuid(targetManagementId);
      if (!existingManagement) {
        this.logger.warn(
          `Management not found for update - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            managementId: id,
            targetManagementId,
            timestamp: new Date().toISOString(),
          },
        );
        return null;
      }

      this.logger.debug(
        `Transforming and updating management - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          managementId: targetManagementId,
          hasLifeMemberRetired:
            updateManagementDto.osot_life_member_retired !== undefined,
          hasShadowing: updateManagementDto.osot_shadowing !== undefined,
          hasVendor: updateManagementDto.osot_vendor !== undefined,
          timestamp: new Date().toISOString(),
        },
      );

      // Transform update DTO through mapper chain
      const internalUpdate = mapUpdateDtoToInternal(updateManagementDto);
      const dataverseUpdate = mapInternalToDataverse(internalUpdate);

      // Update the management record using Update-then-Fetch pattern
      const updatedRecord = await this.managementRepository.updateByGuid(
        targetManagementId,
        dataverseUpdate,
      );

      if (!updatedRecord) {
        this.logger.error(
          `Management update failed - Repository returned null - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            managementId: targetManagementId,
            error: 'REPOSITORY_NULL_RESPONSE',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.GENERIC, {
          message: 'Failed to update management - no data returned',
          operationId,
          managementId: targetManagementId,
          operation: 'update',
        });
      }

      // Transform response
      const internalResult = mapDataverseToInternal(updatedRecord);
      const responseDto = mapInternalToResponseDto(internalResult);

      if (!responseDto) {
        this.logger.error(
          `Failed to transform management response - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            managementId: targetManagementId,
            error: 'MAPPER_RETURNED_NULL',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.GENERIC, {
          message: 'Failed to update management - transformation error',
          operationId,
          managementId: targetManagementId,
          operation: 'update',
        });
      }

      this.logger.log(
        `Management updated successfully - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          managementId: targetManagementId,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Management update failed - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          managementId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
      );
      throw error;
    }
  }

  /**
   * Delete a management record
   * Includes proper cleanup and event emission
   */
  async delete(id: string, userRole?: string): Promise<boolean> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Check delete permissions
    if (!canDelete(userRole || '')) {
      this.logger.warn(
        `Management delete permission denied - Operation: ${operationId}`,
        {
          operation: 'delete_management',
          operationId,
          managementId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          requiredPermission: 'canDelete',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'delete_management',
        message: 'Insufficient permissions to delete management record',
        requiredRole: 'main',
        currentRole: userRole,
      });
    }

    try {
      this.logger.log(
        `Management delete initiated - Operation: ${operationId}`,
        {
          operation: 'delete_management',
          operationId,
          managementId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      // Get management before deletion for event context
      const existingManagement = await this.managementRepository.findByGuid(id);
      if (!existingManagement) {
        this.logger.log(
          `Management not found for deletion - Operation: ${operationId}`,
          {
            operation: 'delete_management',
            operationId,
            managementId: id?.substring(0, 8) + '...',
            userRole: userRole || 'undefined',
            found: false,
            timestamp: new Date().toISOString(),
          },
        );
        return false;
      }

      // Perform deletion
      await this.managementRepository.deleteByGuid(id);

      // Success logging (with PII redaction)
      this.logger.log(
        `Management deleted successfully - Operation: ${operationId}`,
        {
          operation: 'delete_management',
          operationId,
          managementId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          organizationRole:
            (existingManagement.osot_organization_role as string)?.substring(
              0,
              4,
            ) + '...',
          timestamp: new Date().toISOString(),
        },
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Management delete failed - Operation: ${operationId}`,
        {
          operation: 'delete_management',
          operationId,
          managementId: id?.substring(0, 8) + '...',
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );
      return false;
    }
  }

  /**
   * Get management data completeness assessment
   * Returns analysis of how complete a management record is
   */
  async getDataCompletenessAssessment(id: string): Promise<{
    completenessScore: number;
    missingFields: string[];
    recommendations: string[];
  }> {
    const managementRecord = await this.managementRepository.findByGuid(id);
    if (!managementRecord) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Management record not found for completeness assessment',
        managementId: id,
      });
    }

    const missingFields: string[] = [];
    const recommendations: string[] = [];

    // Check required fields
    if (!managementRecord.osot_organization_role) {
      missingFields.push('osot_organization_role');
      recommendations.push('Add organization role information');
    }

    if (
      managementRecord.osot_is_vendor === null ||
      managementRecord.osot_is_vendor === undefined
    ) {
      missingFields.push('osot_is_vendor');
      recommendations.push('Specify vendor status');
    }

    // Check optional but important fields
    if (!managementRecord.osot_recruitment_source) {
      missingFields.push('osot_recruitment_source');
      recommendations.push('Add recruitment source information');
    }

    if (!managementRecord.osot_shadowing_opportunity) {
      missingFields.push('osot_shadowing_opportunity');
      recommendations.push('Specify shadowing opportunity details');
    }

    const totalFields = 8; // Total expected fields for management
    const completedFields = totalFields - missingFields.length;
    const completenessScore = Math.round((completedFields / totalFields) * 100);

    return {
      completenessScore,
      missingFields,
      recommendations,
    };
  }

  // ========================================
  // ACCOUNT INTEGRATION METHODS
  // ========================================

  /**
   * Create management record for account integration
   * Simplified creation process with safe defaults and minimal validation
   *
   * This method is specifically designed for Account creation workflow:
   * - Bypasses complex business rule validation
   * - Uses safe defaults for all optional fields
   * - Fast execution for high-volume account registration
   * - Minimal required data (only business ID)
   *
   * @param dto - Simplified DTO with minimal required fields
   * @returns Created management record as response DTO
   */
  async createForAccountIntegration(
    dto: import('../dtos/create-management-for-account.dto').CreateManagementForAccountDto,
  ): Promise<ManagementResponseDto> {
    const operationId = `create_management_for_account_${Date.now()}`;

    this.logger.log(
      `Creating management record for account integration - Operation: ${operationId}`,
      {
        operation: 'createForAccountIntegration',
        operationId,
        hasFlags: Object.keys(dto).length > 0,
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Transform to Internal format using the specific mapper
      const managementInternal =
        mapCreateManagementForAccountDtoToInternal(dto);

      // Create the management record using repository (handles Dataverse transformation internally)
      const createdRecord =
        await this.managementRepository.create(managementInternal);

      // Transform response using mapper chain
      const internalResult = mapDataverseToInternal(createdRecord);
      const responseDto = mapInternalToResponseDto(internalResult);

      this.logger.log(
        `Management record created successfully for account integration - Operation: ${operationId}`,
        {
          operation: 'createForAccountIntegration',
          operationId,
          managementId: responseDto.osot_account_management_id,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Management creation failed for account integration - Operation: ${operationId}`,
        {
          operation: 'createForAccountIntegration',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'createForAccountIntegration',
        operationId,
        message: 'Failed to create management record for account',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
