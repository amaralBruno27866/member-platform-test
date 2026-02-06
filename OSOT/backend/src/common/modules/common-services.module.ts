import { Module } from '@nestjs/common';
import { EducationMembershipIntegrationService } from '../services/education-membership-integration.service';
import { MembershipSettingsModule } from '../../classes/membership/membership-settings/modules/membership-settings.module';

/**
 * Common Services Module
 *
 * Provides shared services that can be used across multiple modules
 * without creating circular dependencies.
 */
@Module({
  imports: [MembershipSettingsModule],
  providers: [EducationMembershipIntegrationService],
  exports: [EducationMembershipIntegrationService],
})
export class CommonServicesModule {}
