/**
 * Formatting interface for Membership Category display and transformation.
 * Defines how data should be formatted for different presentation contexts.
 */
export interface MembershipCategoryFormatting {
  /**
   * Format membership category for display in lists
   */
  formatForList(
    categoryData: Record<string, unknown>,
  ): Promise<FormattedCategoryListItem>;

  /**
   * Format membership category for detailed view
   */
  formatForDetails(
    categoryData: Record<string, unknown>,
  ): Promise<FormattedCategoryDetails>;

  /**
   * Format membership category for API responses
   */
  formatForApi(
    categoryData: Record<string, unknown>,
  ): Promise<FormattedCategoryResponse>;

  /**
   * Format membership category for reports and exports
   */
  formatForReport(
    categoryData: Record<string, unknown>,
  ): Promise<FormattedCategoryReport>;

  /**
   * Format choice field values to display names
   */
  formatChoiceFields(
    categoryData: Record<string, unknown>,
  ): Promise<Record<string, string>>;

  /**
   * Format date fields for display
   */
  formatDateFields(
    categoryData: Record<string, unknown>,
  ): Promise<Record<string, string>>;

  /**
   * Format user reference fields for display
   */
  formatUserReferences(
    categoryData: Record<string, unknown>,
  ): Promise<FormattedUserReference>;
}

/**
 * Formatted category for list display
 */
export interface FormattedCategoryListItem {
  id: string;
  categoryId: string;
  displayName: string;
  userType: 'Account' | 'Affiliate';
  userName: string;
  membershipYear: string;
  category: string;
  status: 'Active' | 'Inactive' | 'Pending';
  lastModified: string;
}

/**
 * Formatted category for detailed view
 */
export interface FormattedCategoryDetails {
  // Basic information
  id: string;
  categoryId: string;
  displayName: string;

  // User information
  userType: 'Account' | 'Affiliate';
  userId: string;
  userName: string;
  userEmail?: string;

  // Membership information
  membershipYear: string;
  category: string;
  eligibility: string;
  declaration: 'Yes' | 'No';

  // Special dates
  parentalLeave?: {
    from: string;
    to: string;
    expected?: string;
    isActive: boolean;
  };
  retirement?: {
    startDate: string;
    isRetired: boolean;
  };

  // Access control
  privilege: string;
  accessModifier: string;

  // System information
  createdOn: string;
  modifiedOn: string;
  owner: string;
}

/**
 * Formatted category for API responses
 */
export interface FormattedCategoryResponse {
  id: string;
  categoryId: string;
  userType: 'account' | 'affiliate';
  userId: string;
  membershipYear: number;
  membershipYearDisplay: string;
  category?: number;
  categoryDisplay?: string;
  eligibility?: number;
  eligibilityDisplay?: string;
  declaration: boolean;
  parentalLeave?: {
    from: string;
    to: string;
    expected?: number;
    expectedDisplay?: string;
  };
  retirement?: {
    startDate: string;
  };
  privilege: number;
  privilegeDisplay: string;
  accessModifier: number;
  accessModifierDisplay: string;
  timestamps: {
    created: string;
    modified: string;
  };
}

/**
 * Formatted category for reports
 */
export interface FormattedCategoryReport {
  categoryId: string;
  userType: string;
  userName: string;
  userEmail: string;
  membershipYear: string;
  category: string;
  eligibility: string;
  declaration: string;
  parentalLeaveFrom: string;
  parentalLeaveTo: string;
  parentalLeaveExpected: string;
  parentalLeaveActive: string;
  retirementStart: string;
  retirementActive: string;
  privilege: string;
  accessModifier: string;
  status: string;
  createdDate: string;
  modifiedDate: string;
  ownerName: string;
}

/**
 * Formatted user reference information
 */
export interface FormattedUserReference {
  type: 'account' | 'affiliate';
  id: string;
  name: string;
  email?: string;
  displayName: string;
}

/**
 * Formatting configuration
 */
export interface FormattingConfig {
  // Date formatting
  dateFormat: string;
  timeFormat: string;
  dateTimeFormat: string;

  // Display preferences
  showSystemFields: boolean;
  showInternalIds: boolean;
  includeComputedFields: boolean;

  // Localization
  locale: string;
  timezone: string;

  // Field display options
  fieldDisplayOptions: {
    showFieldLabels: boolean;
    showEmptyFields: boolean;
    groupRelatedFields: boolean;
  };
}

/**
 * Default formatting configuration
 */
export const DEFAULT_FORMATTING_CONFIG: FormattingConfig = {
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm:ss',
  dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
  showSystemFields: false,
  showInternalIds: false,
  includeComputedFields: true,
  locale: 'en-US',
  timezone: 'UTC',
  fieldDisplayOptions: {
    showFieldLabels: true,
    showEmptyFields: false,
    groupRelatedFields: true,
  },
};
