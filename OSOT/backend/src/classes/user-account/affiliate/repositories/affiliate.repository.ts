/**
 * Affiliate Repository Implementation (SIMPLIFIED)
 * Handles data access operations for Affiliate records in Dataverse.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for structured error handling
 * - integrations: Uses DataverseService for all data operations
 * - interfaces: Implements AffiliateRepository contract
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT needs
 * - Clean abstraction over DataverseService
 * - Follows OTA Education repository pattern exactly
 */

import { Injectable } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { ErrorCodes } from '../../../../common/errors/error-codes';

// Import interfaces and constants
import { AffiliateInternal } from '../interfaces/affiliate-internal.interface';
import { AffiliateDataverse } from '../interfaces/affiliate-dataverse.interface';
import { AffiliateRepository } from '../interfaces/affiliate-repository.interface';
import {
  AFFILIATE_ODATA,
  AFFILIATE_FIELDS,
} from '../constants/affiliate.constants';

// Type definitions for Dataverse responses
interface DataverseCollectionResponse {
  value: AffiliateDataverse[];
  '@odata.count'?: number;
}

@Injectable()
export class AffiliateRepositoryService implements AffiliateRepository {
  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Create a new affiliate record
   */
  async create(
    affiliateData: Partial<AffiliateInternal>,
  ): Promise<AffiliateInternal> {
    try {
      const payload = this.mapToDataverse(affiliateData);
      const response = await this.dataverseService.request(
        'POST',
        AFFILIATE_ODATA.TABLE_NAME,
        payload,
      );

      return this.mapFromDataverse(response as AffiliateDataverse);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find affiliate by ID
   */
  async findById(affiliateId: string): Promise<AffiliateInternal | null> {
    try {
      const response = await this.dataverseService.request(
        'GET',
        `${AFFILIATE_ODATA.TABLE_NAME}(${affiliateId})`,
      );

      return response
        ? this.mapFromDataverse(response as AffiliateDataverse)
        : null;
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
   * Find affiliate by business ID
   */
  async findByBusinessId(
    businessId: string,
  ): Promise<AffiliateInternal | null> {
    try {
      const query = `$filter=${AFFILIATE_FIELDS.AFFILIATE_ID} eq '${businessId}'`;
      const response = await this.dataverseService.request(
        'GET',
        `${AFFILIATE_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.length > 0 ? this.mapFromDataverse(records[0]) : null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find affiliate by email address
   */
  async findByEmail(
    email: string,
    organizationGuid?: string,
  ): Promise<AffiliateInternal | null> {
    try {
      let filter = `${AFFILIATE_FIELDS.AFFILIATE_EMAIL} eq '${email}'`;
      if (organizationGuid) {
        filter += ` and _osot_table_organization_value eq '${organizationGuid}'`;
      }

      const query = `$filter=${filter}`;
      const response = await this.dataverseService.request(
        'GET',
        `${AFFILIATE_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.length > 0 ? this.mapFromDataverse(records[0]) : null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find affiliate by organization name
   */
  async findByName(name: string): Promise<AffiliateInternal | null> {
    try {
      const query = `$filter=${AFFILIATE_FIELDS.AFFILIATE_NAME} eq '${name}'`;
      const response = await this.dataverseService.request(
        'GET',
        `${AFFILIATE_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.length > 0 ? this.mapFromDataverse(records[0]) : null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Update affiliate by ID
   */
  async update(
    affiliateId: string,
    updateData: Partial<AffiliateInternal>,
  ): Promise<AffiliateInternal> {
    try {
      const payload = this.mapToDataverse(updateData);

      // Execute PATCH request (Dataverse doesn't return data by default)
      await this.dataverseService.request(
        'PATCH',
        `${AFFILIATE_ODATA.TABLE_NAME}(${affiliateId})`,
        payload,
      );

      // Fetch the updated record to return complete data
      const updatedRecord = await this.findById(affiliateId);

      if (!updatedRecord) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          operation: 'update_affiliate',
          entityId: affiliateId,
          entityType: 'Affiliate',
          message: 'Updated record not found',
        });
      }

      return updatedRecord;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'update_affiliate',
        entityId: affiliateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete affiliate by ID (soft delete)
   */
  async delete(affiliateId: string): Promise<boolean> {
    try {
      await this.dataverseService.request(
        'DELETE',
        `${AFFILIATE_ODATA.TABLE_NAME}(${affiliateId})`,
      );
      return true;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Check if affiliate exists by ID
   */
  async exists(affiliateId: string): Promise<boolean> {
    try {
      const result = await this.findById(affiliateId);
      return !!result;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find active affiliates (active_member = true)
   */
  async findActiveAffiliates(limit?: number): Promise<AffiliateInternal[]> {
    try {
      const filters = { activeMember: true, limit };
      return this.findMany(filters);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find affiliates by province
   */
  async findByProvince(
    province: number,
    limit?: number,
  ): Promise<AffiliateInternal[]> {
    try {
      const filters = { province, limit };
      return this.findMany(filters);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find affiliates by country
   */
  async findByCountry(
    country: number,
    limit?: number,
  ): Promise<AffiliateInternal[]> {
    try {
      const filters = { country, limit };
      return this.findMany(filters);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Search affiliates by name (partial match)
   */
  async searchByName(
    searchTerm: string,
    limit?: number,
  ): Promise<AffiliateInternal[]> {
    try {
      const filters = { search: searchTerm, limit };
      return this.findMany(filters);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Search affiliates by representative name
   */
  async searchByRepresentative(
    searchTerm: string,
    limit?: number,
  ): Promise<AffiliateInternal[]> {
    try {
      const filters = { search: searchTerm, limit };
      return this.findMany(filters);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Advanced search with multiple filters
   */
  async advancedSearch(
    filters: {
      name?: string;
      area?: number;
      status?: number;
      province?: number;
      country?: number;
      activeOnly?: boolean;
    },
    limit?: number,
  ): Promise<AffiliateInternal[]> {
    try {
      const searchFilters = {
        search: filters.name,
        affiliateArea: filters.area,
        accountStatus: filters.status,
        province: filters.province,
        country: filters.country,
        activeMember: filters.activeOnly,
        limit,
      };
      return this.findMany(searchFilters);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Validate affiliate credentials for login
   */
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<AffiliateInternal | null> {
    try {
      // Note: This is a simplified implementation
      // In production, you would hash the password and compare
      const affiliate = await this.findByEmail(email);
      if (affiliate && affiliate.osot_password === password) {
        return affiliate;
      }
      return null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Check if email is already registered
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    try {
      const affiliate = await this.findByEmail(email);
      if (!affiliate) return false;
      if (excludeId && affiliate.osot_table_account_affiliateid === excludeId) {
        return false;
      }
      return true;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Update affiliate password
   */
  async updatePassword(
    affiliateId: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      const updateData = { osot_password: hashedPassword };
      await this.update(affiliateId, updateData);
      return true;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Count affiliates by area
   */
  async countByArea(): Promise<Record<number, number>> {
    try {
      // This is a simplified implementation
      // In production, you might use group by queries
      const result: Record<number, number> = {};
      for (let area = 0; area <= 11; area++) {
        const count = await this.count({ affiliateArea: area });
        result[area] = count;
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
   * Count affiliates by status
   */
  async countByStatus(): Promise<Record<number, number>> {
    try {
      const result: Record<number, number> = {};
      for (let status = 1; status <= 3; status++) {
        const count = await this.count({ accountStatus: status });
        result[status] = count;
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
   * Count affiliates by province
   */
  async countByProvince(country?: number): Promise<Record<number, number>> {
    try {
      const result: Record<number, number> = {};
      for (let province = 0; province <= 13; province++) {
        const filters = country ? { province, country } : { province };
        const count = await this.count(filters);
        result[province] = count;
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
   * Get total affiliate count
   */
  async getTotalCount(activeOnly?: boolean): Promise<number> {
    try {
      const filters = activeOnly ? { activeMember: true } : {};
      return this.count(filters);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Get recently created affiliates
   */
  async getRecentlyCreated(
    days: number,
    limit?: number,
  ): Promise<AffiliateInternal[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const isoDate = cutoffDate.toISOString();

      const query = `$filter=${AFFILIATE_FIELDS.CREATED_ON} ge ${isoDate}${
        limit ? `&$top=${limit}` : ''
      }&$orderby=${AFFILIATE_FIELDS.CREATED_ON} desc`;

      const response = await this.dataverseService.request(
        'GET',
        `${AFFILIATE_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.map((record: AffiliateDataverse) =>
        this.mapFromDataverse(record),
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
   * Bulk update affiliate status
   */
  async bulkUpdateStatus(
    affiliateIds: string[],
    newStatus: number,
  ): Promise<number> {
    try {
      let updateCount = 0;
      for (const affiliateId of affiliateIds) {
        try {
          await this.update(affiliateId, { osot_account_status: newStatus });
          updateCount++;
        } catch (error) {
          // Log error but continue with other updates
          console.error(`Failed to update affiliate ${affiliateId}:`, error);
        }
      }
      return updateCount;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Raw Dataverse query for complex scenarios
   */
  async queryRaw(
    query: Record<string, unknown>,
  ): Promise<AffiliateDataverse[]> {
    try {
      const queryString = Object.entries(query)
        .map(
          ([key, value]) =>
            `${key}=${encodeURIComponent(JSON.stringify(value))}`,
        )
        .join('&');

      const response = await this.dataverseService.request(
        'GET',
        `${AFFILIATE_ODATA.TABLE_NAME}?${queryString}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      return collectionResponse?.value || [];
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Execute custom OData query string
   */
  async executeQuery(oDataQuery: string): Promise<AffiliateDataverse[]> {
    try {
      const response = await this.dataverseService.request(
        'GET',
        `${AFFILIATE_ODATA.TABLE_NAME}?${oDataQuery}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      return collectionResponse?.value || [];
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Batch create multiple affiliates
   */
  async batchCreate(
    affiliatesData: Partial<AffiliateInternal>[],
  ): Promise<AffiliateInternal[]> {
    try {
      const results: AffiliateInternal[] = [];
      for (const affiliateData of affiliatesData) {
        try {
          const created = await this.create(affiliateData);
          results.push(created);
        } catch (error) {
          console.error('Failed to create affiliate in batch:', error);
        }
      }
      return results;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Batch update multiple affiliates
   */
  async batchUpdate(
    updates: Array<{
      id: string;
      data: Partial<AffiliateInternal>;
    }>,
  ): Promise<AffiliateInternal[]> {
    try {
      const results: AffiliateInternal[] = [];
      for (const update of updates) {
        try {
          const updated = await this.update(update.id, update.data);
          results.push(updated);
        } catch (error) {
          console.error(`Failed to update affiliate ${update.id}:`, error);
        }
      }
      return results;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find affiliates by owner/user
   */
  async findByOwner(ownerId: string): Promise<AffiliateInternal[]> {
    try {
      const query = `$filter=${AFFILIATE_FIELDS.OWNER_ID} eq '${ownerId}'`;
      const response = await this.dataverseService.request(
        'GET',
        `${AFFILIATE_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.map((record: AffiliateDataverse) =>
        this.mapFromDataverse(record),
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
   * Transfer affiliate ownership
   */
  async transferOwnership(
    affiliateId: string,
    newOwnerId: string,
  ): Promise<boolean> {
    try {
      const updateData = { ownerid: newOwnerId };
      await this.update(affiliateId, updateData);
      return true;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find multiple affiliate records with filters
   */
  async findMany(filters: {
    affiliateArea?: number;
    accountStatus?: number;
    province?: number;
    country?: number;
    city?: number;
    activeMember?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<AffiliateInternal[]> {
    try {
      const filterClauses: string[] = [];

      if (filters.affiliateArea !== undefined) {
        filterClauses.push(
          `${AFFILIATE_FIELDS.AFFILIATE_AREA} eq ${filters.affiliateArea}`,
        );
      }
      if (filters.accountStatus !== undefined) {
        filterClauses.push(
          `${AFFILIATE_FIELDS.ACCOUNT_STATUS} eq ${filters.accountStatus}`,
        );
      }
      if (filters.province !== undefined) {
        filterClauses.push(
          `${AFFILIATE_FIELDS.AFFILIATE_PROVINCE} eq ${filters.province}`,
        );
      }
      if (filters.country !== undefined) {
        filterClauses.push(
          `${AFFILIATE_FIELDS.AFFILIATE_COUNTRY} eq ${filters.country}`,
        );
      }
      if (filters.city !== undefined) {
        filterClauses.push(
          `${AFFILIATE_FIELDS.AFFILIATE_CITY} eq ${filters.city}`,
        );
      }
      if (filters.activeMember !== undefined) {
        filterClauses.push(
          `${AFFILIATE_FIELDS.ACTIVE_MEMBER} eq ${filters.activeMember}`,
        );
      }
      if (filters.search) {
        const searchQuery = `(contains(${AFFILIATE_FIELDS.AFFILIATE_NAME},'${filters.search}') or contains(${AFFILIATE_FIELDS.REPRESENTATIVE_FIRST_NAME},'${filters.search}') or contains(${AFFILIATE_FIELDS.REPRESENTATIVE_LAST_NAME},'${filters.search}') or contains(${AFFILIATE_FIELDS.AFFILIATE_EMAIL},'${filters.search}'))`;
        filterClauses.push(searchQuery);
      }

      let query = '';
      if (filterClauses.length > 0) {
        query += `$filter=${filterClauses.join(' and ')}`;
      }

      if (filters.limit) {
        query += query ? '&' : '';
        query += `$top=${filters.limit}`;
      }

      if (filters.offset) {
        query += query ? '&' : '';
        query += `$skip=${filters.offset}`;
      }

      const response = await this.dataverseService.request(
        'GET',
        `${AFFILIATE_ODATA.TABLE_NAME}${query ? '?' + query : ''}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.map((record: AffiliateDataverse) =>
        this.mapFromDataverse(record),
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
   * Count affiliate records with filters
   */
  async count(filters: {
    affiliateArea?: number;
    accountStatus?: number;
    province?: number;
    country?: number;
    city?: number;
    activeMember?: boolean;
    search?: string;
  }): Promise<number> {
    try {
      const filterClauses: string[] = [];

      if (filters.affiliateArea !== undefined) {
        filterClauses.push(
          `${AFFILIATE_FIELDS.AFFILIATE_AREA} eq ${filters.affiliateArea}`,
        );
      }
      if (filters.accountStatus !== undefined) {
        filterClauses.push(
          `${AFFILIATE_FIELDS.ACCOUNT_STATUS} eq ${filters.accountStatus}`,
        );
      }
      if (filters.province !== undefined) {
        filterClauses.push(
          `${AFFILIATE_FIELDS.AFFILIATE_PROVINCE} eq ${filters.province}`,
        );
      }
      if (filters.country !== undefined) {
        filterClauses.push(
          `${AFFILIATE_FIELDS.AFFILIATE_COUNTRY} eq ${filters.country}`,
        );
      }
      if (filters.city !== undefined) {
        filterClauses.push(
          `${AFFILIATE_FIELDS.AFFILIATE_CITY} eq ${filters.city}`,
        );
      }
      if (filters.activeMember !== undefined) {
        filterClauses.push(
          `${AFFILIATE_FIELDS.ACTIVE_MEMBER} eq ${filters.activeMember}`,
        );
      }
      if (filters.search) {
        const searchQuery = `(contains(${AFFILIATE_FIELDS.AFFILIATE_NAME},'${filters.search}') or contains(${AFFILIATE_FIELDS.REPRESENTATIVE_FIRST_NAME},'${filters.search}') or contains(${AFFILIATE_FIELDS.REPRESENTATIVE_LAST_NAME},'${filters.search}') or contains(${AFFILIATE_FIELDS.AFFILIATE_EMAIL},'${filters.search}'))`;
        filterClauses.push(searchQuery);
      }

      let query = '$count=true';
      if (filterClauses.length > 0) {
        query += `&$filter=${filterClauses.join(' and ')}`;
      }

      const response = await this.dataverseService.request(
        'GET',
        `${AFFILIATE_ODATA.TABLE_NAME}?${query}`,
      );

      const countResponse = response as DataverseCollectionResponse;
      return countResponse?.['@odata.count'] || 0;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find affiliates by business area
   */
  async findByArea(area: number): Promise<AffiliateInternal[]> {
    try {
      const query = `$filter=${AFFILIATE_FIELDS.AFFILIATE_AREA} eq ${area}`;
      const response = await this.dataverseService.request(
        'GET',
        `${AFFILIATE_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.map((record: AffiliateDataverse) =>
        this.mapFromDataverse(record),
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
   * Find affiliates by status
   */
  async findByStatus(status: number): Promise<AffiliateInternal[]> {
    try {
      const query = `$filter=${AFFILIATE_FIELDS.ACCOUNT_STATUS} eq ${status}`;
      const response = await this.dataverseService.request(
        'GET',
        `${AFFILIATE_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.map((record: AffiliateDataverse) =>
        this.mapFromDataverse(record),
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
   * Find affiliates by geographic location
   */
  async findByLocation(filters: {
    province?: number;
    country?: number;
    city?: number;
  }): Promise<AffiliateInternal[]> {
    try {
      const filterClauses: string[] = [];

      if (filters.province !== undefined) {
        filterClauses.push(
          `${AFFILIATE_FIELDS.AFFILIATE_PROVINCE} eq ${filters.province}`,
        );
      }
      if (filters.country !== undefined) {
        filterClauses.push(
          `${AFFILIATE_FIELDS.AFFILIATE_COUNTRY} eq ${filters.country}`,
        );
      }
      if (filters.city !== undefined) {
        filterClauses.push(
          `${AFFILIATE_FIELDS.AFFILIATE_CITY} eq ${filters.city}`,
        );
      }

      if (filterClauses.length === 0) {
        return [];
      }

      const query = `$filter=${filterClauses.join(' and ')}`;
      const response = await this.dataverseService.request(
        'GET',
        `${AFFILIATE_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.map((record: AffiliateDataverse) =>
        this.mapFromDataverse(record),
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
   * Transform Dataverse response to internal format
   */
  mapFromDataverse(dataverse: AffiliateDataverse): AffiliateInternal {
    return {
      // System fields
      osot_table_account_affiliateid:
        dataverse[AFFILIATE_FIELDS.TABLE_ACCOUNT_AFFILIATE],
      osot_affiliate_id: dataverse[AFFILIATE_FIELDS.AFFILIATE_ID],
      ownerid: dataverse[AFFILIATE_FIELDS.OWNER_ID],
      createdon: dataverse[AFFILIATE_FIELDS.CREATED_ON],
      modifiedon: dataverse[AFFILIATE_FIELDS.MODIFIED_ON],

      // Organization profile
      osot_affiliate_name: dataverse[AFFILIATE_FIELDS.AFFILIATE_NAME],
      osot_affiliate_area: dataverse[AFFILIATE_FIELDS.AFFILIATE_AREA],

      // Representative identity
      osot_representative_first_name:
        dataverse[AFFILIATE_FIELDS.REPRESENTATIVE_FIRST_NAME],
      osot_representative_last_name:
        dataverse[AFFILIATE_FIELDS.REPRESENTATIVE_LAST_NAME],
      osot_representative_job_title:
        dataverse[AFFILIATE_FIELDS.REPRESENTATIVE_JOB_TITLE],

      // Contact information
      osot_affiliate_email: dataverse[AFFILIATE_FIELDS.AFFILIATE_EMAIL],
      osot_affiliate_phone: dataverse[AFFILIATE_FIELDS.AFFILIATE_PHONE],
      osot_affiliate_website: dataverse[AFFILIATE_FIELDS.AFFILIATE_WEBSITE],

      // Social media
      osot_affiliate_facebook: dataverse[AFFILIATE_FIELDS.AFFILIATE_FACEBOOK],
      osot_affiliate_instagram: dataverse[AFFILIATE_FIELDS.AFFILIATE_INSTAGRAM],
      osot_affiliate_tiktok: dataverse[AFFILIATE_FIELDS.AFFILIATE_TIKTOK],
      osot_affiliate_linkedin: dataverse[AFFILIATE_FIELDS.AFFILIATE_LINKEDIN],

      // Address
      osot_affiliate_address_1: dataverse[AFFILIATE_FIELDS.AFFILIATE_ADDRESS_1],
      osot_affiliate_address_2: dataverse[AFFILIATE_FIELDS.AFFILIATE_ADDRESS_2],
      osot_affiliate_city: dataverse[AFFILIATE_FIELDS.AFFILIATE_CITY],
      osot_affiliate_province: dataverse[AFFILIATE_FIELDS.AFFILIATE_PROVINCE],
      osot_affiliate_postal_code:
        dataverse[AFFILIATE_FIELDS.AFFILIATE_POSTAL_CODE],
      osot_affiliate_country: dataverse[AFFILIATE_FIELDS.AFFILIATE_COUNTRY],
      osot_other_city: dataverse[AFFILIATE_FIELDS.OTHER_CITY],
      osot_other_province_state:
        dataverse[AFFILIATE_FIELDS.OTHER_PROVINCE_STATE],

      // Account & security
      osot_password: dataverse[AFFILIATE_FIELDS.PASSWORD],
      osot_account_status: dataverse[AFFILIATE_FIELDS.ACCOUNT_STATUS],
      osot_account_declaration: dataverse[AFFILIATE_FIELDS.ACCOUNT_DECLARATION],
      osot_active_member: dataverse[AFFILIATE_FIELDS.ACTIVE_MEMBER],

      // Access control
      osot_access_modifiers: dataverse[AFFILIATE_FIELDS.ACCESS_MODIFIERS],
      osot_privilege: dataverse[AFFILIATE_FIELDS.PRIVILEGE],
    };
  }

  /**
   * Transform internal format to Dataverse format
   */
  mapToDataverse(
    internal: Partial<AffiliateInternal>,
  ): Partial<AffiliateDataverse> {
    const dataverse: Record<string, unknown> = {};

    // Map organization profile
    if (internal.osot_affiliate_name !== undefined) {
      dataverse[AFFILIATE_FIELDS.AFFILIATE_NAME] = internal.osot_affiliate_name;
    }
    if (internal.osot_affiliate_area !== undefined) {
      dataverse[AFFILIATE_FIELDS.AFFILIATE_AREA] = internal.osot_affiliate_area;
    }

    // Map representative identity
    if (internal.osot_representative_first_name !== undefined) {
      dataverse[AFFILIATE_FIELDS.REPRESENTATIVE_FIRST_NAME] =
        internal.osot_representative_first_name;
    }
    if (internal.osot_representative_last_name !== undefined) {
      dataverse[AFFILIATE_FIELDS.REPRESENTATIVE_LAST_NAME] =
        internal.osot_representative_last_name;
    }
    if (internal.osot_representative_job_title !== undefined) {
      dataverse[AFFILIATE_FIELDS.REPRESENTATIVE_JOB_TITLE] =
        internal.osot_representative_job_title;
    }

    // Map contact information
    if (internal.osot_affiliate_email !== undefined) {
      dataverse[AFFILIATE_FIELDS.AFFILIATE_EMAIL] =
        internal.osot_affiliate_email;
    }
    if (internal.osot_affiliate_phone !== undefined) {
      dataverse[AFFILIATE_FIELDS.AFFILIATE_PHONE] =
        internal.osot_affiliate_phone;
    }
    if (internal.osot_affiliate_website !== undefined) {
      dataverse[AFFILIATE_FIELDS.AFFILIATE_WEBSITE] =
        internal.osot_affiliate_website;
    }

    // Map social media
    if (internal.osot_affiliate_facebook !== undefined) {
      dataverse[AFFILIATE_FIELDS.AFFILIATE_FACEBOOK] =
        internal.osot_affiliate_facebook;
    }
    if (internal.osot_affiliate_instagram !== undefined) {
      dataverse[AFFILIATE_FIELDS.AFFILIATE_INSTAGRAM] =
        internal.osot_affiliate_instagram;
    }
    if (internal.osot_affiliate_tiktok !== undefined) {
      dataverse[AFFILIATE_FIELDS.AFFILIATE_TIKTOK] =
        internal.osot_affiliate_tiktok;
    }
    if (internal.osot_affiliate_linkedin !== undefined) {
      dataverse[AFFILIATE_FIELDS.AFFILIATE_LINKEDIN] =
        internal.osot_affiliate_linkedin;
    }

    // Map address
    if (internal.osot_affiliate_address_1 !== undefined) {
      dataverse[AFFILIATE_FIELDS.AFFILIATE_ADDRESS_1] =
        internal.osot_affiliate_address_1;
    }
    if (internal.osot_affiliate_address_2 !== undefined) {
      dataverse[AFFILIATE_FIELDS.AFFILIATE_ADDRESS_2] =
        internal.osot_affiliate_address_2;
    }
    if (internal.osot_affiliate_city !== undefined) {
      dataverse[AFFILIATE_FIELDS.AFFILIATE_CITY] = internal.osot_affiliate_city;
    }
    if (internal.osot_affiliate_province !== undefined) {
      dataverse[AFFILIATE_FIELDS.AFFILIATE_PROVINCE] =
        internal.osot_affiliate_province;
    }
    if (internal.osot_affiliate_postal_code !== undefined) {
      dataverse[AFFILIATE_FIELDS.AFFILIATE_POSTAL_CODE] =
        internal.osot_affiliate_postal_code;
    }
    if (internal.osot_affiliate_country !== undefined) {
      dataverse[AFFILIATE_FIELDS.AFFILIATE_COUNTRY] =
        internal.osot_affiliate_country;
    }
    if (internal.osot_other_city !== undefined) {
      dataverse[AFFILIATE_FIELDS.OTHER_CITY] = internal.osot_other_city;
    }
    if (internal.osot_other_province_state !== undefined) {
      dataverse[AFFILIATE_FIELDS.OTHER_PROVINCE_STATE] =
        internal.osot_other_province_state;
    }

    // Map account & security
    if (internal.osot_password !== undefined) {
      dataverse[AFFILIATE_FIELDS.PASSWORD] = internal.osot_password;
    }
    if (internal.osot_account_status !== undefined) {
      dataverse[AFFILIATE_FIELDS.ACCOUNT_STATUS] = internal.osot_account_status;
    }
    if (internal.osot_account_declaration !== undefined) {
      dataverse[AFFILIATE_FIELDS.ACCOUNT_DECLARATION] =
        internal.osot_account_declaration;
    }
    if (internal.osot_active_member !== undefined) {
      dataverse[AFFILIATE_FIELDS.ACTIVE_MEMBER] = internal.osot_active_member;
    }

    // Map access control
    if (internal.osot_access_modifiers !== undefined) {
      dataverse[AFFILIATE_FIELDS.ACCESS_MODIFIERS] =
        internal.osot_access_modifiers;
    }
    if (internal.osot_privilege !== undefined) {
      dataverse[AFFILIATE_FIELDS.PRIVILEGE] = internal.osot_privilege;
    }

    return dataverse as Partial<AffiliateDataverse>;
  }
}
