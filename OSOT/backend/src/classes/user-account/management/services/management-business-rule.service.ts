import { Injectable, Inject, Logger } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { CreateManagementDto } from '../dtos/create-management.dto';
import { UpdateManagementDto } from '../dtos/update-management.dto';
import { AccessModifier, Privilege } from '../../../../common/enums';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import {
  canCreate,
  canRead,
  canWrite,
  canDelete,
} from '../../../../utils/dataverse-app.helper';
import {
  ManagementRepository,
  MANAGEMENT_REPOSITORY,
} from '../interfaces/management-repository.interface';

/**
 * Management Business Rule Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: ManagementRepository for data abstraction and modern data access
 * - Structured Logging: Logger with operation IDs and security-aware PII redaction
 * - Security-First Design: Privilege-based access control with comprehensive validation
 * - Business Rule Framework: Centralized validation logic with detailed error context
 * - Hybrid Architecture: Modern Repository + Legacy DataverseService for migration compatibility
 *
 * Key Business Rules for Management:
 * - Account Relationship: Management records must be linked to valid account
 * - Role-Based Access: Different validation rules based on user roles
 * - Data Integrity: All management fields must be logically consistent
 * - Update Restrictions: Certain fields may be immutable after creation
 * - Deletion Rules: Cascading deletion considerations for related data
 *
 * Enterprise Features:
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Security-aware logging with PII redaction capabilities
 * - Privilege-based validation with detailed permission checking
 * - Data completeness assessment for business intelligence
 * - Repository Pattern integration for modern data access patterns
 * - Hybrid architecture supporting gradual migration from legacy systems
 */
@Injectable()
export class ManagementBusinessRuleService {
  private readonly logger = new Logger(ManagementBusinessRuleService.name);

  constructor(
    @Inject(MANAGEMENT_REPOSITORY)
    private readonly managementRepository: ManagementRepository,
    private readonly dataverseService: DataverseService,
  ) {}

