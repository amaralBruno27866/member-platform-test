/**
 * Product Constants and Enums
 * Shared across admin and user-facing product interfaces
 */

// ✅ CORRECTED - Now matches backend ProductCategory enum EXACTLY
// Backend enum source: backend/src/classes/others/product/enums/product-category.enum.ts
// This is the authoritative source - all 11 categories with correct values
export const PRODUCT_CATEGORIES = [
  { value: 0, label: 'Membership' },
  { value: 1, label: 'Insurance' },
  { value: 2, label: 'Promotional' },
  { value: 3, label: 'Advertising' },
  { value: 4, label: 'Event' },
  { value: 5, label: 'Conference' },
  { value: 6, label: 'Archived Webinar' },
  { value: 7, label: 'Careers' },
  { value: 8, label: "Member's Benefits" },
  { value: 9, label: 'Donations' },
  { value: 10, label: 'General' },
];

// ✅ CORRECTED - Now matches backend ProductStatus enum exactly
// Backend enum source: backend/src/classes/others/product/enums/product-status.enum.ts
// All 5 status values with correct mappings
export const PRODUCT_STATUSES = [
  { value: 0, label: 'Unavailable' },
  { value: 1, label: 'Available' },
  { value: 2, label: 'Discontinued' },
  { value: 3, label: 'Draft' },
  { value: 4, label: 'Out of Stock' },
];

// ✅ Product GL Codes - Financial accounting classification
// Backend enum source: backend/src/classes/others/product/enums/product-gl-code.enum.ts
// Used for integrating product transactions with accounting system
export const PRODUCT_GL_CODES = [
  { value: 0, label: '1030 - Bank Account' },
  { value: 1, label: '2036 - HST Collected on Sales' },
  { value: 2, label: '2050 - Professional Insurance' },
  { value: 3, label: '2081 - Pre-paid Membership Fees' },
  { value: 4, label: '2082 - Pre-paid In-person Event' },
  { value: 5, label: '2085 - Pre-paid Professional Insurance' },
  { value: 6, label: '2086 - Pre-paid Conference' },
  { value: 7, label: '2091 - Pre-paid Workshops and Webinars' },
  { value: 8, label: '2800 - OSOTRF Donations' },
  { value: 9, label: '4100 - Membership Fee' },
  { value: 10, label: '4200 - Advertising Income' },
  { value: 11, label: '4440 - In-person Event' },
  { value: 12, label: '4450 - Conference' },
  { value: 13, label: '4550 - Group Accident Insurance' },
  { value: 14, label: '4475 - Workshops and Webinars' },
  { value: 15, label: '4480 - Archived Webinars' },
  { value: 16, label: '4900 - PR General' },
  { value: 17, label: '5946 - MOCA' },
];

export const PRIVILEGE_LEVELS = [
  { value: 1, label: 'Owner' },
  { value: 2, label: 'Admin' },
  { value: 3, label: 'Main' },
];

export const ACCESS_MODIFIERS = [
  { value: 1, label: 'Public' },
  { value: 2, label: 'Protected' },
  { value: 3, label: 'Private' },
];

export const PRICE_LABELS: Record<string, string> = {
  general: 'General',
  otStu: 'OT Student',
  otNg: 'OT New Grad',
  otPr: 'OT Professional',
  otNp: 'OT Non-Practicing',
  otRet: 'OT Retired',
  otLife: 'OT Lifetime',
  otaStu: 'OTA Student',
  otaNg: 'OTA New Grad',
  otaNp: 'OTA Non-Practicing',
  otaRet: 'OTA Retired',
  otaPr: 'OTA Professional',
  otaLife: 'OTA Lifetime',
  assoc: 'Associate',
  affPrim: 'Affiliate Primary',
  affPrem: 'Affiliate Premium',
};
