import { Injectable, Logger } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { UserGroup, MembershipEligilibility } from '../../../../common/enums';
import { Category } from '../../../../common/enums/categories-enum';

/**
 * Membership Category Determination Service
 *
 * BUSINESS LOGIC RESPONSIBILITIES:
 * - Step 3: Final mapping of user_group + eligibility → membership_category
 * - Convert user group and eligibility into the final membership category
 * - Implement mathematical mapping from CSV definitions
 *
 * MATHEMATICAL MAPPING FROM CSV (DefiningMembershipCategory.csv):
 *
 * DIRECT MAPPING (no eligibility check):
 * UserGroup=1 → Category=5   (OT Student → OT-STU)
 * UserGroup=2 → Category=11  (OTA Student → OTA-STU)
 * UserGroup=3 → Category=4   (OT Student New Grad → OT-NG)
 * UserGroup=4 → Category=10  (OTA Student New Grad → OTA-NG)
 * UserGroup=7 → Category=13  (VENDOR → ASSOC)
 * UserGroup=8 → Category=13  (OTHER → ASSOC)
 *
 * ELIGIBILITY-DEPENDENT MAPPING:
 * UserGroup=5 + Eligibility=1 → Category=1  (OT + Question1 → OT-PR)
 * UserGroup=5 + Eligibility=2 → Category=2  (OT + Question2 → OT-NP)
 * UserGroup=5 + Eligibility=6 → Category=2  (OT + Question6 → OT-NP)
 * UserGroup=5 + Eligibility=5 → Category=3  (OT + Question5 → OT-RET)
 * UserGroup=5 + Eligibility=7 → Category=6  (OT + Question7 → OT-LIFE)
 * UserGroup=5 + Eligibility=0 → Category=13 (OT + None → ASSOC)
 *
 * UserGroup=6 + Eligibility=3 → Category=7  (OTA + Question3 → OTA-PR)
 * UserGroup=6 + Eligibility=4 → Category=8  (OTA + Question4 → OTA-NP)
 * UserGroup=6 + Eligibility=6 → Category=8  (OTA + Question6 → OTA-NP)
 * UserGroup=6 + Eligibility=5 → Category=9  (OTA + Question5 → OTA-RET)
 * UserGroup=6 + Eligibility=7 → Category=12 (OTA + Question7 → OTA-LIFE)
 * UserGroup=6 + Eligibility=0 → Category=13 (OTA + None → ASSOC)
 *
 * UserGroup=9 + EligibilityAffiliate=1 → Category=14 (AFFILIATE + Primary → AFF-PRIM)
 * UserGroup=9 + EligibilityAffiliate=2 → Category=15 (AFFILIATE + Premium → AFF-PREM)
 *
 * @version 1.0.0
 */
@Injectable()
export class MembershipCategoryDeterminationService {
  private readonly logger = new Logger(
    MembershipCategoryDeterminationService.name,
  );

  /**
   * Determine membership category based on user group and eligibility
   * Step 3: Final mapping of user_group + eligibility → membership_category
   *
   * @param userGroup The determined user group from Step 1
   * @param eligibility The selected eligibility from Step 2 (optional for some groups)
   * @param eligibilityAffiliate For affiliate users, separate eligibility field
   * @returns The determined membership category
   */
  determineMembershipCategory(
    userGroup: UserGroup,
    eligibility?: MembershipEligilibility,
    eligibilityAffiliate?: number,
  ): Category {
    // DIRECT MAPPING FORMULAS (CSV rows with Check=FALSE)
    switch (userGroup) {
      case UserGroup.OT_STUDENT: // UserGroup=1
        return Category.OT_STU; // Category=5

      case UserGroup.OTA_STUDENT: // UserGroup=2
        return Category.OTA_STU; // Category=11

      case UserGroup.OT_STUDENT_NEW_GRAD: // UserGroup=3
        return Category.OT_NG; // Category=4

      case UserGroup.OTA_STUDENT_NEW_GRAD: // UserGroup=4
        return Category.OTA_NG; // Category=10

      case UserGroup.VENDOR_ADVERTISER_RECRUITER: // UserGroup=7
      case UserGroup.OTHER: // UserGroup=8
        return Category.ASSOC; // Category=13

      // ELIGIBILITY-DEPENDENT FORMULAS (CSV rows with Check=TRUE)
      case UserGroup.OT: // UserGroup=5
        return this.mapOTEligibilityToCategory(eligibility);

      case UserGroup.OTA: // UserGroup=6
        return this.mapOTAEligibilityToCategory(eligibility);

      case UserGroup.AFFILIATE: // UserGroup=9
        return this.mapAffiliateEligibilityToCategory(eligibilityAffiliate);

      default:
        this.logger.warn(
          `Unknown user group for membership category mapping: ${String(userGroup)}`,
        );
        return Category.ASSOC; // Default fallback
    }
  }

