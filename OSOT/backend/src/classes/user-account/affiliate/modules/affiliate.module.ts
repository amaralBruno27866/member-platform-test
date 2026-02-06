import { Module, forwardRef } from '@nestjs/common';

// External Dependencies
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { RedisService } from '../../../../redis/redis.service';
import { EmailService } from '../../../../emails/email.service';
import { AuthModule } from '../../../../auth/auth.module';

// Repository
import { AffiliateRepositoryService } from '../repositories/affiliate.repository';
import { AFFILIATE_REPOSITORY } from '../interfaces/affiliate-repository.interface';

// Internal Services3512
import { AffiliateBusinessRuleService } from '../services/affiliate-business-rule.service';
import { AffiliateCrudService } from '../services/affiliate-crud.service';
import { AffiliateLookupService } from '../services/affiliate-lookup.service';
import { AffiliateAuthService } from '../services/affiliate-auth.service';
import { AffiliateRegistrationService } from '../services/affiliate-registration.service';

// Event System
import { AffiliateEventsService } from '../events/affiliate.events';

// Controllers
import { AffiliatePublicController } from '../controllers/affiliate-public.controller';
import { AffiliatePrivateController } from '../controllers/affiliate-private.controller';

/**
 * Affiliate Module
 *
 * Provides complete affiliate management functionality including:
 * - Business rule validation and password security
 * - CRUD operations with privilege-based access control
 * - Advanced search and lookup operations
 * - Public endpoints for email validation and discovery
 * - Private endpoints for authenticated operations
 *
 * @integrates DataverseModule for data persistence
 * @exports All affiliate services for external module consumption
 */
@Module({
  imports: [DataverseModule, forwardRef(() => AuthModule)],
  controllers: [AffiliatePublicController, AffiliatePrivateController],
  providers: [
    // Repository Pattern Provider
    {
      provide: AFFILIATE_REPOSITORY,
      useClass: AffiliateRepositoryService,
    },
    AffiliateRepositoryService, // Add direct provider for injection
    AffiliateBusinessRuleService,
    AffiliateCrudService,
    AffiliateLookupService,
    AffiliateAuthService,
    AffiliateRegistrationService,
    AffiliateEventsService,
    RedisService,
    EmailService,
  ],
  exports: [
    AFFILIATE_REPOSITORY, // Export the repository token for external module access
    AffiliateRepositoryService, // Export direct repository class for external injection
    AffiliateBusinessRuleService,
    AffiliateCrudService,
    AffiliateLookupService,
    AffiliateAuthService,
    AffiliateRegistrationService,
    AffiliateEventsService,
  ],
})
export class AffiliateModule {}
