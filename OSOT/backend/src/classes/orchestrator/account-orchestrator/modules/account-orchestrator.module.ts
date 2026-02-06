/**
 * Account Orchestrator Module
 *
 * This module provides the complete user registration orchestration functionality.
 * It includes email workflow services, validation, repositories, and event handling.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Required Entity Modules for CRUD Services
import { AccountModule } from '../../../user-account/account/modules/account.module';
import { AffiliateModule } from '../../../user-account/affiliate/modules/affiliate.module';
import { AddressModule } from '../../../user-account/address/modules/address.module';
import { ContactModule } from '../../../user-account/contact/modules/contact.module';
import { IdentityModule } from '../../../user-account/identity/modules/identity.module';
import { OtEducationModule } from '../../../user-account/ot-education/modules/ot-education.module';
import { OtaEducationModule } from '../../../user-account/ota-education/modules/ota-education.module';
import { ManagementModule } from '../../../user-account/management/modules/management.module';

// Organization Module for Multi-Tenant Support
import { OrganizationModule } from '../../../others/organization/modules/organization.module';

// Orchestrator Core Services
import { AccountOrchestratorService } from '../services/account-orchestrator.service';
import { OrchestratorEmailWorkflowService } from '../services/orchestrator-email-workflow.service';

// Validators and Repositories
import { OrchestratorValidationService } from '../validators/orchestrator-validation.service';
import { OrchestratorRepository } from '../repositories/orchestrator.repository';

// Event Service
import { OrchestratorEventService } from '../events/orchestrator-event.service';

// Controllers
import { AccountOrchestratorPublicController } from '../controllers/account-orchestrator-public.controller';

// Email Service Integration
import { EmailService } from '../../../../emails/email.service';

// Redis Service for Session Management
import { RedisService } from '../../../../redis/redis.service';

@Module({
  imports: [
    ConfigModule, // For environment configuration

    // Import Entity Modules to access their CRUD services
    AccountModule,
    AffiliateModule,
    AddressModule,
    ContactModule,
    IdentityModule,
    OtEducationModule,
    OtaEducationModule,
    ManagementModule,

    // Organization Module for Multi-Tenant Support
    OrganizationModule,
  ],
  controllers: [AccountOrchestratorPublicController],
  providers: [
    // Core Orchestrator Services
    AccountOrchestratorService,
    OrchestratorEmailWorkflowService,

    // Supporting Services
    OrchestratorValidationService,
    OrchestratorRepository,
    OrchestratorEventService,

    // External Services
    EmailService,
    RedisService, // Required by OrchestratorRepository for session management
  ],
  exports: [
    // Export main services for use in other modules
    AccountOrchestratorService,
    OrchestratorEmailWorkflowService,
    OrchestratorRepository,
    OrchestratorEventService,
  ],
})
export class AccountOrchestratorModule {}
