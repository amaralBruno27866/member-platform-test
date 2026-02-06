/**
 * Insurance CRUD Service
 *
 * Handles create, update, and delete operations for Insurance certificates.
 * Enforces permissions and business rules defined in InsuranceBusinessRuleService.
 *
 * @file insurance-crud.service.ts
 * @module InsuranceModule
 * @layer Services
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { Privilege } from '../../../../common/enums';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import {
  InsuranceRepository,
  INSURANCE_REPOSITORY,
} from '../interfaces/insurance-repository.interface';
import { InsuranceBusinessRuleService } from './insurance-business-rules.service';
import { CreateInsuranceDto } from '../dtos/create-insurance.dto';
import { UpdateInsuranceDto } from '../dtos/update-insurance.dto';
import { InsuranceMapper } from '../mappers/insurance.mapper';
import { InsuranceResponseDto } from '../dtos/insurance-response.dto';

@Injectable()
export class InsuranceCrudService {
  private readonly logger = new Logger(InsuranceCrudService.name);

  constructor(
    @Inject(INSURANCE_REPOSITORY)
    private readonly insuranceRepository: InsuranceRepository,
    private readonly businessRules: InsuranceBusinessRuleService,
  ) {}

  /**
   * Create a new insurance certificate
   *
   * @param dto - CreateInsuranceDto
   * @param userPrivilege - User privilege from JWT
   * @param userId - User GUID from JWT (Owner validation)
   * @param organizationGuid - Organization GUID from JWT
   */
  async create(
    dto: CreateInsuranceDto,
    userPrivilege: Privilege,
    userId?: string,
    organizationGuid?: string,
  ): Promise<InsuranceResponseDto> {
    const operationId = `create_insurance_${Date.now()}`;

    try {
      this.logger.log(
        `Creating Insurance for order ${dto.orderGuid} - Operation: ${operationId}`,
      );

      const validation = await this.businessRules.validateInsuranceForCreation(
        dto,
        userPrivilege,
        userId,
        organizationGuid,
      );

      if (!validation.isValid) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: 'Insurance creation validation failed',
          errors: validation.errors,
          operationId,
        });
      }

      // Map DTO -> Internal
      const internal = InsuranceMapper.createDtoToInternal(dto);

      // Enforce organization context from JWT
      if (organizationGuid) {
        internal.organizationGuid = organizationGuid;
      }

      const created = await this.insuranceRepository.create(
        internal,
        operationId,
      );

      this.logger.log(
        `Insurance created successfully: ${created.osot_table_insuranceid} - Operation: ${operationId}`,
      );

      return InsuranceMapper.internalToResponseDto(created);
    } catch (error) {
      this.logger.error(
        `Error creating insurance - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update an existing insurance certificate
   *
   * @param insuranceId - Insurance GUID
   * @param updates - UpdateInsuranceDto
   * @param userPrivilege - User privilege from JWT
   * @param userId - User GUID from JWT
   * @param organizationGuid - Organization GUID from JWT
   */
  async update(
    insuranceId: string,
    updates: UpdateInsuranceDto,
    userPrivilege: Privilege,
    userId?: string,
    organizationGuid?: string,
  ): Promise<InsuranceResponseDto> {
    const operationId = `update_insurance_${Date.now()}`;

    try {
      this.logger.log(
        `Updating Insurance ${insuranceId} - Operation: ${operationId}`,
      );

      if (!organizationGuid) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Organization context is required',
          operationId,
        });
      }

      const current = await this.insuranceRepository.findById(
        insuranceId,
        organizationGuid,
        operationId,
      );

      if (!current) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Insurance not found',
          insuranceId,
          operationId,
        });
      }

      const validation = this.businessRules.validateInsuranceForUpdate(
        current,
        updates,
        userPrivilege,
      );

      if (!validation.isValid) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: 'Insurance update validation failed',
          errors: validation.errors,
          operationId,
        });
      }

      const internalUpdates = InsuranceMapper.updateDtoToInternal(updates);

      if (Object.keys(internalUpdates).length === 0) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'No updatable fields provided',
          operationId,
        });
      }

      const updated = await this.insuranceRepository.update(
        insuranceId,
        internalUpdates,
        organizationGuid,
        operationId,
      );

      this.logger.log(
        `Insurance updated successfully: ${insuranceId} - Operation: ${operationId}`,
      );

      return InsuranceMapper.internalToResponseDto(updated);
    } catch (error) {
      this.logger.error(
        `Error updating insurance ${insuranceId} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Soft delete an insurance certificate (status = CANCELLED)
   *
   * @param insuranceId - Insurance GUID
   * @param userPrivilege - User privilege from JWT
   * @param organizationGuid - Organization GUID from JWT
   */
  async delete(
    insuranceId: string,
    userPrivilege: Privilege,
    organizationGuid?: string,
  ): Promise<boolean> {
    const operationId = `delete_insurance_${Date.now()}`;

    try {
      this.logger.log(
        `Deleting Insurance ${insuranceId} - Operation: ${operationId}`,
      );

      if (!organizationGuid) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Organization context is required',
          operationId,
        });
      }

      const current = await this.insuranceRepository.findById(
        insuranceId,
        organizationGuid,
        operationId,
      );

      if (!current) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Insurance not found',
          insuranceId,
          operationId,
        });
      }

      const validation = this.businessRules.validateInsuranceForDeletion(
        current,
        userPrivilege,
      );

      if (!validation.isValid) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: validation.errors.join(', '),
          operationId,
        });
      }

      const deleted = await this.insuranceRepository.delete(
        insuranceId,
        organizationGuid,
        operationId,
      );

      this.logger.log(
        `Insurance deleted successfully: ${insuranceId} - Operation: ${operationId}`,
      );

      return deleted;
    } catch (error) {
      this.logger.error(
        `Error deleting insurance ${insuranceId} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Hard delete an insurance certificate (GDPR only)
   *
   * @param insuranceId - Insurance GUID
   * @param userPrivilege - User privilege from JWT
   */
  async hardDelete(
    insuranceId: string,
    userPrivilege: Privilege,
  ): Promise<boolean> {
    const operationId = `hard_delete_insurance_${Date.now()}`;

    try {
      this.logger.log(
        `Hard deleting Insurance ${insuranceId} - Operation: ${operationId}`,
      );

      if (!this.businessRules.canDeleteInsurance(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Insufficient privileges to hard delete insurance',
          operationId,
          requiredPrivilege: 'Main',
        });
      }

      const deleted = await this.insuranceRepository.hardDelete(
        insuranceId,
        operationId,
      );

      this.logger.log(
        `Insurance hard deleted successfully: ${insuranceId} - Operation: ${operationId}`,
      );

      return deleted;
    } catch (error) {
      this.logger.error(
        `Error hard deleting insurance ${insuranceId} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }
}
