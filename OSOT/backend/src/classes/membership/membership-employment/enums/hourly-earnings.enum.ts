/**
 * Enum: HourlyEarnings
 * Objective: Define the available hourly earnings ranges for membership employment records.
 * Functionality: Provides standardized earnings range choices synchronized with Dataverse global choices.
 * Expected Result: Consistent hourly earnings tracking for member compensation data.
 *
 * Note: This enum corresponds to the Choices_Hourly_Earnings global choice in Dataverse.
 * Values are synchronized with the Choice fields osot_Earnings_Employment, osot_Earnings_Self_Direct,
 * and osot_Earnings_Self_Indirect in Table_Membership_Employment.
 */
export enum HourlyEarnings {
  BETWEEN_15_TO_20 = 1,
  BETWEEN_21_TO_30 = 2,
  BETWEEN_31_TO_40 = 3,
  BETWEEN_41_TO_50 = 4,
  BETWEEN_51_TO_60 = 5,
  BETWEEN_61_TO_70 = 6,
  BETWEEN_71_TO_80 = 7,
  BETWEEN_81_TO_90 = 8,
  BETWEEN_91_TO_100 = 9,
  BETWEEN_101_TO_110 = 10,
  BETWEEN_111_TO_120 = 11,
  BETWEEN_121_TO_130 = 12,
  BETWEEN_131_TO_140 = 13,
  BETWEEN_141_TO_150 = 14,
  BETWEEN_151_TO_160 = 15,
  BETWEEN_161_TO_170 = 16,
  BETWEEN_171_TO_180 = 17,
  BETWEEN_181_TO_190 = 18,
  BETWEEN_191_TO_200 = 19,
  OVER_201 = 20,
}

/**
 * Helper function to get hourly earnings range label
 */
export function getHourlyEarningsLabel(earnings: HourlyEarnings): string {
  switch (earnings) {
    case HourlyEarnings.BETWEEN_15_TO_20:
      return '$15 - $20/hr';
    case HourlyEarnings.BETWEEN_21_TO_30:
      return '$21 - $30/hr';
    case HourlyEarnings.BETWEEN_31_TO_40:
      return '$31 - $40/hr';
    case HourlyEarnings.BETWEEN_41_TO_50:
      return '$41 - $50/hr';
    case HourlyEarnings.BETWEEN_51_TO_60:
      return '$51 - $60/hr';
    case HourlyEarnings.BETWEEN_61_TO_70:
      return '$61 - $70/hr';
    case HourlyEarnings.BETWEEN_71_TO_80:
      return '$71 - $80/hr';
    case HourlyEarnings.BETWEEN_81_TO_90:
      return '$81 - $90/hr';
    case HourlyEarnings.BETWEEN_91_TO_100:
      return '$91 - $100/hr';
    case HourlyEarnings.BETWEEN_101_TO_110:
      return '$101 - $110/hr';
    case HourlyEarnings.BETWEEN_111_TO_120:
      return '$111 - $120/hr';
    case HourlyEarnings.BETWEEN_121_TO_130:
      return '$121 - $130/hr';
    case HourlyEarnings.BETWEEN_131_TO_140:
      return '$131 - $140/hr';
    case HourlyEarnings.BETWEEN_141_TO_150:
      return '$141 - $150/hr';
    case HourlyEarnings.BETWEEN_151_TO_160:
      return '$151 - $160/hr';
    case HourlyEarnings.BETWEEN_161_TO_170:
      return '$161 - $170/hr';
    case HourlyEarnings.BETWEEN_171_TO_180:
      return '$171 - $180/hr';
    case HourlyEarnings.BETWEEN_181_TO_190:
      return '$181 - $190/hr';
    case HourlyEarnings.BETWEEN_191_TO_200:
      return '$191 - $200/hr';
    case HourlyEarnings.OVER_201:
      return 'Over $201/hr';
    default:
      return 'Unknown';
  }
}
