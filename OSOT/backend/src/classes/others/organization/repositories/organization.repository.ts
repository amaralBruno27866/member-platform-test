/**
 * Dataverse Organization Repository Implementation
 *
 * Implements IOrganizationRepository interface using Dataverse OData API.
 * Handles all database operations for Organization entity.
 *
 * CACHING STRATEGY:
 * - READ operations: Try cache first (5min TTL) → Dataverse on miss → Store in cache
 * - WRITE operations: Update Dataverse → Invalidate affected cache keys
 * - List queries: Cache with shorter TTL (2min) to balance freshness vs performance
 * - Public endpoint (findBySlug): Critical for white-label login, longer TTL (10min)
 * - Benefits: Reduces Dataverse API load, improves white-label login performance
 *
 * @file organization.repository.ts
 * @module OrganizationModule
 * @layer Repositories
 * @since 2026-01-07
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { RedisService } from '../../../../redis/redis.service';
import {
  IOrganizationRepository,
  OrganizationInternal,
  OrganizationDataverse,
  OrganizationQueryOptions,
} from '../interfaces';
import { toInternal, toDataverse, toInternalArray } from '../mappers';
import {
  ORGANIZATION_ENTITY,
  ORGANIZATION_ODATA,
  ORGANIZATION_ODATA_QUERIES,
  ORGANIZATION_ODATA_FILTERS,
  ORGANIZATION_ODATA_ORDERBY,
} from '../constants';
import { getAppForOperation } from '../../../../utils/dataverse-app.helper';

/**
 * Dataverse Organization Repository
 * Implements all CRUD operations for Organization entity
 */
@Injectable()
export class OrganizationRepository implements IOrganizationRepository {
  private readonly logger = new Logger(OrganizationRepository.name);
  private readonly CACHE_TTL_SINGLE = 300; // 5 minutes for single organizations
  private readonly CACHE_TTL_LIST = 120; // 2 minutes for list queries
  private readonly CACHE_TTL_SLUG = 600; // 10 minutes for slug lookups (public endpoint)

  constructor(
    private readonly dataverseService: DataverseService,
    private readonly redisService: RedisService,
  ) {}

  // ========================================
  // CACHE KEY HELPERS
  // ========================================

  /**
   * Generate cache key for single organization lookups
   */
  private getCacheKey(type: 'guid' | 'id' | 'slug', value: string): string {
    return `organization:${type}:${value.toLowerCase()}`;
  }

