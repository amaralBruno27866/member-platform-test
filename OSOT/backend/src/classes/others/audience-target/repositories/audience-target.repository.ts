/**
 * Audience Target Repository
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes/ErrorMessages for structured error handling
 * - integrations: Uses DataverseService for all data operations
 * - redis: Uses RedisService for caching (mitigates Dataverse rate limiting)
 * - interfaces: Implements IAudienceTargetRepository contract
 * - mappers: Uses AudienceTargetMapper for data transformation
 *
 * CACHING STRATEGY:
 * - READ operations: Try cache first (5min TTL) → Dataverse on miss → Store in cache
 * - WRITE operations: Update Dataverse → Invalidate affected cache keys
 * - Benefits: Reduces Dataverse API calls, mitigates 100 req/s rate limit
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for product targeting needs
 * - Follows membership-employment repository pattern
 * - Clean abstraction over DataverseService
 * - Structured error handling with proper logging
 * - Hard delete (no soft delete)
 * - Product-based queries for one-to-one relationship enforcement
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { RedisService } from '../../../../redis/redis.service';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { AUDIENCE_TARGET_ODATA } from '../constants/audience-target.constants';
import { IAudienceTargetRepository } from '../interfaces/audience-target-repository.interface';
import { AudienceTargetInternal } from '../interfaces/audience-target-internal.interface';
import { AudienceTargetDataverse } from '../interfaces/audience-target-dataverse.interface';
import { AudienceTargetMapper } from '../mappers/audience-target.mapper';
import { getAppForOperation } from '../../../../utils/dataverse-app.helper';

export const AUDIENCE_TARGET_REPOSITORY = 'AUDIENCE_TARGET_REPOSITORY';

/**
 * DataverseAudienceTargetRepository
 *
 * Repository implementation for Audience Target entities using Microsoft Dataverse.
 * Provides a clean abstraction layer between the application and Dataverse API.
 * Handles product-to-target relationship enforcement (one-to-one).
 */
