export enum Category {
  ALL = 0,
  OT_PR = 1,
  OT_NP = 2,
  OT_RET = 3,
  OT_NG = 4,
  OT_STU = 5,
  OT_LIFE = 6,
  OTA_PR = 7,
  OTA_NP = 8,
  OTA_RET = 9,
  OTA_NG = 10,
  OTA_STU = 11,
  OTA_LIFE = 12,
  ASSOC = 13,
  AFF_PRIM = 14,
  AFF_PREM = 15,
}

export function getCategoryDisplayName(category: Category): string {
  switch (category) {
    case Category.ALL:
      return 'All Categories';
    case Category.OT_PR:
      return 'OT - Practicing';
    case Category.OT_NP:
      return 'OT - Non-Practicing';
    case Category.OT_RET:
      return 'OT - Retired';
    case Category.OT_NG:
      return 'OT - New Graduate';
    case Category.OT_STU:
      return 'OT - Student';
    case Category.OT_LIFE:
      return 'OT - Life Member';
    case Category.OTA_PR:
      return 'OTA - Practicing';
    case Category.OTA_NP:
      return 'OTA - Non-Practicing';
    case Category.OTA_RET:
      return 'OTA - Retired';
    case Category.OTA_NG:
      return 'OTA - New Graduate';
    case Category.OTA_STU:
      return 'OTA - Student';
    case Category.OTA_LIFE:
      return 'OTA - Life Member';
    case Category.ASSOC:
      return 'Associate';
    case Category.AFF_PRIM:
      return 'Affiliate - Primary';
    case Category.AFF_PREM:
      return 'Affiliate - Premium';
    default:
      return 'Unknown';
  }
}