  /**
   * Generate cache key for list queries
   * Serializes all query parameters into deterministic key
   */
  private getListCacheKey(params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => {
        const value = params[key];
        if (value === null || value === undefined) {
          return `${key}=null`;
        }
        if (typeof value === 'string') {
          return `${key}=${value}`;
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
          return `${key}=${value.toString()}`;
        }
        return `${key}=${JSON.stringify(value)}`;
      })
      .join('&');
    return `organization:list:${sortedParams}`;
  }

  /**
   * Invalidate all cache keys related to an organization
   * Called after CREATE, UPDATE, DELETE operations
   */
  private async invalidateCache(
    organizationId?: string,
    slug?: string,
    guid?: string,
  ): Promise<void> {
    try {
      const keysToDelete: string[] = [];

      if (organizationId) {
        keysToDelete.push(this.getCacheKey('id', organizationId));
      }
      if (slug) {
        keysToDelete.push(this.getCacheKey('slug', slug));
      }
      if (guid) {
        keysToDelete.push(this.getCacheKey('guid', guid));
      }

      // Delete specific keys
      if (keysToDelete.length > 0) {
        await Promise.all(
          keysToDelete.map((key) => this.redisService.del(key)),
        );
      }

      // Invalidate all list caches (they may include this organization)
      const listKeys = await this.redisService.getKeys('organization:list:*');
      if (listKeys && listKeys.length > 0) {
        await Promise.all(listKeys.map((key) => this.redisService.del(key)));
      }

      this.logger.debug(
        `Cache invalidated for organization (id: ${organizationId}, slug: ${slug}, guid: ${guid})`,
      );
    } catch (error) {
      this.logger.warn(
        `Cache invalidation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Don't throw - cache invalidation failure shouldn't break operations
    }
  }

  // ========================================
  // CREATE
  // ========================================

  /**
   * Create a new organization
   *
   * @param data - Organization data (without IDs)
   * @returns Created organization with generated IDs
   * @throws Error if creation fails
   */
  async create(
    data: Omit<
      OrganizationInternal,
      | 'osot_table_organizationid'
      | 'osot_organizationid'
      | 'createdon'
      | 'modifiedon'
      | 'isActive'
      | 'hasCompleteBranding'
    >,
  ): Promise<OrganizationInternal> {
    try {
      this.logger.debug(`Creating organization with slug: ${data.osot_slug}`);

      const app = getAppForOperation('create', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Convert to Dataverse format
      const payload = toDataverse(data as OrganizationInternal);

      // Create in Dataverse
      const response = await this.dataverseService.request(
        'POST',
        ORGANIZATION_ENTITY.collectionName,
        payload,
        credentials,
        app,
      );

      // Map response to internal format
      const createdOrganization = toInternal(response);

      if (!createdOrganization) {
        throw new Error('Failed to map created organization from Dataverse');
      }

      // Invalidate cache after creation
      await this.invalidateCache(
        createdOrganization.osot_organizationid,
        createdOrganization.osot_slug,
        createdOrganization.osot_table_organizationid,
      );

      this.logger.log(
        `Organization created successfully: ${createdOrganization.osot_organizationid} (slug: ${createdOrganization.osot_slug})`,
      );

      return createdOrganization;
    } catch (error) {
      this.logger.error(
        `Failed to create organization: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // ========================================
  // READ (Single)
  // ========================================

  /**
   * Find organization by table ID (GUID)
   *
   * @param id - Table organization ID (osot_table_organizationid)
   * @returns Organization or null if not found
   */
  async findById(id: string): Promise<OrganizationInternal | null> {
    try {
      // Try cache first
      const cacheKey = this.getCacheKey('guid', id);
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        this.logger.debug(`Cache HIT for organization GUID: ${id}`);
        return JSON.parse(cached) as OrganizationInternal;
      }

      this.logger.debug(`Cache MISS for organization GUID: ${id}`);

      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$select=${ORGANIZATION_ODATA_QUERIES.SELECT_COMPLETE}`;
      const response = await this.dataverseService.request(
        'GET',
        `${ORGANIZATION_ENTITY.collectionName}(${id})?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      if (!response) return null;

      const organization = toInternal(response);

      if (!organization) return null;

      // Store in cache
      await this.redisService.set(cacheKey, JSON.stringify(organization), {
        EX: this.CACHE_TTL_SINGLE,
      });

      // Also cache by organization ID and slug
      if (organization.osot_organizationid) {
        await this.redisService.set(
          this.getCacheKey('id', organization.osot_organizationid),
          JSON.stringify(organization),
          { EX: this.CACHE_TTL_SINGLE },
        );
      }
      if (organization.osot_slug) {
        await this.redisService.set(
          this.getCacheKey('slug', organization.osot_slug),
          JSON.stringify(organization),
          { EX: this.CACHE_TTL_SLUG },
        );
      }

      return organization;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      this.logger.error(
        `Failed to find organization by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Find organization by business ID (osot_organizationid)
   *
   * @param organizationId - Business organization ID (osot-org-0000001)
   * @returns Organization or null if not found
   */
  async findByOrganizationId(
    organizationId: string,
  ): Promise<OrganizationInternal | null> {
    try {
      // Try cache first
      const cacheKey = this.getCacheKey('id', organizationId);
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        this.logger.debug(`Cache HIT for organization ID: ${organizationId}`);
        return JSON.parse(cached) as OrganizationInternal;
      }

      this.logger.debug(`Cache MISS for organization ID: ${organizationId}`);

      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const filter = ORGANIZATION_ODATA_FILTERS.byId(organizationId);
      const oDataQuery = `$filter=${filter}&$select=${ORGANIZATION_ODATA_QUERIES.SELECT_COMPLETE}&$top=1`;

      const response = await this.dataverseService.request(
        'GET',
        `${ORGANIZATION_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { value?: OrganizationDataverse[] };
      const organizationData = responseData?.value?.[0];

      if (!organizationData) return null;

      const organization = toInternal(organizationData);

      if (!organization) return null;

      // Store in cache
      await this.redisService.set(cacheKey, JSON.stringify(organization), {
        EX: this.CACHE_TTL_SINGLE,
      });

      // Also cache by GUID and slug
      if (organization.osot_table_organizationid) {
        await this.redisService.set(
          this.getCacheKey('guid', organization.osot_table_organizationid),
          JSON.stringify(organization),
          { EX: this.CACHE_TTL_SINGLE },
        );
      }
      if (organization.osot_slug) {
        await this.redisService.set(
          this.getCacheKey('slug', organization.osot_slug),
          JSON.stringify(organization),
          { EX: this.CACHE_TTL_SLUG },
        );
      }

      return organization;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      this.logger.error(
        `Failed to find organization by ID ${organizationId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Find organization by slug (public endpoint - white-label login)
   *
   * CRITICAL: This is used by the public login endpoint to fetch branding.
   * Longer cache TTL (10min) to reduce Dataverse load for high-traffic login pages.
   *
   * @param slug - Organization slug (lowercase, unique)
   * @returns Organization or null if not found
   */
  async findBySlug(slug: string): Promise<OrganizationInternal | null> {
    try {
      const normalizedSlug = slug.toLowerCase();

      // Try cache first (longer TTL for public endpoint)
      const cacheKey = this.getCacheKey('slug', normalizedSlug);
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        this.logger.debug(`Cache HIT for organization slug: ${normalizedSlug}`);
        return JSON.parse(cached) as OrganizationInternal;
      }

      this.logger.debug(`Cache MISS for organization slug: ${normalizedSlug}`);

      const app = getAppForOperation('read', 'public');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const filter = ORGANIZATION_ODATA_FILTERS.bySlug(normalizedSlug);
      const oDataQuery = `$filter=${filter}&$select=${ORGANIZATION_ODATA_QUERIES.SELECT_PUBLIC}&$top=1`;

      const response = await this.dataverseService.request(
        'GET',
        `${ORGANIZATION_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { value?: OrganizationDataverse[] };
      const organizationData = responseData?.value?.[0];

      if (!organizationData) return null;

      const organization = toInternal(organizationData);

      if (!organization) return null;

      // Store in cache with longer TTL
      await this.redisService.set(cacheKey, JSON.stringify(organization), {
        EX: this.CACHE_TTL_SLUG,
      });

      return organization;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      this.logger.error(
        `Failed to find organization by slug ${slug}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  // ========================================
  // READ (List/Query)
  // ========================================

  /**
   * Find all organizations with filtering, sorting, pagination
   *
   * @param options - Query options (filters, sorting, pagination)
   * @returns Array of organizations and total count
   */
  async findAll(
    options: OrganizationQueryOptions = {},
  ): Promise<{ data: OrganizationInternal[]; total: number }> {
    try {
      // Try cache first
      const cacheKey = this.getListCacheKey(options as Record<string, unknown>);
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        this.logger.debug(`Cache HIT for organization list query`);
        return JSON.parse(cached) as {
          data: OrganizationInternal[];
          total: number;
        };
      }

      this.logger.debug(`Cache MISS for organization list query`);

      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Build OData query
      const filters: string[] = [];

      // Status filter
      if (options.status !== undefined) {
        filters.push(ORGANIZATION_ODATA_FILTERS.byStatus(options.status));
      }

      // Search filter (searches organization_name and legal_name)
      if (options.search) {
        const searchValue = options.search.toLowerCase();
        filters.push(
          `(contains(tolower(${ORGANIZATION_ODATA.ORGANIZATION_NAME}), '${searchValue}') or contains(tolower(${ORGANIZATION_ODATA.LEGAL_NAME}), '${searchValue}'))`,
        );
      }

      // Slug filter (exact match)
      if (options.slug) {
        filters.push(ORGANIZATION_ODATA_FILTERS.bySlug(options.slug));
      }

      const filterString =
        filters.length > 0 ? `$filter=${filters.join(' and ')}` : '';

      // Sorting
      const sortDirection = options.orderDirection || 'asc';
      const orderBy =
        sortDirection === 'asc'
          ? ORGANIZATION_ODATA_ORDERBY.nameAsc
          : ORGANIZATION_ODATA_ORDERBY.nameDesc;

      const orderByString = `$orderby=${orderBy}`;

      // Pagination
      const skip = options.skip || 0;
      const top = options.top || 20;

      const paginationString = `$skip=${skip}&$top=${top}`;

      // Combine query parts
      const queryParts = [
        filterString,
        orderByString,
        paginationString,
        `$select=${ORGANIZATION_ODATA_QUERIES.SELECT_BASIC}`,
        '$count=true',
      ].filter(Boolean);

      const oDataQuery = queryParts.join('&');

      const response = await this.dataverseService.request(
        'GET',
        `${ORGANIZATION_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: OrganizationDataverse[];
        '@odata.count'?: number;
      };

      const organizations = toInternalArray(responseData?.value || []);
      const total = responseData?.['@odata.count'] || 0;

      const result = { data: organizations, total };

      // Store in cache
      await this.redisService.set(cacheKey, JSON.stringify(result), {
        EX: this.CACHE_TTL_LIST,
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to find organizations: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { data: [], total: 0 };
    }
  }

  // ========================================
  // VALIDATION HELPERS
  // ========================================

  /**
   * Check if slug is unique (not already in use)
   *
   * @param slug - Slug to check
   * @param excludeId - Optional organization ID to exclude (for updates)
   * @returns True if slug is unique, false if already exists
   */
  async isSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
    try {
      const normalizedSlug = slug.toLowerCase();

      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      let filter = ORGANIZATION_ODATA_FILTERS.bySlug(normalizedSlug);

      // Exclude current organization if updating
      if (excludeId) {
        filter += ` and ${ORGANIZATION_ODATA.ORGANIZATION_ID} ne '${excludeId}'`;
      }

      const oDataQuery = `$filter=${filter}&$select=${ORGANIZATION_ODATA.ORGANIZATION_ID}&$top=1`;

      const response = await this.dataverseService.request(
        'GET',
        `${ORGANIZATION_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { value?: unknown[] };
      const count = responseData?.value?.length || 0;

      return count === 0; // Slug is unique if no results found
    } catch (error) {
      this.logger.error(
        `Failed to check slug uniqueness for ${slug}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false; // Assume not unique on error (safe default)
    }
  }

  /**
   * Check if organization exists by ID
   *
   * @param id - Organization ID (business ID or GUID)
   * @returns True if exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    try {
      const organization = await this.findById(id);
      return organization !== null;
    } catch (error) {
      this.logger.error(
        `Failed to check organization existence for ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Count organizations matching filters
   *
   * @param options - Query options (only filters, no pagination)
   * @returns Total count
   */
  async count(options: OrganizationQueryOptions = {}): Promise<number> {
    try {
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Build filters
      const filters: string[] = [];

      if (options.status !== undefined) {
        filters.push(ORGANIZATION_ODATA_FILTERS.byStatus(options.status));
      }

      if (options.search) {
        const searchValue = options.search.toLowerCase();
        filters.push(
          `(contains(tolower(${ORGANIZATION_ODATA.ORGANIZATION_NAME}), '${searchValue}') or contains(tolower(${ORGANIZATION_ODATA.LEGAL_NAME}), '${searchValue}'))`,
        );
      }

      const filterString =
        filters.length > 0 ? `$filter=${filters.join(' and ')}` : '';

      const oDataQuery = filterString
        ? `${filterString}&$count=true&$top=0`
        : '$count=true&$top=0';

      const response = await this.dataverseService.request(
        'GET',
        `${ORGANIZATION_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { '@odata.count'?: number };
      return responseData?.['@odata.count'] || 0;
    } catch (error) {
      this.logger.error(
        `Failed to count organizations: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }

  // ========================================
  // UPDATE
  // ========================================

  /**
   * Update an organization
   *
   * NOTE: Slug cannot be updated (immutable after creation)
   *
   * @param id - Table organization ID (GUID)
   * @param data - Partial organization data to update
   * @returns Updated organization
   * @throws Error if update fails
   */
  async update(
    id: string,
    data: Partial<OrganizationInternal>,
  ): Promise<OrganizationInternal> {
    try {
      this.logger.debug(`Updating organization: ${id}`);

      // Fetch current organization to get slug for cache invalidation
      const currentOrg = await this.findById(id);
      if (!currentOrg) {
        throw new Error(`Organization not found: ${id}`);
      }

      const app = getAppForOperation('write', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Convert to Dataverse format
      const payload = toDataverse(data as OrganizationInternal);

      // Remove immutable fields from payload
      delete payload.osot_slug; // Slug is immutable
      delete payload.osot_table_organizationid; // System field
      delete payload.osot_organizationid; // Business ID (autonumber)
      delete payload.createdon; // System field
      delete payload.ownerid; // System field

      // Update in Dataverse
      await this.dataverseService.request(
        'PATCH',
        `${ORGANIZATION_ENTITY.collectionName}(${id})`,
        payload,
        credentials,
        app,
      );

      // Invalidate cache
      await this.invalidateCache(
        currentOrg.osot_organizationid,
        currentOrg.osot_slug,
        id,
      );

      // Fetch updated organization
      const updatedOrganization = await this.findById(id);

      if (!updatedOrganization) {
        throw new Error('Failed to fetch updated organization');
      }

      this.logger.log(`Organization updated successfully: ${id}`);

      return updatedOrganization;
    } catch (error) {
      this.logger.error(
        `Failed to update organization ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // ========================================
  // DELETE
  // ========================================

  /**
   * Soft delete organization (set status to INACTIVE)
   *
   * @param id - Table organization ID (GUID)
   * @returns True if deleted successfully
   * @throws Error if delete fails
   */
  async delete(id: string): Promise<boolean> {
    try {
      this.logger.debug(`Soft deleting organization: ${id}`);

      // Fetch current organization for cache invalidation
      const currentOrg = await this.findById(id);
      if (!currentOrg) {
        throw new Error(`Organization not found: ${id}`);
      }

      const app = getAppForOperation('write', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Set status to INACTIVE (2)
      const payload = {
        [ORGANIZATION_ODATA.ORGANIZATION_STATUS]: 2, // AccountStatus.INACTIVE
      };

      await this.dataverseService.request(
        'PATCH',
        `${ORGANIZATION_ENTITY.collectionName}(${id})`,
        payload,
        credentials,
        app,
      );

      // Invalidate cache
      await this.invalidateCache(
        currentOrg.osot_organizationid,
        currentOrg.osot_slug,
        id,
      );

      this.logger.log(`Organization soft deleted successfully: ${id}`);

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to soft delete organization ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Hard delete organization (permanently remove from Dataverse)
   *
   * WARNING: This is irreversible. Use with caution.
   * Should only be used for test data cleanup or compliance requirements.
   *
   * @param id - Table organization ID (GUID)
   * @returns True if deleted successfully
   * @throws Error if delete fails
   */
  async hardDelete(id: string): Promise<boolean> {
    try {
      this.logger.warn(`Hard deleting organization: ${id} (IRREVERSIBLE)`);

      // Fetch current organization for cache invalidation
      const currentOrg = await this.findById(id);
      if (!currentOrg) {
        throw new Error(`Organization not found: ${id}`);
      }

      const app = getAppForOperation('delete', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      await this.dataverseService.request(
        'DELETE',
        `${ORGANIZATION_ENTITY.collectionName}(${id})`,
        undefined,
        credentials,
        app,
      );

      // Invalidate cache
      await this.invalidateCache(
        currentOrg.osot_organizationid,
        currentOrg.osot_slug,
        id,
      );

      this.logger.log(`Organization hard deleted successfully: ${id}`);

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to hard delete organization ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