  /**
   * Map OT eligibility to membership category
   * @private
   */
  private mapOTEligibilityToCategory(
    eligibility?: MembershipEligilibility,
  ): Category {
    if (eligibility === undefined) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message: 'Eligibility is required for OT user group',
      });
    }

    switch (eligibility) {
      case MembershipEligilibility.NONE: // 0
        return Category.ASSOC; // 13 = ASSOC

      case MembershipEligilibility.QUESTION_1: // 1 - Living and working as OT
        return Category.OT_PR; // 1 = OT-PR

      case MembershipEligilibility.QUESTION_2: // 2 - Registering with College
        return Category.OT_NP; // 2 = OT-NP

      case MembershipEligilibility.QUESTION_5: // 5 - Retired or resigned
        return Category.OT_RET; // 3 = OT-RET

      case MembershipEligilibility.QUESTION_6: // 6 - On Parental leave
        return Category.OT_NP; // 2 = OT-NP

      case MembershipEligilibility.QUESTION_7: // 7 - Life membership (admin only)
        return Category.OT_LIFE; // 6 = OT-LIFE

      default:
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: `Invalid eligibility ${eligibility} for OT user group`,
          eligibility,
          userGroup: UserGroup.OT,
        });
    }
  }

  /**
   * Map OTA eligibility to membership category
   * @private
   */
  private mapOTAEligibilityToCategory(
    eligibility?: MembershipEligilibility,
  ): Category {
    if (eligibility === undefined) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message: 'Eligibility is required for OTA user group',
      });
    }

    switch (eligibility) {
      case MembershipEligilibility.NONE: // 0
        return Category.ASSOC; // 13 = ASSOC

      case MembershipEligilibility.QUESTION_3: // 3 - Living and working as assistant
        return Category.OTA_PR; // 7 = OTA-PR

      case MembershipEligilibility.QUESTION_4: // 4 - Previously worked as assistant
        return Category.OTA_NP; // 8 = OTA-NP

      case MembershipEligilibility.QUESTION_5: // 5 - Retired or resigned
        return Category.OTA_RET; // 9 = OTA-RET

      case MembershipEligilibility.QUESTION_6: // 6 - On Parental leave
        return Category.OTA_NP; // 8 = OTA-NP

      case MembershipEligilibility.QUESTION_7: // 7 - Life membership (admin only)
        return Category.OTA_LIFE; // 12 = OTA-LIFE

      default:
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: `Invalid eligibility ${eligibility} for OTA user group`,
          eligibility,
          userGroup: UserGroup.OTA,
        });
    }
  }

  /**
   * Map Affiliate eligibility to membership category
   * @private
   */
  private mapAffiliateEligibilityToCategory(
    eligibilityAffiliate?: number,
  ): Category {
    if (eligibilityAffiliate === undefined) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message: 'Eligibility affiliate is required for affiliate user group',
      });
    }

    switch (eligibilityAffiliate) {
      case 1:
        return Category.AFF_PRIM; // 14 = AFF-PRIM

      case 2:
        return Category.AFF_PREM; // 15 = AFF-PREM

      default:
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: `Invalid affiliate eligibility: ${eligibilityAffiliate}`,
          eligibilityAffiliate,
          userGroup: UserGroup.AFFILIATE,
        });
    }
  }
}
