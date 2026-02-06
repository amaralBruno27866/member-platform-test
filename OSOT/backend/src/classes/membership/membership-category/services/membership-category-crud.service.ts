/**
 * Membership Category CRUD Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with MembershipCategoryRepositoryService
 * - Structured Logging: Operation IDs, security-aware logging
 * - Security-First Design: Admin/Main privilege requirement for CUD operations
 * - Data Transformation: Mappers for DTO ↔ Internal conversions
 * - Error Management: Centralized error handling with ErrorCodes
 *
 * PERMISSION SYSTEM (Membership Category Specific):
 * - ADMIN (privilege = 2): Create, Read, Delete access to membership category operations
 * - MAIN (privilege = 3): Create, Read, Delete access to membership category operations
 * - PUBLIC ACCESS: No direct CRUD access (handled via lookup service)
 * - OTHER PRIVILEGES: No CRUD access
 *
 * BUSINESS RULE: Membership categories are immutable once created.
 * Updates are not allowed via API and must be done directly in Dataverse.
 *
 * CURRENT IMPLEMENTATION STATUS:
 * - CREATE: ✅ Implemented
 * - READ: ✅ Implemented (by ID and business ID)
 * - UPDATE: ❌ Not supported (immutable after creation)
 * - DELETE: ✅ Implemented
 *
 * Key Features:
 * - Admin/Main privilege requirement for CUD operations
 * - User reference exclusivity enforcement (Account XOR Affiliate)
 * - Category-specific business rules (retirement dates, parental leave)
 * - Business ID auto-generation with format osot-cat-XXXXXXX
 * - Operation tracking for compliance and debugging
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { MembershipCategoryCreateDto } from '../dtos/membership-category-create.dto';
import { MembershipCategoryResponseDto } from '../dtos/membership-category-response.dto';
import {
  UserCreationData,
  isAccountUserCreationData,
} from '../types/user-creation-data.types';
import { MembershipCategoryBusinessRuleService } from './membership-category-business-rule.service';
import {
  MembershipCategoryRepositoryService,
  MEMBERSHIP_CATEGORY_REPOSITORY,
} from '../repositories/membership-category.repository';
import {
  mapDataverseToInternal,
  mapInternalToResponse,
  mapCreateDtoToDataverse,
} from '../mappers/membership-category.mapper';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege } from '../../../../common/enums';
import { MembershipCategoryDataverse } from '../interfaces/membership-category-dataverse.interface';

@Injectable()
export class MembershipCategoryCrudService {
  private readonly logger = new Logger(MembershipCategoryCrudService.name);

  constructor(
    @Inject(MEMBERSHIP_CATEGORY_REPOSITORY)
    private readonly repository: MembershipCategoryRepositoryService,
    private readonly businessRuleService: MembershipCategoryBusinessRuleService,
  ) {}

  /**
   * Collect user data for membership creation process
   * This method gathers all necessary information based on user type
   */
  async collectUserDataForCreation(
    userId: string,
    userType: 'account' | 'affiliate',
    operationId?: string,
  ): Promise<UserCreationData> {
    const opId = operationId || `collect-data-${Date.now()}`;
    this.logger.log(
      `Collecting user data for ${userType} ${userId} - Operation: ${opId}`,
    );

    try {
      const userData = await this.businessRuleService.collectUserCreationData(
        userId,
        userType,
      );

      if (!userData) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `${userType === 'account' ? 'Account' : 'Affiliate'} not found: ${userId}`,
          operationId: opId,
        });
      }

      this.logger.log(
        `Successfully collected user data for ${userType} ${userId} - Operation: ${opId}`,
        {
          userType: userData.userType,
          hasEducationData: isAccountUserCreationData(userData)
            ? !!userData.education_category
            : 'N/A',
          educationTable: isAccountUserCreationData(userData)
            ? userData.education_table || 'N/A'
            : 'N/A',
        },
      );

      return userData;
    } catch (error) {
      this.logger.error(
        `Failed to collect user data for ${userType} ${userId} - Operation: ${opId}`,
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Create new membership category (Admin/Main only)
   */
  async create(
    dto: MembershipCategoryCreateDto,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<MembershipCategoryResponseDto> {
    const opId = operationId || `create-${Date.now()}`;
    this.logger.log(`Creating membership category for operation ${opId}`);

    try {
      // Privilege validation - only Admin/Main can create
      if (!this.canCreateCategory(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message:
            'Insufficient privileges: Admin/Main privilege required for creation',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Business rule validation
      const businessValidation =
        await this.businessRuleService.validateMembershipCategoryCreation(
          dto,
          userPrivilege,
        );

      if (!businessValidation.isValid) {
        this.logger.error(
          `Membership category creation validation failed - Operation: ${opId}`,
          {
            operation: 'create_membership_category_validation',
            operationId: opId,
            errors: businessValidation.errors,
            userPrivilege: userPrivilege || 'undefined',
          },
        );

        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          operation: 'create_membership_category_validation',
          operationId: opId,
          message: `Validation failed: ${businessValidation.errors.join(', ')}`,
          errors: businessValidation.errors,
        });
      }

      // Transform DTO to Dataverse payload using mapper (follows established pattern)
      const payloadData = mapCreateDtoToDataverse(dto);

      // Note: osot_privilege and osot_access_modifiers defaults are applied by Dataverse
      // based on table configuration (Owner and Private respectively)

      // Create in repository - payload includes OData binds from DTO
      const created = await this.repository.create(
        payloadData as Omit<
          MembershipCategoryDataverse,
          | 'osot_table_membership_categoryid'
          | 'osot_category_id'
          | 'createdon'
          | 'modifiedon'
          | 'ownerid'
        >,
      );

      // Transform to internal format then to response DTO
      const internal = mapDataverseToInternal(created);
      if (!internal) {
        throw createAppError(ErrorCodes.INTERNAL_ERROR, {
          message: 'Failed to map created category to internal format',
          operationId: opId,
        });
      }
      const response = mapInternalToResponse(internal);

      this.logger.log(
        `Successfully created membership category ${response.osot_category_id} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to create membership category for operation ${opId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete membership category (Admin/Main only)
   */
  async delete(
    id: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<void> {
    const opId = operationId || `delete-${Date.now()}`;
    this.logger.log(`Deleting membership category ${id} for operation ${opId}`);

    try {
      // Privilege validation - only Admin/Main can delete
      if (!this.canDeleteCategory(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message:
            'Insufficient privileges: Admin/Main privilege required for deletion',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Check if category exists before deletion
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Membership category with ID ${id} not found`,
          operationId: opId,
          categoryId: id,
        });
      }

      // Delete from repository
      await this.repository.deleteById(id);

      this.logger.log(
        `Successfully deleted membership category ${id} for operation ${opId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete membership category ${id} for operation ${opId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get membership category by ID
   */
  async getById(
    id: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<MembershipCategoryResponseDto> {
    const opId = operationId || `getById-${Date.now()}`;
    this.logger.log(`Getting membership category ${id} for operation ${opId}`);

    try {
      const category = await this.repository.findById(id);
      if (!category) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Membership category with ID ${id} not found`,
          operationId: opId,
          categoryId: id,
        });
      }

      // Transform to internal format then to response DTO
      const internal = mapDataverseToInternal(category);
      if (!internal) {
        throw createAppError(ErrorCodes.INTERNAL_ERROR, {
          message: 'Failed to map category to internal format',
          operationId: opId,
        });
      }
      const response = mapInternalToResponse(internal);

      this.logger.log(
        `Successfully retrieved membership category ${id} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get membership category ${id} for operation ${opId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get membership category by business ID
   */
  async getByBusinessId(
    businessId: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<MembershipCategoryResponseDto> {
    const opId = operationId || `getByBusinessId-${Date.now()}`;
    this.logger.log(
      `Getting membership category by business ID ${businessId} for operation ${opId}`,
    );

    try {
      const category = await this.repository.findByCategoryId(businessId);
      if (!category) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Membership category with business ID ${businessId} not found`,
          operationId: opId,
          businessId,
        });
      }

      // Transform to internal format then to response DTO
      const internal = mapDataverseToInternal(category);
      if (!internal) {
        throw createAppError(ErrorCodes.INTERNAL_ERROR, {
          message: 'Failed to map category to internal format',
          operationId: opId,
        });
      }
      const response = mapInternalToResponse(internal);

      this.logger.log(
        `Successfully retrieved membership category ${businessId} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get membership category ${businessId} for operation ${opId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * List membership categories with pagination (Admin/Main only)
   */
  async list(
    options: {
      skip?: number;
      top?: number;
      filter?: string;
      orderBy?: string;
    } = {},
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<{
    categories: MembershipCategoryResponseDto[];
    totalCount?: number;
  }> {
    const opId = operationId || `list-${Date.now()}`;
    this.logger.log(`Listing membership categories for operation ${opId}`);

    try {
      // Privilege validation - only Admin/Main can list all categories
      if (!this.canReadCategory(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message:
            'Insufficient privileges: Admin/Main/Owner privilege required for listing',
          operationId: opId,
          requiredPrivilege: 'Admin/Main/Owner',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Get data from repository
      const result = await this.repository.list(options);

      // Transform to response DTOs
      const categories = result.value
        .map((category) => {
          const internal = mapDataverseToInternal(category);
          if (!internal) {
            this.logger.warn(
              `Failed to map category ${category.osot_table_membership_categoryid} for operation ${opId}`,
            );
            return null;
          }
          return mapInternalToResponse(internal);
        })
        .filter(
          (category): category is MembershipCategoryResponseDto =>
            category !== null,
        );

      this.logger.log(
        `Successfully listed ${categories.length} membership categories for operation ${opId}`,
      );

      return {
        categories,
        totalCount: result.totalCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to list membership categories for operation ${opId}`,
        error,
      );
      throw error;
    }
  }

  // ========================================
  // PRIVATE PERMISSION METHODS
  // ========================================

  private canCreateCategory(privilege?: Privilege): boolean {
    return (
      privilege === Privilege.OWNER ||
      privilege === Privilege.ADMIN ||
      privilege === Privilege.MAIN
    );
  }

  private canDeleteCategory(privilege?: Privilege): boolean {
    return privilege === Privilege.ADMIN || privilege === Privilege.MAIN;
  }

  private canReadCategory(privilege?: Privilege): boolean {
    // For internal operations, allow more flexible read access
    // Public read access is handled by the lookup service
    return (
      privilege === Privilege.ADMIN ||
      privilege === Privilege.MAIN ||
      privilege === Privilege.OWNER
    );
  }
}
