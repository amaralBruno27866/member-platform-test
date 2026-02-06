import { Injectable } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import {
  MEMBERSHIP_CATEGORY_DEFAULTS,
  MEMBERSHIP_CATEGORY_RULES,
} from '../constants/business.constants';
import { MembershipCategoryDataverse } from '../interfaces/membership-category-dataverse.interface';
import {
  Category,
  MembershipEligilibility,
  AffiliateEligibility,
  AccessModifier,
  Privilege,
  UserGroup,
} from '../../../../common/enums';

export const MEMBERSHIP_CATEGORY_REPOSITORY = 'MEMBERSHIP_CATEGORY_REPOSITORY';

/**
 * OData field mappings for Membership Category entity
 * Maps logical field names to their OData equivalents
 */
const MEMBERSHIP_CATEGORY_ODATA = {
  TABLE_NAME: 'osot_table_membership_categories',
  FIELDS: {
    // System fields
    ID: 'osot_table_membership_categoryid', // Primary key (singular, not plural)
    CATEGORY_ID: 'osot_category_id',
    CREATED_ON: 'createdon',
    MODIFIED_ON: 'modifiedon',
    OWNER_ID: 'ownerid',

    // User reference fields (lookups)
    ACCOUNT_ID: 'osot_table_account', // For write operations (OData bind)
    ACCOUNT_ID_VALUE: '_osot_table_account_value', // For read operations (lookup value)
    AFFILIATE_ID: 'osot_table_account_affiliate', // For write operations (OData bind)
    AFFILIATE_ID_VALUE: '_osot_table_account_affiliate_value', // For read operations (lookup value)

    // Core membership fields
    MEMBERSHIP_YEAR: 'osot_membership_year',
    ELIGIBILITY: 'osot_eligibility',
    ELIGIBILITY_AFFILIATE: 'osot_eligibility_affiliate',
    MEMBERSHIP_CATEGORY: 'osot_membership_category',
    USERS_GROUP: 'osot_users_group',

    // Date fields
    PARENTAL_LEAVE_FROM: 'osot_parental_leave_from',
    PARENTAL_LEAVE_TO: 'osot_parental_leave_to',
    PARENTAL_LEAVE_EXPECTED: 'osot_parental_leave_expected',
    RETIREMENT_START: 'osot_retirement_start',

    // Permission fields
    ACCESS_MODIFIERS: 'osot_access_modifiers',
    PRIVILEGE: 'osot_privilege',
  },
  // Navigation properties for related entities
  NAVIGATION: {
    ACCOUNT: 'osot_Table_Account',
    AFFILIATE: 'osot_Table_Account_Affiliate',
  },
} as const;

