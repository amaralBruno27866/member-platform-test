import { MembershipCategoryDataverse } from './membership-category-dataverse.interface';
import { MembershipCategoryInternal } from './membership-category-internal.interface';

/**
 * Mapping interface for Membership Category data transformation.
 * Defines transformations between different data representations.
 */
export interface MembershipCategoryMapping {
  /**
   * Transform Dataverse raw data to Internal representation
   */
  dataverseToInternal(
    dataverseData: MembershipCategoryDataverse,
  ): Promise<MembershipCategoryInternal>;

  /**
   * Transform Internal representation to Dataverse format
   */
  internalToDataverse(
    internalData: MembershipCategoryInternal,
  ): Promise<MembershipCategoryDataverse>;

  /**
   * Transform Internal representation to Public API response
   */
  internalToResponse(
    internalData: MembershipCategoryInternal,
  ): Promise<Record<string, unknown>>;

  /**
   * Transform Public API input to Internal representation
   */
  requestToInternal(
    requestData: Record<string, unknown>,
  ): Promise<MembershipCategoryInternal>;

  /**
   * Batch transform multiple records
   */
  batchTransform<TSource, TTarget>(
    sourceData: TSource[],
    transformFn: (item: TSource) => Promise<TTarget>,
  ): Promise<TTarget[]>;
}

/**
 * Field mapping configuration
 */
export interface FieldMappingConfig {
  // Dataverse to Internal field mappings
  dataverseToInternal: Record<string, FieldMapping>;

  // Internal to Response field mappings
  internalToResponse: Record<string, FieldMapping>;

  // Choice field mappings (enum conversions)
  choiceFieldMappings: Record<string, ChoiceFieldMapping>;

  // Date field configurations
  dateFieldConfigs: Record<string, DateFieldConfig>;

  // Computed field configurations
  computedFieldConfigs: Record<string, ComputedFieldConfig>;
}

/**
 * Individual field mapping definition
 */
export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: FieldTransformType;
  defaultValue?: unknown;
  required?: boolean;
  skipIfEmpty?: boolean;
}

/**
 * Choice field mapping for enum conversions
 */
export interface ChoiceFieldMapping {
  enumType: string;
  valueMapping: Record<number, string>;
  reverseMapping: Record<string, number>;
  defaultValue?: number;
}

/**
 * Date field configuration
 */
export interface DateFieldConfig {
  sourceFormat: 'iso-string' | 'date-object' | 'timestamp';
  targetFormat: 'iso-string' | 'date-object' | 'timestamp';
  timezone?: string;
  nullable?: boolean;
}

/**
 * Computed field configuration
 */
export interface ComputedFieldConfig {
  dependsOn: string[];
  computeFunction: string;
  cacheResult?: boolean;
  recalculateOnChange?: boolean;
}

/**
 * Field transformation types
 */
export type FieldTransformType =
  | 'string-to-number'
  | 'number-to-string'
  | 'date-to-string'
  | 'string-to-date'
  | 'boolean-to-number'
  | 'number-to-boolean'
  | 'enum-to-display'
  | 'display-to-enum'
  | 'guid-format'
  | 'autonumber-format'
  | 'custom';

/**
 * Default field mapping configuration
 */
