/**
 * This module provides:
 * - Complete CRUD operations for membership settings
 * - Public/Private API endpoints
 * - Business rules validation
 * - Event-driven architecture
 * - Repository pattern implementation
 */

import { Module } from '@nestjs/common';

// Controllers
import { MembershipSettingsPublicController } from '../controllers/membership-settings-public.controller';
import { MembershipSettingsPrivateController } from '../controllers/membership-settings-private.controller';

// Services
import { MembershipSettingsBusinessRulesService } from '../services/membership-settings-business-rules.service';
import { MembershipSettingsCrudService } from '../services/membership-settings-crud.service';
import { MembershipSettingsLookupService } from '../services/membership-settings-lookup.service';

// Repository
import {
  DataverseMembershipSettingsRepository,
  MEMBERSHIP_SETTINGS_REPOSITORY,
} from '../repositories/membership-settings.repository';

// Mappers
import { MembershipSettingsMapper } from '../mappers/membership-settings.mapper';

// Utils
import { MembershipSettingsUtilsService } from '../utils/membership-settings.utils';

// Common modules (using existing dataverse module)
import { DataverseModule } from '../../../../integrations/dataverse.module';

@Module({
  imports: [
    DataverseModule, // For Dataverse integration
  ],
  controllers: [
    MembershipSettingsPublicController,
    MembershipSettingsPrivateController,
  ],
  providers: [
    // Services
    MembershipSettingsBusinessRulesService,
    MembershipSettingsCrudService,
    MembershipSettingsLookupService,

    // Repository
    {
      provide: MEMBERSHIP_SETTINGS_REPOSITORY,
      useClass: DataverseMembershipSettingsRepository,
    },

    // Mappers
    MembershipSettingsMapper,

    // Utils
    MembershipSettingsUtilsService,
  ],
  exports: [
    // Export services for potential use by other modules
    MembershipSettingsBusinessRulesService,
    MembershipSettingsCrudService,
    MembershipSettingsLookupService,
    MEMBERSHIP_SETTINGS_REPOSITORY,
    MembershipSettingsMapper,
    MembershipSettingsUtilsService,
  ],
})
export class MembershipSettingsModule {}