@Injectable()
export class MembershipCategoryRepositoryService {
  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Create a new membership category record
   * Note: Dataverse uses "Prefer: return=representation" header to return complete entity
   */
  async create(
    categoryData: Omit<
      MembershipCategoryDataverse,
      | 'osot_table_membership_categoryid'
      | 'osot_category_id'
      | 'createdon'
      | 'modifiedon'
      | 'ownerid'
    >,
  ): Promise<MembershipCategoryDataverse> {
    try {
      const payload = this.buildCreatePayload(categoryData);

      // POST with Prefer: return=representation returns complete entity
      const response = await this.dataverseService.request(
        'POST',
        MEMBERSHIP_CATEGORY_ODATA.TABLE_NAME,
        payload,
      );

      // Map response - should include all fields with lookup values
      return this.mapDataverseResponse(response as Record<string, unknown>);
    } catch (error) {
      throw new Error(
        `Failed to create membership category: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find membership category by ID
   */
  async findById(id: string): Promise<MembershipCategoryDataverse | null> {
    try {
      // Include lookup value fields in select
      const select = [
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.ID,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.CATEGORY_ID,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.ACCOUNT_ID_VALUE,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.AFFILIATE_ID_VALUE,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_YEAR,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.ELIGIBILITY,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.ELIGIBILITY_AFFILIATE,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_CATEGORY,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.USERS_GROUP,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_FROM,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_TO,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_EXPECTED,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.RETIREMENT_START,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.ACCESS_MODIFIERS,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.PRIVILEGE,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.CREATED_ON,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.MODIFIED_ON,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.OWNER_ID,
      ].join(',');

      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_CATEGORY_ODATA.TABLE_NAME}(${id})?$select=${select}`,
      );

      return response
        ? this.mapDataverseResponse(response as Record<string, unknown>)
        : null;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw new Error(
        `Failed to find membership category by ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find membership category by Category ID (business ID)
   */
  async findByCategoryId(
    categoryId: string,
  ): Promise<MembershipCategoryDataverse | null> {
    try {
      const filter = `${MEMBERSHIP_CATEGORY_ODATA.FIELDS.CATEGORY_ID} eq '${categoryId}'`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_CATEGORY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`,
      );

      const data = response as { value: Record<string, unknown>[] };
      return data.value.length > 0
        ? this.mapDataverseResponse(data.value[0])
        : null;
    } catch (error) {
      throw new Error(
        `Failed to find membership category by category ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find membership categories by user (Account or Affiliate)
   * Accepts Business ID and converts to GUID for Dataverse lookup
   */
  async findByUser(
    userBusinessId: string,
    userType: 'account' | 'affiliate',
  ): Promise<MembershipCategoryDataverse[]> {
    try {
      // Convert Business ID to GUID
      let userGuid: string;

      if (userType === 'account') {
        const account = await this.dataverseService.request(
          'GET',
          `osot_table_accounts?$filter=osot_account_id eq '${userBusinessId}'&$select=osot_table_accountid&$top=1`,
        );
        const accountData = account as {
          value: Array<{ osot_table_accountid: string }>;
        };
        if (!accountData.value || accountData.value.length === 0) {
          throw new Error(`Account not found: ${userBusinessId}`);
        }
        userGuid = accountData.value[0].osot_table_accountid;
      } else {
        const affiliate = await this.dataverseService.request(
          'GET',
          `osot_table_account_affiliates?$filter=osot_affiliate_id eq '${userBusinessId}'&$select=osot_table_account_affiliateid&$top=1`,
        );
        const affiliateData = affiliate as {
          value: Array<{ osot_table_account_affiliateid: string }>;
        };
        if (!affiliateData.value || affiliateData.value.length === 0) {
          throw new Error(`Affiliate not found: ${userBusinessId}`);
        }
        userGuid = affiliateData.value[0].osot_table_account_affiliateid;
      }

      // Use lookup value fields for filtering
      const userField =
        userType === 'account'
          ? MEMBERSHIP_CATEGORY_ODATA.FIELDS.ACCOUNT_ID_VALUE
          : MEMBERSHIP_CATEGORY_ODATA.FIELDS.AFFILIATE_ID_VALUE;

      const filter = `${userField} eq ${userGuid}`;

      // Build $select - NOTE: Do NOT include primary key in $select, Dataverse returns it automatically
      const select = [
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.CATEGORY_ID,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.ACCOUNT_ID_VALUE,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.AFFILIATE_ID_VALUE,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_YEAR,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.ELIGIBILITY,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.ELIGIBILITY_AFFILIATE,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_CATEGORY,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.USERS_GROUP,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_FROM,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_TO,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_EXPECTED,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.RETIREMENT_START,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.ACCESS_MODIFIERS,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.PRIVILEGE,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.CREATED_ON,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.MODIFIED_ON,
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.OWNER_ID,
      ].join(',');

      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_CATEGORY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}&$select=${select}&$orderby=${MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_YEAR} desc`,
      );
      const data = response as { value: Record<string, unknown>[] };
      return data.value.map((item) => this.mapDataverseResponse(item));
    } catch (error) {
      throw new Error(
        `Failed to find membership categories by user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find membership categories by membership year
   */
  async findByMembershipYear(
    year: number,
  ): Promise<MembershipCategoryDataverse[]> {
    try {
      const filter = `${MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_YEAR} eq ${year}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_CATEGORY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`,
      );

      const data = response as { value: Record<string, unknown>[] };
      return data.value.map((item) => this.mapDataverseResponse(item));
    } catch (error) {
      throw new Error(
        `Failed to find membership categories by year: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find membership categories by category
   */
  async findByCategory(
    category: number,
  ): Promise<MembershipCategoryDataverse[]> {
    try {
      const filter = `${MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_CATEGORY} eq ${category}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_CATEGORY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`,
      );

      const data = response as { value: Record<string, unknown>[] };
      return data.value.map((item) => this.mapDataverseResponse(item));
    } catch (error) {
      throw new Error(
        `Failed to find membership categories by category: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find membership categories by Users Group
   */
  async findByUsersGroup(
    usersGroup: number,
  ): Promise<MembershipCategoryDataverse[]> {
    try {
      const filter = `${MEMBERSHIP_CATEGORY_ODATA.FIELDS.USERS_GROUP} eq ${usersGroup}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_CATEGORY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`,
      );

      const data = response as { value: Record<string, unknown>[] };
      return data.value.map((item) => this.mapDataverseResponse(item));
    } catch (error) {
      throw new Error(
        `Failed to find membership categories by users group: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find active membership categories for a user
   */
  async findActiveByUser(
    userId: string,
    userType: 'account' | 'affiliate',
    year?: number,
  ): Promise<MembershipCategoryDataverse[]> {
    try {
      const userField =
        userType === 'account'
          ? MEMBERSHIP_CATEGORY_ODATA.FIELDS.ACCOUNT_ID
          : MEMBERSHIP_CATEGORY_ODATA.FIELDS.AFFILIATE_ID;

      let filter = `${userField} eq '${userId}'`;

      if (year) {
        filter += ` and ${MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_YEAR} eq ${year}`;
      }

      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_CATEGORY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}&$orderby=${MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_YEAR} desc`,
      );

      const data = response as { value: Record<string, unknown>[] };
      return data.value.map((item) => this.mapDataverseResponse(item));
    } catch (error) {
      throw new Error(
        `Failed to find active membership categories: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find membership categories by retirement status
   */
  async findByRetirementStatus(
    isRetired: boolean,
  ): Promise<MembershipCategoryDataverse[]> {
    try {
      const retirementCategories =
        MEMBERSHIP_CATEGORY_RULES.RETIREMENT_CATEGORIES.join(',');
      const filter = isRetired
        ? `${MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_CATEGORY} in (${retirementCategories})`
        : `not (${MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_CATEGORY} in (${retirementCategories}))`;

      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_CATEGORY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`,
      );

      const data = response as { value: Record<string, unknown>[] };
      return data.value.map((item) => this.mapDataverseResponse(item));
    } catch (error) {
      throw new Error(
        `Failed to find membership categories by retirement status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find membership categories on parental leave
   */
  async findOnParentalLeave(
    referenceDate?: string,
  ): Promise<MembershipCategoryDataverse[]> {
    try {
      const checkDate = referenceDate || new Date().toISOString().split('T')[0];
      const filter = `${MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_FROM} ne null and ${MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_TO} ne null and ${MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_FROM} le '${checkDate}' and ${MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_TO} ge '${checkDate}'`;

      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_CATEGORY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`,
      );

      const data = response as { value: Record<string, unknown>[] };
      return data.value.map((item) => this.mapDataverseResponse(item));
    } catch (error) {
      throw new Error(
        `Failed to find membership categories on parental leave: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Update membership category by ID
   */
  async updateById(
    id: string,
    updateData: Partial<
      Omit<
        MembershipCategoryDataverse,
        | 'osot_table_membership_categoryid'
        | 'osot_category_id'
        | 'createdon'
        | 'modifiedon'
        | 'ownerid'
      >
    >,
  ): Promise<void> {
    try {
      const payload = this.buildUpdatePayload(updateData);
      await this.dataverseService.request(
        'PATCH',
        `${MEMBERSHIP_CATEGORY_ODATA.TABLE_NAME}(${id})`,
        payload,
      );
    } catch (error) {
      throw new Error(
        `Failed to update membership category: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete membership category by ID
   */
  async deleteById(id: string): Promise<void> {
    try {
      await this.dataverseService.request(
        'DELETE',
        `${MEMBERSHIP_CATEGORY_ODATA.TABLE_NAME}(${id})`,
      );
    } catch (error) {
      throw new Error(
        `Failed to delete membership category: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Check if membership category exists by user and year
   */
  async existsByUserAndYear(
    userId: string,
    userType: 'account' | 'affiliate',
    year: number,
  ): Promise<boolean> {
    try {
      const userField =
        userType === 'account'
          ? MEMBERSHIP_CATEGORY_ODATA.FIELDS.ACCOUNT_ID
          : MEMBERSHIP_CATEGORY_ODATA.FIELDS.AFFILIATE_ID;

      const filter = `${userField} eq '${userId}' and ${MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_YEAR} eq ${year}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_CATEGORY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}&$top=1&$select=${MEMBERSHIP_CATEGORY_ODATA.FIELDS.ID}`,
      );

      const data = response as { value: Record<string, unknown>[] };
      return data.value.length > 0;
    } catch (error) {
      throw new Error(
        `Failed to check membership category existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * List membership categories with filtering and pagination
   */
  async list(options: {
    skip?: number;
    top?: number;
    filter?: string;
    orderBy?: string;
    select?: string[];
  }): Promise<{
    value: MembershipCategoryDataverse[];
    totalCount?: number;
  }> {
    try {
      const { skip = 0, top = 50, filter, orderBy, select } = options;
      let query = `${MEMBERSHIP_CATEGORY_ODATA.TABLE_NAME}?$skip=${skip}&$top=${top}`;

      if (select && select.length > 0) {
        query += `&$select=${select.join(',')}`;
      }

      if (filter) {
        query += `&$filter=${encodeURIComponent(filter)}`;
      }

      if (orderBy) {
        query += `&$orderby=${encodeURIComponent(orderBy)}`;
      } else {
        query += `&$orderby=${MEMBERSHIP_CATEGORY_ODATA.FIELDS.MODIFIED_ON} desc`;
      }

      // Add count for pagination
      query += '&$count=true';

      const response = await this.dataverseService.request('GET', query);
      const data = response as {
        value: Record<string, unknown>[];
        '@odata.count'?: number;
      };

      return {
        value: data.value.map((item) => this.mapDataverseResponse(item)),
        totalCount: data['@odata.count'],
      };
    } catch (error) {
      throw new Error(
        `Failed to list membership categories: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find all parental leave expected values used by a user across all membership years
   * Used to enforce one-time use rule for parental leave insurance coverage
   * @param userBusinessId - The business ID (osot_business_id) of the user
   * @param userType - Whether the user is 'account' or 'affiliate'
   * @returns Array of parental leave expected values (1=FULL_YEAR, 2=SIX_MONTHS) used in history
   */
  async findParentalLeaveHistoryByUser(
    userBusinessId: string,
    userType: 'account' | 'affiliate',
  ): Promise<number[]> {
    try {
      // First resolve business ID to GUID
      let userGuid: string;
      if (userType === 'account') {
        const response = await this.dataverseService.request(
          'GET',
          `osot_table_accounts?$filter=osot_business_id eq '${userBusinessId}'&$select=osot_table_accountid`,
        );
        const accountData = response as { value: Record<string, unknown>[] };
        if (!accountData.value || accountData.value.length === 0) {
          throw new Error(`Account not found: ${userBusinessId}`);
        }
        userGuid = accountData.value[0].osot_table_accountid as string;
      } else {
        const response = await this.dataverseService.request(
          'GET',
          `osot_table_account_affiliates?$filter=osot_business_id eq '${userBusinessId}'&$select=osot_table_account_affiliateid`,
        );
        const affiliateData = response as { value: Record<string, unknown>[] };
        if (!affiliateData.value || affiliateData.value.length === 0) {
          throw new Error(`Affiliate not found: ${userBusinessId}`);
        }
        userGuid = affiliateData.value[0]
          .osot_table_account_affiliateid as string;
      }

      // Build filter for user and non-null parental_leave_expected
      const userField =
        userType === 'account'
          ? MEMBERSHIP_CATEGORY_ODATA.FIELDS.ACCOUNT_ID_VALUE
          : MEMBERSHIP_CATEGORY_ODATA.FIELDS.AFFILIATE_ID_VALUE;

      const filter = `${userField} eq ${userGuid} and ${MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_EXPECTED} ne null`;

      // Only select the field we need
      const select = MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_EXPECTED;

      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_CATEGORY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}&$select=${select}`,
      );

      const data = response as { value: Record<string, unknown>[] };

      // Extract unique parental leave expected values
      const usedOptions = new Set<number>();
      data.value.forEach((item) => {
        const value = item[
          MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_EXPECTED
        ] as number | undefined;
        if (value !== undefined && value !== null) {
          usedOptions.add(value);
        }
      });

      return Array.from(usedOptions).sort();
    } catch (error) {
      throw new Error(
        `Failed to find parental leave history: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Private helper: Build create payload
   */
  private buildCreatePayload(
    categoryData: Omit<
      MembershipCategoryDataverse,
      | 'osot_table_membership_categoryid'
      | 'osot_category_id'
      | 'createdon'
      | 'modifiedon'
      | 'ownerid'
    >,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    // Handle OData bindings for user references - follow established pattern
    const categoryDataWithBinding = categoryData as typeof categoryData & {
      'osot_Table_Account@odata.bind'?: string;
      'osot_Table_Account_Affiliate@odata.bind'?: string;
    };

    // Map Account OData bind if provided
    const accountBinding =
      categoryDataWithBinding['osot_Table_Account@odata.bind'];
    if (
      accountBinding &&
      typeof accountBinding === 'string' &&
      accountBinding.trim() !== ''
    ) {
      payload['osot_Table_Account@odata.bind'] = accountBinding;
    }

    // Map Affiliate OData bind if provided
    const affiliateBinding =
      categoryDataWithBinding['osot_Table_Account_Affiliate@odata.bind'];
    if (
      affiliateBinding &&
      typeof affiliateBinding === 'string' &&
      affiliateBinding.trim() !== ''
    ) {
      payload['osot_Table_Account_Affiliate@odata.bind'] = affiliateBinding;
    }

    // Map core fields
    if (categoryData.osot_membership_year !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_YEAR] =
        categoryData.osot_membership_year;
    }

    if (categoryData.osot_eligibility !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.ELIGIBILITY] =
        categoryData.osot_eligibility;
    }

    if (categoryData.osot_eligibility_affiliate !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.ELIGIBILITY_AFFILIATE] =
        categoryData.osot_eligibility_affiliate;
    }

    if (categoryData.osot_membership_category !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_CATEGORY] =
        categoryData.osot_membership_category;
    }

    if (categoryData.osot_users_group !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.USERS_GROUP] =
        categoryData.osot_users_group;
    }

    // Map date fields
    if (categoryData.osot_parental_leave_from) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_FROM] =
        categoryData.osot_parental_leave_from;
    }

    if (categoryData.osot_parental_leave_to) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_TO] =
        categoryData.osot_parental_leave_to;
    }

    if (categoryData.osot_parental_leave_expected !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_EXPECTED] =
        categoryData.osot_parental_leave_expected;
    }

    if (categoryData.osot_retirement_start) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.RETIREMENT_START] =
        categoryData.osot_retirement_start;
    }

    // Map permission fields with defaults
    payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.ACCESS_MODIFIERS] =
      categoryData.osot_access_modifiers ??
      MEMBERSHIP_CATEGORY_DEFAULTS.ACCESS_MODIFIER;

    payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.PRIVILEGE] =
      categoryData.osot_privilege ?? MEMBERSHIP_CATEGORY_DEFAULTS.PRIVILEGE;

    return payload;
  }

  /**
   * Private helper: Build update payload
   */
  private buildUpdatePayload(
    updateData: Partial<
      Omit<
        MembershipCategoryDataverse,
        | 'osot_table_membership_categoryid'
        | 'osot_category_id'
        | 'createdon'
        | 'modifiedon'
        | 'ownerid'
      >
    >,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    // Note: User references typically cannot be changed after creation
    // Uncomment if needed for specific business cases

    // Map core fields
    if (updateData.osot_membership_year !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_YEAR] =
        updateData.osot_membership_year;
    }

    if (updateData.osot_eligibility !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.ELIGIBILITY] =
        updateData.osot_eligibility;
    }

    if (updateData.osot_eligibility_affiliate !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.ELIGIBILITY_AFFILIATE] =
        updateData.osot_eligibility_affiliate;
    }