export const DEFAULT_FIELD_MAPPING_CONFIG: FieldMappingConfig = {
  dataverseToInternal: {
    // System fields
    id: {
      sourceField: 'osot_table_membership_categoryid',
      targetField: 'osot_table_membership_categoryid',
    },
    categoryId: {
      sourceField: 'osot_category_id',
      targetField: 'osot_category_id',
    },
    createdOn: {
      sourceField: 'createdon',
      targetField: 'createdon',
      transform: 'string-to-date',
    },
    modifiedOn: {
      sourceField: 'modifiedon',
      targetField: 'modifiedon',
      transform: 'string-to-date',
    },

    // User reference fields
    accountId: {
      sourceField: 'osot_table_account',
      targetField: 'osot_table_account',
    },
    affiliateId: {
      sourceField: 'osot_table_account_affiliate',
      targetField: 'osot_table_account_affiliate',
    },

    // Core fields
    membershipYear: {
      sourceField: 'osot_membership_year',
      targetField: 'osot_membership_year',
      required: true,
    },
    membershipCategory: {
      sourceField: 'osot_membership_category',
      targetField: 'osot_membership_category',
    },
    declaration: {
      sourceField: 'osot_membership_declaration',
      targetField: 'osot_membership_declaration',
      required: true,
    },

    // Date fields
    parentalLeaveFrom: {
      sourceField: 'osot_parental_leave_from',
      targetField: 'osot_parental_leave_from',
      transform: 'string-to-date',
    },
    parentalLeaveTo: {
      sourceField: 'osot_parental_leave_to',
      targetField: 'osot_parental_leave_to',
      transform: 'string-to-date',
    },
    parentalLeaveExpected: {
      sourceField: 'osot_parental_leave_expected',
      targetField: 'osot_parental_leave_expected',
    },
    retirementStart: {
      sourceField: 'osot_retirement_start',
      targetField: 'osot_retirement_start',
      transform: 'string-to-date',
    },
  },

  internalToResponse: {
    id: {
      sourceField: 'osot_table_membership_categoryid',
      targetField: 'id',
    },
    categoryId: {
      sourceField: 'osot_category_id',
      targetField: 'categoryId',
    },
    userType: {
      sourceField: 'userType',
      targetField: 'userType',
    },
    membershipYear: {
      sourceField: 'osot_membership_year',
      targetField: 'membershipYear',
    },
    membershipCategory: {
      sourceField: 'osot_membership_category',
      targetField: 'category',
    },
    declaration: {
      sourceField: 'osot_membership_declaration',
      targetField: 'declaration',
    },
    parentalLeaveExpected: {
      sourceField: 'osot_parental_leave_expected',
      targetField: 'parentalLeaveExpected',
    },
  },

  choiceFieldMappings: {
    osot_membership_year: {
      enumType: 'MembershipYear',
      valueMapping: {}, // Populated dynamically
      reverseMapping: {},
    },
    osot_membership_category: {
      enumType: 'Category',
      valueMapping: {},
      reverseMapping: {},
    },
    osot_eligibility: {
      enumType: 'MembershipEligilibility',
      valueMapping: {},
      reverseMapping: {},
    },
    osot_eligibility_affiliate: {
      enumType: 'AffiliateEligibility',
      valueMapping: {},
      reverseMapping: {},
    },
    osot_parental_leave_expected: {
      enumType: 'ParentalLeaveExpected',
      valueMapping: {},
      reverseMapping: {},
    },
    osot_privilege: {
      enumType: 'Privilege',
      valueMapping: {},
      reverseMapping: {},
    },
    osot_access_modifiers: {
      enumType: 'AccessModifier',
      valueMapping: {},
      reverseMapping: {},
    },
  },

  dateFieldConfigs: {
    createdon: {
      sourceFormat: 'iso-string',
      targetFormat: 'date-object',
      nullable: true,
    },
    modifiedon: {
      sourceFormat: 'iso-string',
      targetFormat: 'date-object',
      nullable: true,
    },
    osot_parental_leave_from: {
      sourceFormat: 'iso-string',
      targetFormat: 'date-object',
      nullable: true,
    },
    osot_parental_leave_to: {
      sourceFormat: 'iso-string',
      targetFormat: 'date-object',
      nullable: true,
    },
    osot_retirement_start: {
      sourceFormat: 'iso-string',
      targetFormat: 'date-object',
      nullable: true,
    },
  },

  computedFieldConfigs: {
    isActive: {
      dependsOn: ['osot_membership_year', 'createdon'],
      computeFunction: 'calculateIsActive',
      cacheResult: true,
    },
    userType: {
      dependsOn: ['osot_table_account', 'osot_table_account_affiliate'],
      computeFunction: 'determineUserType',
      cacheResult: true,
    },
    hasParentalLeave: {
      dependsOn: ['osot_parental_leave_from', 'osot_parental_leave_to'],
      computeFunction: 'calculateHasParentalLeave',
      recalculateOnChange: true,
    },
    isRetired: {
      dependsOn: ['osot_membership_category', 'osot_retirement_start'],
      computeFunction: 'calculateIsRetired',
      recalculateOnChange: true,
    },
  },
};
