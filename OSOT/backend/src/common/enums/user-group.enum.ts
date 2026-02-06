export enum UserGroup {
  OT_STUDENT = 1,
  OTA_STUDENT = 2,
  OT_STUDENT_NEW_GRAD = 3,
  OTA_STUDENT_NEW_GRAD = 4,
  OT = 5,
  OTA = 6,
  VENDOR_ADVERTISER_RECRUITER = 7,
  OTHER = 8,
  AFFILIATE = 9,
}

export function getUserGroupDisplayName(group: UserGroup): string {
  switch (group) {
    case UserGroup.OT_STUDENT:
      return 'Occupational Therapist Student';
    case UserGroup.OTA_STUDENT:
      return 'Occupational Therapist Assistant Student';
    case UserGroup.OT_STUDENT_NEW_GRAD:
      return 'Occupational Therapist New Graduate';
    case UserGroup.OTA_STUDENT_NEW_GRAD:
      return 'Occupational Therapist Assistant New Graduate';
    case UserGroup.OT:
      return 'Occupational Therapist (includes retired/resigned)';
    case UserGroup.OTA:
      return 'Occupational Therapist Assistant (includes retired)';
    case UserGroup.VENDOR_ADVERTISER_RECRUITER:
      return 'Vendor / Advertiser / Recruiter';
    case UserGroup.OTHER:
      return 'Other';
    case UserGroup.AFFILIATE:
      return 'Affiliate';
    default:
      return 'Unknown';
  }
}
