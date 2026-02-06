/**
 * Module: AppModule
 * Objective: Bootstrap and organize the core modules, controllers, and providers of the application.
 * Functionality: Imports and configures global modules, registers controllers and providers, and sets up the application's structure.
 * Expected Result: The application is initialized with all necessary modules and dependencies.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from './auth/auth.module';
import { RedisService } from './redis/redis.service';
import { EmailService } from './emails/email.service';
import { EnumsController } from './common/controllers/enums.controller';

// Essential Modules Integration
import { DataverseModule } from './integrations/dataverse.module';
import { CommonServicesModule } from './common/modules/common-services.module';
import { CacheModule } from './cache/cache.module';

// User Account Modules (Production Ready)
import { AccountModule } from './classes/user-account/account/modules/account.module';
import { ManagementModule } from './classes/user-account/management/modules/management.module';
import { AddressModule } from './classes/user-account/address/modules/address.module';
import { ContactModule } from './classes/user-account/contact/modules/contact.module';
import { IdentityModule } from './classes/user-account/identity/modules/identity.module';
import { OtEducationModule } from './classes/user-account/ot-education/modules/ot-education.module';
import { OtaEducationModule } from './classes/user-account/ota-education/modules/ota-education.module';

// Membership Modules (Production Ready)
import { MembershipSettingsModule } from './classes/membership/membership-settings/modules/membership-settings.module';
import { MembershipCategoryModule } from './classes/membership/membership-category/modules/membership-category.module';
import { MembershipPreferenceModule } from './classes/membership/membership-preferences/modules/membership-preference.module';
import { MembershipEmploymentModule } from './classes/membership/membership-employment/modules/membership-employment.module';
import { MembershipPracticesModule } from './classes/membership/membership-practices/modules/membership-practices.module';

// Orchestrator Modules (Production Ready)
import { AccountOrchestratorModule } from './classes/orchestrator/account-orchestrator/modules/account-orchestrator.module';
import { ProductOrchestratorModule } from './classes/orchestrator/product-orchestrator/modules/product-orchestrator.module';

// Password Recovery Module (Production Ready)
import { PasswordRecoveryModule } from './classes/password-recovery/password-recovery.module';

// Other Modules (Production Ready)
import { ProductModule } from './classes/others/product/modules/product.module';
import { AudienceTargetModule } from './classes/others/audience-target/modules/audience-target.module';
import { OrganizationModule } from './classes/others/organization/modules/organization.module';
import { OrderModule } from './classes/others/order/modules/order.module';
import { OrderProductModule } from './classes/others/order-product/modules/order-product.module';
import { InsuranceModule } from './classes/others/insurance/modules/insurance.module';
import { InsuranceReportModule } from './classes/others/insurance-report/modules';
import { AdditionalInsuredModule } from './classes/others/additional-insured/modules';

// Bootstrap Module (First-Time Setup)
import { BootstrapModule } from './bootstrap/bootstrap.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 10,
    }),
    HttpModule,
    AuthModule,

    // Bootstrap Module (First-Time Setup)
    BootstrapModule,

    // Essential Integration
    DataverseModule,
    CommonServicesModule,
    CacheModule, // Global cache service (Redis)

    // User Account Modules (Production Ready)
    AccountModule,
    AddressModule,
    ContactModule,
    IdentityModule,
    OtEducationModule,
    OtaEducationModule,
    ManagementModule,

    // Membership Modules (Production Ready)
    MembershipSettingsModule,
    MembershipCategoryModule,
    MembershipPreferenceModule,
    MembershipEmploymentModule,
    MembershipPracticesModule,

    // Orchestrator Modules (Production Ready)
    AccountOrchestratorModule,
    ProductOrchestratorModule,

    // Password Recovery Module (Production Ready)
    PasswordRecoveryModule,

    // Other Modules (Production Ready)
    ProductModule,
    AudienceTargetModule,
    OrganizationModule,
    OrderModule,
    OrderProductModule,
    InsuranceModule,
    InsuranceReportModule,
    AdditionalInsuredModule,
  ],
  controllers: [AppController, EnumsController],
  providers: [AppService, RedisService, EmailService], // Make Redis and Email global
})
export class AppModule {}
