/**
 * Bootstrap Module
 * Provides initialization services for first-time system setup
 */

import { Module } from '@nestjs/common';
import { BootstrapService } from './bootstrap.service';
import { DataverseModule } from '../integrations/dataverse.module';
import { OrganizationModule } from '../classes/others/organization/modules/organization.module';

@Module({
  imports: [DataverseModule, OrganizationModule],
  providers: [BootstrapService],
  exports: [BootstrapService],
})
export class BootstrapModule {}
