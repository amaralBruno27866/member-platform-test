export enum AffiliateEligibility {
  PRIMARY = 1,
  PREMIUM = 2,
}

export function getAffiliateEligibilityDisplayName(
  eligibility: AffiliateEligibility,
): string {
  switch (eligibility) {
    case AffiliateEligibility.PRIMARY:
      return 'Primary';
    case AffiliateEligibility.PREMIUM:
      return 'Premium';
    default:
      return 'Unknown';
  }
}
