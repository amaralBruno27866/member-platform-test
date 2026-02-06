import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Controllers and Services
import { MembershipCategoryPrivateController } from '../controllers/membership-category-private.controller';
import { MembershipCategoryBusinessRuleService } from '../services/membership-category-business-rule.service';
import { MembershipCategoryCrudService } from '../services/membership-category-crud.service';
import { MembershipCategoryLookupService } from '../services/membership-category-lookup.service';
import { MembershipCategoryMembershipYearService } from '../utils/membership-category-membership-year.util';

// Specialized Services (refactored from monolith)
import { MembershipCategoryValidationService } from '../services/membership-category-validation.service';
import { MembershipCategoryUsergroupService } from '../services/membership-category-usergroup.service';
import { MembershipCategoryEligibilityService } from '../services/membership-category-eligibility.service';
import { MembershipCategoryDeterminationService } from '../services/membership-category-determination.service';
import { MembershipCategoryParentalLeaveService } from '../services/membership-category-parental-leave.service';

// Repository
import {
  MembershipCategoryRepositoryService,
  MEMBERSHIP_CATEGORY_REPOSITORY,
} from '../repositories/membership-category.repository';

// Required Module Dependencies
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { AccountModule } from '../../../user-account/account/modules/account.module';
import { AffiliateModule } from '../../../user-account/affiliate/modules/affiliate.module';
import { OtEducationModule } from '../../../user-account/ot-education/modules/ot-education.module';
import { OtaEducationModule } from '../../../user-account/ota-education/modules/ota-education.module';
import { MembershipSettingsModule } from '../../membership-settings/modules/membership-settings.module';

@Module({
  imports: [
    ConfigModule,
    // Core Dependencies
    DataverseModule, // Provides DataverseService
    // User Account Dependencies
    AccountModule, // Provides AccountRepositoryService
    AffiliateModule, // Provides AffiliateRepositoryService
    OtEducationModule, // Provides OtEducationRepositoryService
    OtaEducationModule, // Provides OtaEducationRepositoryService
    // Membership Dependencies
    MembershipSettingsModule,
  ],
  providers: [
    // Repository Provider - direct class registration for injection
    MembershipCategoryRepositoryService,

    // Repository Pattern Provider - enables dependency injection of repository interface
    {
      provide: MEMBERSHIP_CATEGORY_REPOSITORY,
      useClass: MembershipCategoryRepositoryService,
    },

    // Specialized Services (Step 1-3 handlers + validation)
    // These services coordinate domain logic and are injected by BusinessRuleService
    MembershipCategoryValidationService,
    MembershipCategoryUsergroupService,
    MembershipCategoryEligibilityService,
    MembershipCategoryDeterminationService,
    MembershipCategoryParentalLeaveService,

    // Core Services
    MembershipCategoryBusinessRuleService, // Orchestrator that coordinates all specialized services
    MembershipCategoryCrudService,
    MembershipCategoryLookupService,
    MembershipCategoryMembershipYearService,
  ],
  controllers: [MembershipCategoryPrivateController],
  exports: [
    // Repository Interface - enables other modules to inject membership category repository
    MEMBERSHIP_CATEGORY_REPOSITORY,

    // Repository Service - direct class export for external modules
    MembershipCategoryRepositoryService,

    // Specialized Services - enable access by orchestrators in other modules if needed
    MembershipCategoryValidationService,
    MembershipCategoryUsergroupService,
    MembershipCategoryEligibilityService,
    MembershipCategoryDeterminationService,
    MembershipCategoryParentalLeaveService,

    // Core Services Export - enables consumption by other modules
    MembershipCategoryBusinessRuleService,
    MembershipCategoryCrudService,
    MembershipCategoryLookupService,
    MembershipCategoryMembershipYearService,
  ],
})
export class MembershipCategoryModule {}
