/**
 * Enum for Affiliate Area choices
 * Based on Table_Account_Affiliate specification
 * Sync with global choice: Choices_Affiliate_Areas
 */
export enum AffiliateArea {
  OTHER = 0,
  HEALTHCARE_AND_LIFE_SCIENCES = 1,
  GOVERNMENT_AND_PUBLIC_SECTOR = 2,
  CONSTRUCTION_REAL_ESTATE_AND_PROPERTY_MANAGEMENT = 3,
  CONSUMER_GOODS_AND_RETAIL = 4,
  FINANCIAL_SERVICES_AND_INSURANCE = 5,
  INFORMATION_TECHNOLOGY_AND_SOFTWARE = 6,
  LEGAL_SERVICES = 7,
  NONPROFIT_AND_SOCIAL_SERVICES = 8,
  PHARMACEUTICALS_AND_BIOTECHNOLOGY = 9,
  PROFESSIONAL_SERVICES = 10,
  SCIENCE_AND_RESEARCH = 11,
}

/**
 * Helper function to get affiliate area display name
 */
export function getAffiliateAreaDisplayName(area: AffiliateArea): string {
  switch (area) {
    case AffiliateArea.OTHER:
      return 'Other';
    case AffiliateArea.HEALTHCARE_AND_LIFE_SCIENCES:
      return 'Healthcare and Life Sciences';
    case AffiliateArea.GOVERNMENT_AND_PUBLIC_SECTOR:
      return 'Government and Public Sector';
    case AffiliateArea.CONSTRUCTION_REAL_ESTATE_AND_PROPERTY_MANAGEMENT:
      return 'Construction, Real Estate and Property Management';
    case AffiliateArea.CONSUMER_GOODS_AND_RETAIL:
      return 'Consumer Goods and Retail';
    case AffiliateArea.FINANCIAL_SERVICES_AND_INSURANCE:
      return 'Financial Services and Insurance';
    case AffiliateArea.INFORMATION_TECHNOLOGY_AND_SOFTWARE:
      return 'Information Technology and Software';
    case AffiliateArea.LEGAL_SERVICES:
      return 'Legal Services';
    case AffiliateArea.NONPROFIT_AND_SOCIAL_SERVICES:
      return 'Nonprofit and Social Services';
    case AffiliateArea.PHARMACEUTICALS_AND_BIOTECHNOLOGY:
      return 'Pharmaceuticals and Biotechnology';
    case AffiliateArea.PROFESSIONAL_SERVICES:
      return 'Professional Services (e.g., Consulting, Accounting)';
    case AffiliateArea.SCIENCE_AND_RESEARCH:
      return 'Science and Research';
    default:
      return 'Unknown';
  }
}
