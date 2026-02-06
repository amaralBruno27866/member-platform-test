import { Module } from '@nestjs/common';
import { RedisModule } from '../../../redis/redis.module';
import { DataverseModule } from '../../../integrations/dataverse.module';

// Core services
import { MembershipOrchestratorService } from './services/membership-orchestrator.service';
import { Step1_2EligibilityValidatorService } from './services/step_1_2-eligibility-validator.service';
import { MembershipSessionManagerService } from './services/step_3-session-manager.service';
import { MembershipDataStagingService } from './services/step_4-data-stager.service';
import { MembershipOrderOrchestratorService } from './services/step_4_5_to_7-order-orchestrator.service';
import { MembershipPaymentHandlerService } from './services/step_8_5-payment-handler.service';
import { MembershipEntityCreatorService } from './services/step_10-entity-creator.service';

// Events
import { MembershipOrchestratorEventService } from './events/membership-orchestrator-event.service';

// Repository
import { MembershipOrchestratorRepository } from './repositories/membership-orchestrator.repository';

// Controllers
import { MembershipOrchestratorController } from './controllers/membership-orchestrator.controller';

// External module dependencies
import { AccountModule } from '../../../classes/user-account/account/modules/account.module';
import { OtEducationModule } from '../../../classes/user-account/ot-education/modules/ot-education.module';
import { OtaEducationModule } from '../../../classes/user-account/ota-education/modules/ota-education.module';
import { MembershipCategoryModule } from '../../../classes/membership/membership-category/modules/membership-category.module';
import { MembershipEmploymentModule } from '../../../classes/membership/membership-employment/modules/membership-employment.module';
import { MembershipPracticesModule } from '../../../classes/membership/membership-practices/modules/membership-practices.module';
import { MembershipPreferenceModule } from '../../../classes/membership/membership-preferences/modules/membership-preference.module';
import { MembershipSettingsModule } from '../../../classes/membership/membership-settings/modules/membership-settings.module';
import { ProductModule } from '../../../classes/others/product/modules/product.module';
import { AudienceTargetModule } from '../../../classes/others/audience-target/modules/audience-target.module';
import { OrderModule } from '../../../classes/others/order/modules/order.module';
import { OrderProductModule } from '../../../classes/others/order-product/modules/order-product.module';
import { InsuranceModule } from '../../../classes/others/insurance/modules/insurance.module';
import { OrganizationModule } from '../../../classes/others/organization/modules/organization.module';
import { AddressModule } from '../../../classes/user-account/address/modules/address.module';

@Module({
  imports: [
    // Core dependencies
    RedisModule,
    DataverseModule,

    // Membership entity modules
    MembershipCategoryModule,
    MembershipEmploymentModule,
    MembershipPracticesModule,
    MembershipPreferenceModule,
    MembershipSettingsModule,

    // User/account modules
    AccountModule,
    OtEducationModule,
    OtaEducationModule,
    AddressModule,

    // Product & order modules
    ProductModule,
    AudienceTargetModule,
    OrderModule,
    OrderProductModule,

    // Insurance & organization modules
    InsuranceModule,
    OrganizationModule,
  ],
  providers: [
    // Specialized workflow services
    Step1_2EligibilityValidatorService,
    MembershipSessionManagerService,
    MembershipDataStagingService,
    MembershipOrderOrchestratorService,
    MembershipPaymentHandlerService,
    MembershipEntityCreatorService,

    // Core orchestrator
    MembershipOrchestratorService,

    // Events
    MembershipOrchestratorEventService,

    // Repository
    MembershipOrchestratorRepository,
  ],
  controllers: [MembershipOrchestratorController],
  exports: [
    MembershipOrchestratorService,
    Step1_2EligibilityValidatorService,
    MembershipSessionManagerService,
    MembershipDataStagingService,
    MembershipOrderOrchestratorService,
    MembershipPaymentHandlerService,
    MembershipEntityCreatorService,
  ],
})
export class MembershipOrchestratorModule {}
