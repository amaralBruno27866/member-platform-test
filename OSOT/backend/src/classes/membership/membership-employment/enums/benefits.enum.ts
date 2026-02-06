/**
 * Enum: Benefits
 * Objective: Define the available employment benefits options for membership employment records.
 * Functionality: Provides standardized employment benefits choices synchronized with Dataverse global choices.
 * Expected Result: Consistent employment benefits tracking for member employment data.
 *
 * Note: This enum corresponds to the Choices_Benefits global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Employment_Benefits in Table_Membership_Employment.
 * This is a multiple choice field - users can select multiple benefits.
 */
export enum Benefits {
  OTHER = 0,
  NOT_APLICABLE = 1,
  DISABILITY_INSURANCE = 2,
  EDUCATION_FUNDING = 3,
  EDUCATION_LEAVE = 4,
  EXTENDED_HEALTH_DENTAL_CARE = 5,
  LIFE_INSURANCE = 6,
  MENTAL_HEALTH_SUPPORT_WELLNESS_PROGRAM = 7,
  OTHER_PAID_TIME_OFF = 8,
  PAID_VACATION = 9,
  PENSION = 10,
}

/**
 * Helper function to get benefits display name
 */
export function getBenefitsDisplayName(benefits: Benefits): string {
  switch (benefits) {
    case Benefits.OTHER:
      return 'Other';
    case Benefits.NOT_APLICABLE:
      return 'Not Applicable';
    case Benefits.DISABILITY_INSURANCE:
      return 'Disability Insurance';
    case Benefits.EDUCATION_FUNDING:
      return 'Education Funding';
    case Benefits.EDUCATION_LEAVE:
      return 'Education Leave';
    case Benefits.EXTENDED_HEALTH_DENTAL_CARE:
      return 'Extended Health & Dental Care';
    case Benefits.LIFE_INSURANCE:
      return 'Life Insurance';
    case Benefits.MENTAL_HEALTH_SUPPORT_WELLNESS_PROGRAM:
      return 'Mental Health Support & Wellness Program';
    case Benefits.OTHER_PAID_TIME_OFF:
      return 'Other Paid Time Off';
    case Benefits.PAID_VACATION:
      return 'Paid Vacation';
    case Benefits.PENSION:
      return 'Pension';
    default:
      return 'Unknown Benefit';
  }
}