    if (updateData.osot_membership_category !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_CATEGORY] =
        updateData.osot_membership_category;
    }

    // Map date fields
    if (updateData.osot_parental_leave_from !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_FROM] =
        updateData.osot_parental_leave_from;
    }

    if (updateData.osot_parental_leave_to !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_TO] =
        updateData.osot_parental_leave_to;
    }

    if (updateData.osot_parental_leave_expected !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_EXPECTED] =
        updateData.osot_parental_leave_expected;
    }

    if (updateData.osot_retirement_start !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.RETIREMENT_START] =
        updateData.osot_retirement_start;
    }

    // Map permission fields
    if (updateData.osot_access_modifiers !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.ACCESS_MODIFIERS] =
        updateData.osot_access_modifiers;
    }

    if (updateData.osot_privilege !== undefined) {
      payload[MEMBERSHIP_CATEGORY_ODATA.FIELDS.PRIVILEGE] =
        updateData.osot_privilege;
    }

    return payload;
  }

  /**
   * Private helper: Map Dataverse response to internal interface
   */
  private mapDataverseResponse(
    data: Record<string, unknown>,
  ): MembershipCategoryDataverse {
    return {
      osot_table_membership_categoryid: data[
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.ID
      ] as string,
      osot_category_id: data[MEMBERSHIP_CATEGORY_ODATA.FIELDS.CATEGORY_ID] as
        | string
        | undefined,
      // Map lookup VALUE fields to the standard field names
      osot_table_account: (data[
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.ACCOUNT_ID_VALUE
      ] || data[MEMBERSHIP_CATEGORY_ODATA.FIELDS.ACCOUNT_ID]) as
        | string
        | undefined,
      osot_table_account_affiliate: (data[
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.AFFILIATE_ID_VALUE
      ] || data[MEMBERSHIP_CATEGORY_ODATA.FIELDS.AFFILIATE_ID]) as
        | string
        | undefined,
      osot_membership_year: data[
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_YEAR
      ] as string,
      osot_eligibility: data[MEMBERSHIP_CATEGORY_ODATA.FIELDS.ELIGIBILITY] as
        | MembershipEligilibility
        | undefined,
      osot_eligibility_affiliate: data[
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.ELIGIBILITY_AFFILIATE
      ] as AffiliateEligibility | undefined,
      osot_membership_category: data[
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.MEMBERSHIP_CATEGORY
      ] as Category | undefined,
      osot_users_group: data[MEMBERSHIP_CATEGORY_ODATA.FIELDS.USERS_GROUP] as
        | UserGroup
        | undefined,
      osot_parental_leave_from: data[
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_FROM
      ] as string | undefined,
      osot_parental_leave_to: data[
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_TO
      ] as string | undefined,
      osot_parental_leave_expected: data[
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.PARENTAL_LEAVE_EXPECTED
      ] as number | undefined,
      osot_retirement_start: data[
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.RETIREMENT_START
      ] as string | undefined,
      osot_access_modifiers: data[
        MEMBERSHIP_CATEGORY_ODATA.FIELDS.ACCESS_MODIFIERS
      ] as AccessModifier | undefined,
      osot_privilege: data[MEMBERSHIP_CATEGORY_ODATA.FIELDS.PRIVILEGE] as
        | Privilege
        | undefined,
      createdon: data[MEMBERSHIP_CATEGORY_ODATA.FIELDS.CREATED_ON] as string,
      modifiedon: data[MEMBERSHIP_CATEGORY_ODATA.FIELDS.MODIFIED_ON] as string,
      ownerid: data[MEMBERSHIP_CATEGORY_ODATA.FIELDS.OWNER_ID] as string,
    };
  }

  /**
   * Private helper: Check if error is a 404 Not Found
   */
  private isNotFoundError(error: unknown): boolean {
    return (
      error instanceof Error &&
      (error.message.includes('404') || error.message.includes('Not Found'))
    );
  }
}
