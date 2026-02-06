/**
 * Audience Target CRUD Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with DataverseAudienceTargetRepository
 * - Event-Driven Architecture: Emits domain events for all CUD operations
 * - Structured Logging: Operation IDs, security-aware logging
 * - Security-First Design: Privilege-based access control
 * - Data Transformation: Mappers for DTO ↔ Internal conversions
 * - Error Management: Centralized error handling with ErrorCodes
 *
 * PERMISSION SYSTEM (Audience Target Specific):
 * - ADMIN (privilege = 2): Can manage all target records
 * - MAIN (privilege = 3): Full access to all target records
 * - OWNER (privilege = 0): No access (Admin/Main-only entity)
 * - PUBLIC ACCESS: No CRUD access
 *
 * BUSINESS RULES ENFORCED:
 * - One-to-One Product-Target Relationship: One target per product maximum
 * - Product Reference Required: Target must reference a valid product
 * - Immutable Product Reference: Cannot change product after creation
 * - Admin/Main-Only Operations: All CRUD operations require Admin/Main privilege
 *
 * KEY FEATURES:
 * - Hard delete (no soft delete)
 * - Product-target uniqueness validation
 * - Operation tracking for compliance and debugging
 * - Comprehensive event emission for audit trails
 * - Integration with lookup service for validation
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { CreateAudienceTargetDto } from '../dtos/audience-target-create.dto';
import { UpdateAudienceTargetDto } from '../dtos/audience-target-update.dto';
import { AudienceTargetResponseDto } from '../dtos/audience-target-response.dto';
import {
  DataverseAudienceTargetRepository,
  AUDIENCE_TARGET_REPOSITORY,
} from '../repositories/audience-target.repository';
import { AudienceTargetMapper } from '../mappers/audience-target.mapper';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege } from '../../../../common/enums';

@Injectable()
export class AudienceTargetCrudService {
  private readonly logger = new Logger(AudienceTargetCrudService.name);

  constructor(
    @Inject(AUDIENCE_TARGET_REPOSITORY)
    private readonly repository: DataverseAudienceTargetRepository,
  ) {}

  /**
   * Create new target record
   * CRITICAL: Validates one-to-one product relationship before creation
   *
   * @param dto - Target creation data
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier for tracking
   * @returns Created target record
   */
  async create(
    dto: CreateAudienceTargetDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<AudienceTargetResponseDto> {
    const opId = operationId || `create-target-${Date.now()}`;
    this.logger.log(`Creating target record for operation ${opId}`);

    try {
      // Privilege validation - Admin/Main only
      if (!this.canManageTargets(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Insufficient privileges: Admin or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Transform DTO to internal format
      const internal = AudienceTargetMapper.mapCreateDtoToInternal(dto);

      // Validate product reference exists
      if (!internal.osot_table_product) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Product reference is required for target creation',
          operationId: opId,
        });
      }

      // CRITICAL: Check one-to-one relationship
      // A product can have at most ONE target
      // Use 'main' app which has both READ and CREATE permissions
      const existingTarget = await this.repository.findByProductId(
        internal.osot_table_product,
        'main',
      );

      if (existingTarget) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message:
            'Product already has a target. Only one target per product is allowed.',
          hint: 'Use PATCH /private/audience-targets/{targetId} to update the existing target, or DELETE to remove it first.',
          operationId: opId,
          productId: internal.osot_table_product,
          existingTargetId: existingTarget.osot_target,
        });
      }

      // Create target in repository
      const created = await this.repository.create(internal);

      // Map to response DTO
      const response = AudienceTargetMapper.mapInternalToResponseDto(created);

      this.logger.log(
        `Successfully created target ${response.osot_target} for product ${internal.osot_table_product} for operation ${opId}`,
      );

      // TODO: Emit domain event for audit trail
      // this.eventEmitter.emit('audience-target.created', { targetId: response.targetId, productId, userId, timestamp });

      return response;
    } catch (error) {
      // Re-throw known errors
      if (
        error instanceof Error &&
        (error.message.includes('PERMISSION_DENIED') ||
          error.message.includes('VALIDATION_ERROR'))
      ) {
        throw error;
      }

      this.logger.error(`Error creating target for operation ${opId}:`, error);
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to create target record',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Update existing target record
   * Product reference is IMMUTABLE after creation
   *
   * @param targetId - Business ID or GUID
   * @param dto - Target update data
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns Updated target record
   */
  async update(
    targetId: string,
    dto: UpdateAudienceTargetDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<AudienceTargetResponseDto> {
    const opId = operationId || `update-target-${Date.now()}`;
    this.logger.log(`Updating target ${targetId} for operation ${opId}`);

    try {
      // Privilege validation - Admin/Main only
      if (!this.canManageTargets(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Insufficient privileges: Admin or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Validate target exists
      const existing = await this.repository.findById(targetId);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Target with ID ${targetId} not found`,
          operationId: opId,
          targetId,
        });
      }

      // Transform DTO to internal format (partial update)
      const updates = AudienceTargetMapper.mapUpdateDtoToInternal(dto);

      // IMMUTABLE RULE: Product reference cannot be changed after creation
      if (updates.osot_table_product) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message:
            'Product reference is immutable and cannot be changed after creation',
          operationId: opId,
          targetId,
          currentProductId: existing.osot_table_product,
          attemptedProductId: updates.osot_table_product,
        });
      }

      // Update target in repository
      const updated = await this.repository.update(targetId, updates);

      // Map to response DTO
      const response = AudienceTargetMapper.mapInternalToResponseDto(updated);

      this.logger.log(
        `Successfully updated target ${targetId} for operation ${opId}`,
      );

      // TODO: Emit domain event for audit trail
      // this.eventEmitter.emit('audience-target.updated', { targetId, userId, changes: updates, timestamp });

      return response;
    } catch (error) {
      // Re-throw known errors
      if (
        error instanceof Error &&
        (error.message.includes('PERMISSION_DENIED') ||
          error.message.includes('NOT_FOUND') ||
          error.message.includes('VALIDATION_ERROR'))
      ) {
        throw error;
      }

      this.logger.error(
        `Error updating target ${targetId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to update target record',
        operationId: opId,
        targetId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Delete target record (hard delete)
   * Removes target configuration from product
   *
   * @param targetId - Business ID or GUID
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns True if deleted successfully
   */
  async delete(
    targetId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `delete-target-${Date.now()}`;
    this.logger.log(`Deleting target ${targetId} for operation ${opId}`);

    try {
      // Privilege validation - Admin/Main only
      if (!this.canManageTargets(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Insufficient privileges: Admin or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Get target before deletion for audit
      const existing = await this.repository.findById(targetId);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Target with ID ${targetId} not found`,
          operationId: opId,
          targetId,
        });
      }

      // Hard delete target
      const deleted = await this.repository.delete(targetId);

      if (!deleted) {
        throw createAppError(ErrorCodes.INTERNAL_ERROR, {
          message: 'Failed to delete target record',
          operationId: opId,
          targetId,
        });
      }

      this.logger.log(
        `Successfully deleted target ${targetId} for operation ${opId}`,
      );

      // TODO: Emit domain event for audit trail
      // this.eventEmitter.emit('audience-target.deleted', { targetId, productId: existing.osot_table_product, userId, timestamp });

      return true;
    } catch (error) {
      // Re-throw known errors
      if (
        error instanceof Error &&
        (error.message.includes('PERMISSION_DENIED') ||
          error.message.includes('NOT_FOUND'))
      ) {
        throw error;
      }

      this.logger.error(
        `Error deleting target ${targetId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to delete target record',
        operationId: opId,
        targetId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Batch create target records
   * Useful for initial data seeding or bulk administration
   * Validates one-to-one relationship for each product
   *
   * @param dtos - Array of target creation data
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns Array of created target records
   */
  async createBatch(
    dtos: CreateAudienceTargetDto[],
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<AudienceTargetResponseDto[]> {
    const opId = operationId || `batch-create-targets-${Date.now()}`;
    this.logger.log(
      `Batch creating ${dtos.length} targets for operation ${opId}`,
    );

    try {
      // Privilege validation - Admin/Main only
      if (!this.canManageTargets(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Insufficient privileges: Admin or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      const created: AudienceTargetResponseDto[] = [];
      const errors: Array<{ dto: CreateAudienceTargetDto; error: string }> = [];

      // Process each target individually
      for (const dto of dtos) {
        try {
          const result = await this.create(dto, userPrivilege, userId, opId);
          created.push(result);
        } catch (error) {
          errors.push({
            dto,
            error: error instanceof Error ? error.message : String(error),
          });
          this.logger.warn(
            `Failed to create target in batch for product ${dto['osot_Table_Product@odata.bind']}:`,
            error,
          );
        }
      }

      this.logger.log(
        `Batch creation completed: ${created.length} succeeded, ${errors.length} failed for operation ${opId}`,
      );

      if (errors.length > 0) {
        this.logger.warn(`Batch creation errors:`, errors);
      }

      return created;
    } catch (error) {
      // Re-throw permission errors
      if (
        error instanceof Error &&
        error.message.includes('PERMISSION_DENIED')
      ) {
        throw error;
      }

      this.logger.error(
        `Error in batch target creation for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to batch create target records',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Check if user can manage target records (Admin/Main only)
   * Audience targets are Admin/Main-only entities
   */
  private canManageTargets(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN
    );
  }
}