@Injectable()
export class DataverseAudienceTargetRepository
  implements IAudienceTargetRepository
{
  private readonly logger = new Logger(DataverseAudienceTargetRepository.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly dataverseService: DataverseService,
    private readonly redisService: RedisService,
  ) {}

  // ========================================
  // CACHE KEY HELPERS
  // ========================================

  private getCacheKey(type: string, id: string): string {
    return `audience-target:${type}:${id}`;
  }

  private async invalidateCache(
    targetId?: string,
    productId?: string,
  ): Promise<void> {
    try {
      if (targetId) {
        await this.redisService.del(this.getCacheKey('id', targetId));
        await this.redisService.del(this.getCacheKey('guid', targetId));
      }
      if (productId) {
        await this.redisService.del(this.getCacheKey('product', productId));
      }
      // Invalidate list cache (simple approach: clear all list variations)
      await this.redisService.del('audience-target:list:*');
    } catch (error) {
      this.logger.warn(
        `Cache invalidation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Don't throw - cache invalidation failure shouldn't break operations
    }
  }

  /**
   * Create a new audience target in Dataverse
   * Note: Enforce one-to-one relationship at service layer before calling
   */
  async create(
    targetData: Partial<AudienceTargetInternal>,
  ): Promise<AudienceTargetInternal> {
    try {
      // Use main app credentials for create operations
      const app = getAppForOperation('create', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const payload = AudienceTargetMapper.mapInternalToDataverse(
        targetData as AudienceTargetInternal,
        false,
      );

      // DEBUG: Log payload to identify the issue
      this.logger.debug(
        `Target creation payload: ${JSON.stringify(payload, null, 2)}`,
      );

      const response = await this.dataverseService.request(
        'POST',
        AUDIENCE_TARGET_ODATA.TABLE_NAME,
        payload,
        credentials,
        app,
      );

      // Map response from Dataverse
      const created = this.mapDataverseToInternal(
        response as AudienceTargetDataverse,
      );

      // Preserve Product lookup GUID from original data
      // Note: Dataverse POST response doesn't return lookup fields by default
      if (targetData.osot_table_product) {
        created.osot_table_product = targetData.osot_table_product;
      }

      // Invalidate cache for the product (new target blocks future creates)
      await this.invalidateCache(undefined, targetData.osot_table_product);

      return created;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find audience target by Target ID (business ID)
   * @param targetId - osot_target (e.g., "osot-tgt-0000001")
   */
  async findById(targetId: string): Promise<AudienceTargetInternal | null> {
    const cacheKey = this.getCacheKey('id', targetId);

    try {
      // Try cache first
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for target ID: ${targetId}`);
        return JSON.parse(cached) as AudienceTargetInternal;
      }

      // Cache miss - fetch from Dataverse
      this.logger.debug(`Cache miss for target ID: ${targetId}`);
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$filter=osot_target eq '${targetId}'&$select=${AUDIENCE_TARGET_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${AUDIENCE_TARGET_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { value?: AudienceTargetDataverse[] };
      const target = responseData?.value?.[0];
      const result = target ? this.mapDataverseToInternal(target) : null;

      // Store in cache
      if (result) {
        await this.redisService.set(cacheKey, JSON.stringify(result), {
          EX: this.CACHE_TTL,
        });
      }

      return result;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find audience target by GUID
   * @param guid - osot_table_audience_targetid (GUID)
   */
  async findByGuid(guid: string): Promise<AudienceTargetInternal | null> {
    const cacheKey = this.getCacheKey('guid', guid);

    try {
      // Try cache first
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for target GUID: ${guid}`);
        return JSON.parse(cached) as AudienceTargetInternal;
      }

      // Cache miss - fetch from Dataverse
      this.logger.debug(`Cache miss for target GUID: ${guid}`);
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$select=${AUDIENCE_TARGET_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${AUDIENCE_TARGET_ODATA.TABLE_NAME}(${guid})?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const result = this.mapDataverseToInternal(
        response as AudienceTargetDataverse,
      );

      // Store in cache
      if (result) {
        await this.redisService.set(cacheKey, JSON.stringify(result), {
          EX: this.CACHE_TTL,
        });
      }

      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find audience target by product ID
   * CRITICAL: Used to enforce one-to-one relationship
   * @param productId - Product GUID
   * @param app - Application context (defaults to 'main' for read operations)
   */
  async findByProductId(
    productId: string,
    app: 'admin' | 'main' = 'main',
  ): Promise<AudienceTargetInternal | null> {
    const cacheKey = this.getCacheKey('product', productId);

    try {
      // Try cache first
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for product ID: ${productId}`);
        return JSON.parse(cached) as AudienceTargetInternal;
      }

      // Cache miss - fetch from Dataverse
      this.logger.debug(`Cache miss for product ID: ${productId}`);
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Use OData _value field for lookup queries
      const oDataQuery = `$filter=_osot_table_product_value eq ${productId}&$select=${AUDIENCE_TARGET_ODATA.SELECT_FIELDS}&$top=1`;
      const response = await this.dataverseService.request(
        'GET',
        `${AUDIENCE_TARGET_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { value?: AudienceTargetDataverse[] };
      const target = responseData?.value?.[0];
      const result = target ? this.mapDataverseToInternal(target) : null;

      // Store in cache
      await this.redisService.set(cacheKey, JSON.stringify(result), {
        EX: this.CACHE_TTL,
      });

      return result;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Count audience targets for a product
   * Used for diagnostics and validation
   * @param productId - Product GUID
   */
  async countByProductId(productId: string): Promise<number> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Use OData _value field for lookup queries
      const oDataQuery = `$filter=_osot_table_product_value eq ${productId}&$count=true&$top=1`;
      const response = await this.dataverseService.request(
        'GET',
        `${AUDIENCE_TARGET_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { '@odata.count'?: number };
      return responseData?.['@odata.count'] || 0;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find all audience targets with optional filtering
   * Supports pagination, ordering, filtering
   */
  async findAll(options?: {
    filter?: string;
    orderBy?: string;
    top?: number;
    skip?: number;
    select?: string;
    expand?: string;
  }): Promise<AudienceTargetInternal[]> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const orderBy = options?.orderBy || 'createdon desc';
      const select = options?.select || AUDIENCE_TARGET_ODATA.SELECT_FIELDS;

      // Note: Dataverse doesn't support $skip, so we fetch all and paginate in-memory
      let oDataQuery = `$orderby=${orderBy}&$select=${select}`;

      if (options?.filter) {
        oDataQuery += `&$filter=${options.filter}`;
      }

      if (options?.expand) {
        oDataQuery += `&$expand=${options.expand}`;
      }

      const response = await this.dataverseService.request(
        'GET',
        `${AUDIENCE_TARGET_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { value?: AudienceTargetDataverse[] };
      const targets = responseData?.value || [];

      return targets.map((target: AudienceTargetDataverse) =>
        this.mapDataverseToInternal(target),
      );
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Update an existing audience target
   * @param targetId - Business ID (osot_target_id) or GUID
   * @param updates - Partial updates (fields to change)
   */
  async update(
    targetId: string,
    updates: Partial<AudienceTargetInternal>,
  ): Promise<AudienceTargetInternal> {
    try {
      // Determine if targetId is a GUID or business ID
      const isGuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          targetId,
        );

      let guid: string;

      if (isGuid) {
        guid = targetId;
      } else {
        // Find by business ID to get GUID
        const existing = await this.findById(targetId);
        if (!existing?.osot_table_audience_targetid) {
          throw new Error(`Audience target with ID ${targetId} not found`);
        }
        guid = existing.osot_table_audience_targetid;
      }

      // Use main app credentials for update operations
      const app = getAppForOperation('write', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const payload = AudienceTargetMapper.mapInternalToDataverse(
        updates as AudienceTargetInternal,
        true,
      );

      // Log payload for debugging
      this.logger.debug(
        `Update payload for target ${guid}: ${JSON.stringify(payload, null, 2)}`,
      );
      this.logger.debug(`Payload has ${Object.keys(payload).length} fields`);

      await this.dataverseService.request(
        'PATCH',
        `${AUDIENCE_TARGET_ODATA.TABLE_NAME}(${guid})`,
        payload,
        credentials,
        app,
      );

      // Invalidate cache for this target and its product
      const existing = await this.findByGuid(guid);
      if (existing) {
        await this.invalidateCache(
          existing.osot_target || guid,
          existing.osot_table_product,
        );
      }

      // Return updated record
      const updated = await this.findByGuid(guid);
      if (!updated) {
        throw new Error('Failed to retrieve updated audience target');
      }

      return updated;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Delete an audience target (hard delete)
   * @param targetId - Business ID (osot_target) or GUID
   * @returns True if deleted, false if not found
   */
  async delete(targetId: string): Promise<boolean> {
    try {
      // Determine if targetId is a GUID or business ID
      const isGuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          targetId,
        );

      let guid: string;
      let productId: string | undefined;

      if (isGuid) {
        guid = targetId;
        // Get product ID before deleting for cache invalidation
        const existing = await this.findByGuid(guid);
        productId = existing?.osot_table_product;
      } else {
        // Find by business ID to get GUID and product ID
        const existing = await this.findById(targetId);
        if (!existing?.osot_table_audience_targetid) {
          return false; // Not found
        }
        guid = existing.osot_table_audience_targetid;
        productId = existing.osot_table_product;
      }

      // Use main app credentials for delete operations
      const app = getAppForOperation('delete', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Hard delete
      await this.dataverseService.request(
        'DELETE',
        `${AUDIENCE_TARGET_ODATA.TABLE_NAME}(${guid})`,
        undefined,
        credentials,
        app,
      );

      // Invalidate cache (target and product - product is now available for new target)
      await this.invalidateCache(targetId, productId);

      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return false; // Not found
      }
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Check if an audience target exists
   * @param targetId - Business ID (osot_target) or GUID
   * @returns True if exists
   */
  async exists(targetId: string): Promise<boolean> {
    try {
      // Determine if targetId is a GUID or business ID
      const isGuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          targetId,
        );

      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      let oDataQuery: string;

      if (isGuid) {
        // Check by GUID (more efficient)
        oDataQuery = `$filter=osot_table_audience_targetid eq ${targetId}&$count=true&$top=1`;
      } else {
        // Check by business ID
        oDataQuery = `$filter=osot_target eq '${targetId}'&$count=true&$top=1`;
      }

      const response = await this.dataverseService.request(
        'GET',
        `${AUDIENCE_TARGET_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { '@odata.count'?: number };
      return (responseData?.['@odata.count'] || 0) > 0;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find products matching a user's profile
   * Core matching logic for dashboard product filtering
   *
   * NOTE: This is a simplified implementation that returns product IDs
   * where targets match user profile. Full matching logic with scoring
   * and weighting can be implemented in a future iteration.
   *
   * @param userData - User profile data from multiple entities
   * @param options - Pagination and filtering options
   * @returns Array of product IDs that match the user's profile
   */
  async findMatchingProducts(
    userData: {
      accountGroup?: number;
      affiliateArea?: number[];
      affiliateCity?: number;
      affiliateProvince?: number;
      membershipCity?: number;
      province?: number;
      gender?: number;
      indigenousDetails?: number;
      language?: number[];
      race?: number;
      eligibilityAffiliate?: number;
      membershipCategory?: number;
      earnings?: number;
      earningsSelfDirect?: number;
      earningsSelfIndirect?: number;
      employmentBenefits?: number[];
      employmentStatus?: number;
      positionFunding?: number[];
      practiceYears?: number;
      roleDescription?: number[];
      workHours?: number;
      clientAge?: number[];
      practiceArea?: number[];
      practiceServices?: number[];
      practiceSettings?: number[];
      membershipSearchTools?: number[];
      practicePromotion?: number[];
      psychotherapySupervision?: number;
      thirdParties?: number[];
      cotoStatus?: number;
      otGradYear?: number;
      otUniversity?: number;
      otaGradYear?: number;
      otaCollege?: number;
    },
    options?: {
      page?: number;
      limit?: number;
      cacheKey?: string;
    },
  ): Promise<{
    productIds: string[];
    totalCount: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      // For now, fetch all targets and do matching in memory
      // Future: Optimize with OData filter queries for better performance
      const allTargets = await this.findAll({
        select: AUDIENCE_TARGET_ODATA.SELECT_FIELDS,
        top: 1000, // Reasonable limit for targets
      });

      // Filter targets based on user profile
      const matchingTargets = allTargets.filter((target) => {
        // If target has no criteria (empty target), it matches everyone
        const hasCriteria = this.hasAnyCriteria(target);
        if (!hasCriteria) return true;

        // Check each populated field for matches
        return this.matchesUserProfile(target, userData);
      });

      // Extract product IDs
      const productIds = matchingTargets
        .map((target) => target.osot_table_product)
        .filter((id): id is string => !!id);

      // Apply pagination
      const paginatedProductIds = productIds.slice(skip, skip + limit);

      return {
        productIds: paginatedProductIds,
        totalCount: productIds.length,
        page,
        limit,
      };
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Helper: Check if target has any criteria populated
   */
  private hasAnyCriteria(target: AudienceTargetInternal): boolean {
    const fields = [
      target.osot_account_group,
      target.osot_affiliate_area,
      target.osot_affiliate_city,
      target.osot_affiliate_province,
      target.osot_membership_city,
      target.osot_province,
      target.osot_gender,
      target.osot_indigenous_details,
      target.osot_language,
      target.osot_race,
      target.osot_eligibility_affiliate,
      target.osot_membership_category,
      target.osot_earnings,
      target.osot_earnings_selfdirect,
      target.osot_earnings_selfindirect,
      target.osot_employment_benefits,
      target.osot_employment_status,
      target.osot_position_funding,
      target.osot_practice_years,
      target.osot_role_description,
      target.osot_work_hours,
      target.osot_client_age,
      target.osot_practice_area,
      target.osot_practice_services,
      target.osot_practice_settings,
      target.osot_membership_search_tools,
      target.osot_practice_promotion,
      target.osot_psychotherapy_supervision,
      target.osot_third_parties,
      target.osot_coto_status,
      target.osot_ot_grad_year,
      target.osot_ot_university,
      target.osot_ota_grad_year,
      target.osot_ota_college,
    ];

    return fields.some((field) => {
      if (Array.isArray(field)) return field.length > 0;
      if (typeof field === 'string') {
        // Parse CSV string to check if not empty
        return field.split(',').filter((v) => v.trim()).length > 0;
      }
      return false;
    });
  }

  /**
   * Helper: Check if user matches target criteria
   * For each populated field in target, check if user value matches
   */
  private matchesUserProfile(
    target: AudienceTargetInternal,
    userData: {
      accountGroup?: number;
      affiliateArea?: number[];
      affiliateCity?: number;
      affiliateProvince?: number;
      membershipCity?: number;
      province?: number;
      gender?: number;
      indigenousDetails?: number;
      language?: number[];
      race?: number;
      eligibilityAffiliate?: number;
      membershipCategory?: number;
      earnings?: number;
      earningsSelfDirect?: number;
      earningsSelfIndirect?: number;
      employmentBenefits?: number[];
      employmentStatus?: number;
      positionFunding?: number[];
      practiceYears?: number;
      roleDescription?: number[];
      workHours?: number;
      clientAge?: number[];
      practiceArea?: number[];
      practiceServices?: number[];
      practiceSettings?: number[];
      membershipSearchTools?: number[];
      practicePromotion?: number[];
      psychotherapySupervision?: number;
      thirdParties?: number[];
      cotoStatus?: number;
      otGradYear?: number;
      otUniversity?: number;
      otaGradYear?: number;
      otaCollege?: number;
    },
  ): boolean {
    // Helper to check array intersection
    const hasIntersection = (
      arr1: number[] | string | undefined,
      arr2: number[] | undefined,
    ): boolean => {
      if (!arr1 || !arr2) return true; // No criteria = match
      const targetArray = Array.isArray(arr1)
        ? arr1
        : arr1.split(',').map((v) => parseInt(v.trim(), 10));
      return targetArray.some((val) => arr2.includes(val));
    };

    // Helper to check single value match
    const matchesSingleValue = (
      targetValue: number[] | string | undefined,
      userValue: number | undefined,
    ): boolean => {
      if (!targetValue || !userValue) return true; // No criteria = match
      const targetArray = Array.isArray(targetValue)
        ? targetValue
        : targetValue.split(',').map((v) => parseInt(v.trim(), 10));
      return targetArray.includes(userValue);
    };

    // Check each field (only check fields that are populated in target)
    const checks = [
      matchesSingleValue(target.osot_account_group, userData.accountGroup),
      hasIntersection(target.osot_affiliate_area, userData.affiliateArea),
      matchesSingleValue(target.osot_affiliate_city, userData.affiliateCity),
      matchesSingleValue(
        target.osot_affiliate_province,
        userData.affiliateProvince,
      ),
      matchesSingleValue(target.osot_membership_city, userData.membershipCity),
      matchesSingleValue(target.osot_province, userData.province),
      matchesSingleValue(target.osot_gender, userData.gender),
      matchesSingleValue(
        target.osot_indigenous_details,
        userData.indigenousDetails,
      ),
      hasIntersection(target.osot_language, userData.language),
      matchesSingleValue(target.osot_race, userData.race),
      matchesSingleValue(
        target.osot_eligibility_affiliate,
        userData.eligibilityAffiliate,
      ),
      matchesSingleValue(
        target.osot_membership_category,
        userData.membershipCategory,
      ),
      matchesSingleValue(target.osot_earnings, userData.earnings),
      matchesSingleValue(
        target.osot_earnings_selfdirect,
        userData.earningsSelfDirect,
      ),
      matchesSingleValue(
        target.osot_earnings_selfindirect,
        userData.earningsSelfIndirect,
      ),
      hasIntersection(
        target.osot_employment_benefits,
        userData.employmentBenefits,
      ),
      matchesSingleValue(
        target.osot_employment_status,
        userData.employmentStatus,
      ),
      hasIntersection(target.osot_position_funding, userData.positionFunding),
      matchesSingleValue(target.osot_practice_years, userData.practiceYears),
      hasIntersection(target.osot_role_description, userData.roleDescription),
      matchesSingleValue(target.osot_work_hours, userData.workHours),
      hasIntersection(target.osot_client_age, userData.clientAge),
      hasIntersection(target.osot_practice_area, userData.practiceArea),
      hasIntersection(target.osot_practice_services, userData.practiceServices),
      hasIntersection(target.osot_practice_settings, userData.practiceSettings),
      hasIntersection(
        target.osot_membership_search_tools,
        userData.membershipSearchTools,
      ),
      hasIntersection(
        target.osot_practice_promotion,
        userData.practicePromotion,
      ),
      matchesSingleValue(
        target.osot_psychotherapy_supervision,
        userData.psychotherapySupervision,
      ),
      hasIntersection(target.osot_third_parties, userData.thirdParties),
      matchesSingleValue(target.osot_coto_status, userData.cotoStatus),
      matchesSingleValue(target.osot_ot_grad_year, userData.otGradYear),
      matchesSingleValue(target.osot_ot_university, userData.otUniversity),
      matchesSingleValue(target.osot_ota_grad_year, userData.otaGradYear),
      matchesSingleValue(target.osot_ota_college, userData.otaCollege),
    ];

    // ALL populated fields must match (AND logic)
    return checks.every((check) => check === true);
  }

  /**
   * Batch operations for bulk create/update
   * Useful for initial data seeding or bulk administration
   */
  async createBatch(
    targets: Partial<AudienceTargetInternal>[],
  ): Promise<AudienceTargetInternal[]> {
    const created: AudienceTargetInternal[] = [];

    for (const targetData of targets) {
      try {
        const result = await this.create(targetData);
        created.push(result);
      } catch (error) {
        // Log error but continue with remaining targets
        console.error(
          `Failed to create target for product ${targetData.osot_table_product}:`,
          error,
        );
      }
    }

    return created;
  }

  /**
   * Get total count of audience targets
   * @returns Total number of targets in database
   */
  async count(): Promise<number> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = '$count=true&$top=1';
      const response = await this.dataverseService.request(
        'GET',
        `${AUDIENCE_TARGET_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { '@odata.count'?: number };
      return responseData?.['@odata.count'] || 0;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Transform raw Dataverse data to internal format
   */
  private mapDataverseToInternal(
    dataverseData: AudienceTargetDataverse,
  ): AudienceTargetInternal {
    return AudienceTargetMapper.mapDataverseToInternal(dataverseData);
  }

  /**
   * Transform internal data to Dataverse format
   */
  private mapInternalToDataverse(
    internalData: Partial<AudienceTargetInternal>,
  ): Partial<AudienceTargetDataverse> {
    return AudienceTargetMapper.mapInternalToDataverse(
      internalData as AudienceTargetInternal,
      true,
    );
  }
}
