/**
 * Enum: ProductGLCode
 * Objective: Define the available General Ledger (GL) account codes for product accounting classification.
 * Functionality: Provides standardized GL code choices synchronized with Dataverse global choices.
 * Expected Result: Consistent financial tracking and accounting integration for product transactions.
 *
 * Note: This enum corresponds to the Choices_GL_Accounts global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Product_GL_Code in Table_Product.
 * This is a single choice field - users can select only one GL code per product.
 *
 * GL Code Categories:
 * - 1XXX: Assets (Bank Accounts)
 * - 2XXX: Liabilities (HST, Pre-paid items, Donations)
 * - 4XXX: Revenue (Membership, Events, Services)
 * - 5XXX: Expenses (MOCA)
 */
export enum ProductGLCode {
  BANK_ACCOUNT_1030 = 0,
  HST_COLLECTED_ON_SALES_2036 = 1,
  PROFESSIONAL_INSURANCE_2050 = 2,
  PRE_PAID_MEMBERSHIP_FEES_2081 = 3,
  PRE_PAID_IN_PERSON_EVENT_2082 = 4,
  PRE_PAID_PROFESSIONAL_INSURANCE_2085 = 5,
  PRE_PAID_CONFERENCE_2086 = 6,
  PRE_PAID_WORKSHOPS_AND_WEBINARS_2091 = 7,
  OSOTRF_DONATIONS_2800 = 8,
  MEMBERSHIP_FEE_4100 = 9,
  ADVERTISING_INCOME_4200 = 10,
  IN_PERSON_EVENT_4440 = 11,
  CONFERENCE_4450 = 12,
  GROUP_ACCIDENT_INSURANCE_4550 = 13,
  WORKSHOPS_AND_WEBINARS_4475 = 14,
  ARCHIVED_WEBINARS_4480 = 15,
  PR_GENERAL_4900 = 16,
  MOCA_5946 = 17,
}

/**
 * Helper function to get product GL code display name with code number and description
 */
export function getProductGLCodeDisplayName(glCode: ProductGLCode): string {
  switch (glCode) {
    case ProductGLCode.BANK_ACCOUNT_1030:
      return '1030 - Bank Account';
    case ProductGLCode.HST_COLLECTED_ON_SALES_2036:
      return '2036 - HST Collected on Sales';
    case ProductGLCode.PROFESSIONAL_INSURANCE_2050:
      return '2050 - Professional Insurance';
    case ProductGLCode.PRE_PAID_MEMBERSHIP_FEES_2081:
      return '2081 - Pre-paid Membership Fees';
    case ProductGLCode.PRE_PAID_IN_PERSON_EVENT_2082:
      return '2082 - Pre-paid In-person Event';
    case ProductGLCode.PRE_PAID_PROFESSIONAL_INSURANCE_2085:
      return '2085 - Pre-paid Professional Insurance';
    case ProductGLCode.PRE_PAID_CONFERENCE_2086:
      return '2086 - Pre-paid Conference';
    case ProductGLCode.PRE_PAID_WORKSHOPS_AND_WEBINARS_2091:
      return '2091 - Pre-paid Workshops and Webinars';
    case ProductGLCode.OSOTRF_DONATIONS_2800:
      return '2800 - OSOTRF Donations';
    case ProductGLCode.MEMBERSHIP_FEE_4100:
      return '4100 - Membership Fee';
    case ProductGLCode.ADVERTISING_INCOME_4200:
      return '4200 - Advertising Income';
    case ProductGLCode.IN_PERSON_EVENT_4440:
      return '4440 - In-person Event';
    case ProductGLCode.CONFERENCE_4450:
      return '4450 - Conference';
    case ProductGLCode.GROUP_ACCIDENT_INSURANCE_4550:
      return '4550 - Group Accident Insurance';
    case ProductGLCode.WORKSHOPS_AND_WEBINARS_4475:
      return '4475 - Workshops and Webinars';
    case ProductGLCode.ARCHIVED_WEBINARS_4480:
      return '4480 - Archived Webinars';
    case ProductGLCode.PR_GENERAL_4900:
      return '4900 - PR General';
    case ProductGLCode.MOCA_5946:
      return '5946 - MOCA';
    default:
      return 'Unknown GL Code';
  }
}