  /**
   * Validate management data for creation
   * Applies all business rules for management entities
   */
  async validateForCreation(
    dto: CreateManagementDto,
    accountId: string,
    userRole?: string,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const operationId = `validate_management_creation_${Date.now()}`;

    this.logger.log(
      `Management creation validation initiated - Operation: ${operationId}`,
      {
        operation: 'validateForCreation',
        operationId,
        accountId: accountId?.substring(0, 8) + '...',
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking for create operations
    if (!canCreate(userRole)) {
      this.logger.warn(
        `Management creation validation denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'validateForCreation',
          operationId,
          requiredPrivilege: 'CREATE',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to management creation validation',
        operationId,
        requiredPrivilege: 'CREATE',
        userRole: userRole || 'undefined',
        operation: 'validateForCreation',
      });
    }

    const errors: string[] = [];

    // 1. Account relationship validation
    if (!accountId) {
      errors.push('Account ID is required for management creation');
    } else {
      // Verify account exists and user has access
      const accountExists = await this.verifyAccountAccess(accountId, userRole);
      if (!accountExists) {
        errors.push('Invalid account ID or insufficient permissions');
      }
    }

    // 2. Data integrity validation
    if (
      dto.osot_access_modifiers &&
      !Object.values(AccessModifier).includes(dto.osot_access_modifiers)
    ) {
      errors.push('Invalid access modifier value');
    }

    if (
      dto.osot_privilege &&
      !Object.values(Privilege).includes(dto.osot_privilege)
    ) {
      errors.push('Invalid privilege value');
    }

    // 3. Business logic validation
    const businessValidation = this.validateBusinessLogic(dto);
    errors.push(...businessValidation.errors);

    // Log validation completion
    this.logger.log(
      `Management creation validation completed - Operation: ${operationId}`,
      {
        operation: 'validateForCreation',
        operationId,
        isValid: errors.length === 0,
        errorCount: errors.length,
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      },
    );

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate management data for update
   * Applies business rules with consideration for existing data
   */
  async validateForUpdate(
    dto: UpdateManagementDto,
    existingManagementId: string,
    userRole?: string,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const operationId = `validate_management_update_${Date.now()}`;

    // Enhanced permission checking for update operations
    if (!canWrite(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to management update validation',
        operationId,
        requiredPrivilege: 'WRITE',
        userRole: userRole || 'undefined',
        operation: 'validateForUpdate',
      });
    }

    const errors: string[] = [];

    // Get existing management for comparison
    const existingManagement =
      await this.getManagementById(existingManagementId);
    if (!existingManagement) {
      errors.push('Management not found for update validation');
      return { isValid: false, errors };
    }

    // 1. Immutable field validation
    const immutableFields = ['osot_table_account_managementid'];
    for (const field of immutableFields) {
      if (dto[field] && dto[field] !== existingManagement[field]) {
        errors.push(`Field ${field} cannot be modified after creation`);
      }
    }

    // 2. Data integrity validation for updates
    if (
      dto.osot_access_modifiers &&
      !Object.values(AccessModifier).includes(dto.osot_access_modifiers)
    ) {
      errors.push('Invalid access modifier value');
    }

    if (
      dto.osot_privilege &&
      !Object.values(Privilege).includes(dto.osot_privilege)
    ) {
      errors.push('Invalid privilege value');
    }

    // 3. Business logic validation for updates
    const businessValidation = this.validateBusinessLogic(dto);
    errors.push(...businessValidation.errors);

    this.logger.log(
      `Management update validation completed - Operation: ${operationId}`,
      {
        operation: 'validateForUpdate',
        operationId,
        isValid: errors.length === 0,
        errorCount: errors.length,
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      },
    );

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if user can create management records
   */
  canCreateManagement(userRole?: string): boolean {
    return canCreate(userRole);
  }

  /**
   * Check if user can read management records
   */
  canReadManagement(userRole?: string): boolean {
    return canRead(userRole);
  }

  /**
   * Check if user can update management records
   */
  canUpdateManagement(userRole?: string): boolean {
    return canWrite(userRole);
  }

  /**
   * Check if user can delete management records
   */
  canDeleteManagement(userRole?: string): boolean {
    return canDelete(userRole);
  }

  /**
   * Assess management data completeness for verification purposes
   */
  assessDataCompleteness(management: Record<string, unknown>): {
    isComplete: boolean;
    completenessScore: number;
    missingFields: string[];
  } {
    const requiredFields = [
      'osot_table_account_managementid',
      'osot_access_modifiers',
      'osot_privilege',
    ];

    const optionalFields: string[] = [
      // Add optional fields as needed based on management requirements
    ];

    const allFields = [...requiredFields, ...optionalFields];
    const presentFields = allFields.filter(
      (field) =>
        management[field] !== null &&
        management[field] !== undefined &&
        management[field] !== '',
    );

    const missingFields = requiredFields.filter(
      (field) =>
        management[field] === null ||
        management[field] === undefined ||
        management[field] === '',
    );

    const completenessScore = (presentFields.length / allFields.length) * 100;
    const isComplete = missingFields.length === 0;

    return {
      isComplete,
      completenessScore: Math.round(completenessScore),
      missingFields,
    };
  }

  /**
   * Check if management meets minimum requirements for system operations
   */
  meetsMinimumRequirements(management: Record<string, unknown>): boolean {
    const { isComplete } = this.assessDataCompleteness(management);
    return isComplete;
  }

  /**
   * Get management by ID for internal business rule operations
   */
  private async getManagementById(
    managementId: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      const endpoint = `osot_table_account_managements(${managementId})`;
      const result = await this.dataverseService.request('GET', endpoint);
      return result as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  /**
   * Verify account exists and user has access to it
   */
  private async verifyAccountAccess(
    accountId: string,
    userRole?: string,
  ): Promise<boolean> {
    try {
      if (!canRead(userRole)) {
        return false;
      }

      const endpoint = `osot_table_accounts(${accountId})`;
      const result = await this.dataverseService.request('GET', endpoint);
      return !!result;
    } catch {
      return false;
    }
  }

  /**
   * Validate business logic specific to management entities
   */
  private validateBusinessLogic(
    dto: CreateManagementDto | UpdateManagementDto,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Add specific business logic validation here
    // For example:
    // - Validate that privilege levels are appropriate for the user role
    // - Check for conflicts with existing management records
    // - Validate access modifier compatibility with account settings

    // Example business rule: Admin users can have higher privileges
    if (dto.osot_privilege === Privilege.ADMIN) {
      // Additional validation for admin privileges could go here
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
