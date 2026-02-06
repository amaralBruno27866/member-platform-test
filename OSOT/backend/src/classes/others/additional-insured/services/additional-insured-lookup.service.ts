/**
 * Additional Insured Lookup Service
 *
 * RESPONSIBILITIES:
 * - Find Additional Insureds by various criteria
 * - Support lookups used by other services and repositories
 *
 * LOOKUP OPERATIONS:
 * - findById: Direct lookup by GUID (used by CRUD service)
 * - findByInsurance: Get all additional insureds for an insurance
 * - findByCompanyName: Check uniqueness (used by business rules service)
 *
 * NOT RESPONSIBLE FOR:
 * - Business rule validation (use Business Rules Service)
 * - Permission checks in detail (use Business Rules Service)
 *
 * @file additional-insured-lookup.service.ts
 * @module AdditionalInsuredModule
 * @layer Services
 * @since 2026-01-29
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataverseAdditionalInsuredRepository } from '../repositories/dataverse-additional-insured.repository';
import { AdditionalInsuredInternal } from '../interfaces/additional-insured-internal.interface';
import { CacheService } from '../../../../cache/cache.service';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * Additional Insured Lookup Service
 *
 * Handles all read operations without business logic validation.
 * Used by other services for lookups and data retrieval.
 */
@Injectable()
export class AdditionalInsuredLookupService {
  private readonly logger = new Logger(AdditionalInsuredLookupService.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly additionalInsuredRepository: DataverseAdditionalInsuredRepository,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Find Additional Insured by GUID
   *
   * Uses Redis cache to reduce Dataverse API calls.
   * Cache TTL: 5 minutes
   *
   * @param id - Additional Insured GUID
   * @param organizationGuid - Organization context
   * @returns Additional Insured or null
   */
  async findById(
    id: string,
    organizationGuid: string,
  ): Promise<AdditionalInsuredInternal | null> {
    const operationId = `lookup_additional_insured_by_id_${Date.now()}`;

    try {
      // Check cache first
      const cacheKey = `additional-insured:${id}`;
      const cached =
        await this.cacheService.get<AdditionalInsuredInternal>(cacheKey);

      let found: AdditionalInsuredInternal | null;

      if (cached) {
        this.logger.debug(`Cache hit for Additional Insured: ${id}`);
        found = cached;
      } else {
        this.logger.debug(
          `Cache miss for Additional Insured ${id} - fetching from Dataverse`,
        );

        found = await this.additionalInsuredRepository.findById(
          id,
          organizationGuid,
        );

        if (!found) {
          this.logger.debug(
            `Additional Insured ${id} not found - Operation: ${operationId}`,
          );
          return null;
        }

        // Cache the result
        await this.cacheService.set(cacheKey, found, this.CACHE_TTL);
        this.logger.debug(`Additional Insured ${id} cached for 5 minutes`);
      }

      return found;
    } catch (error) {
      this.logger.error(
        `Error looking up Additional Insured ${id} - Operation: ${operationId}`,
        error,
      );

      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to lookup Additional Insured',
        operationId,
        recordId: id,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find all Additional Insureds for a specific Insurance
   *
   * Used by:
   * - Insurance service: Get related additional insureds when viewing insurance
   * - Business rules: Validate company name uniqueness (filter by insurance)
   *
   * Returns all additional insureds linked to an insurance record.
   *
   * @param insuranceGuid - Insurance GUID to find additional insureds for
   * @param organizationGuid - Organization context for multi-tenancy
   * @returns Array of Additional Insureds (empty if none found)
   * @throws DATAVERSE_SERVICE_ERROR on repository failure
   */
  async findByInsurance(
    insuranceGuid: string,
    organizationGuid: string,
  ): Promise<AdditionalInsuredInternal[]> {
    const operationId = `lookup_additional_insureds_by_insurance_${Date.now()}`;

    try {
      this.logger.debug(
        `Looking up Additional Insureds for Insurance ${insuranceGuid} - Organization: ${organizationGuid} - Operation: ${operationId}`,
      );

      const found = await this.additionalInsuredRepository.findByInsurance(
        insuranceGuid,
        organizationGuid,
      );

      this.logger.debug(
        `Found ${found.length} Additional Insureds for Insurance ${insuranceGuid} - Operation: ${operationId}`,
      );

      return found;
    } catch (error) {
      this.logger.error(
        `Error looking up Additional Insureds for Insurance ${insuranceGuid} - Operation: ${operationId}`,
        error,
      );

      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to lookup Additional Insureds by Insurance',
        operationId,
        insuranceGuid,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find Additional Insured by Company Name within an Insurance
   *
   * Used by:
   * - Business rules service: Validate company name uniqueness per insurance
   * - Duplicate prevention: Check if company name already exists
   *
   * Returns the first match (should be only one per insurance due to unique constraint).
   *
   * @param companyName - Company name to search (normalized to UPPERCASE)
   * @param insuranceGuid - Insurance GUID to scope search
   * @param organizationGuid - Organization context for multi-tenancy
   * @returns Additional Insured if found, null otherwise
   * @throws DATAVERSE_SERVICE_ERROR on repository failure
   */
  async findByCompanyName(
    companyName: string,
    insuranceGuid: string,
    organizationGuid: string,
  ): Promise<AdditionalInsuredInternal | null> {
    const operationId = `lookup_additional_insured_by_company_${Date.now()}`;

    try {
      this.logger.debug(
        `Looking up Additional Insured by company name "${companyName}" for Insurance ${insuranceGuid} - Operation: ${operationId}`,
      );

      const found = await this.additionalInsuredRepository.findByCompanyName(
        companyName,
        insuranceGuid,
        organizationGuid,
      );

      if (!found) {
        this.logger.debug(
          `No Additional Insured found with company name "${companyName}" for Insurance ${insuranceGuid} - Operation: ${operationId}`,
        );
        return null;
      }

      this.logger.debug(
        `Found Additional Insured with company name "${companyName}" - Operation: ${operationId}`,
      );

      return found;
    } catch (error) {
      this.logger.error(
        `Error looking up Additional Insured by company name "${companyName}" - Operation: ${operationId}`,
        error,
      );

      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to lookup Additional Insured by company name',
        operationId,
        companyName,
        insuranceGuid,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
