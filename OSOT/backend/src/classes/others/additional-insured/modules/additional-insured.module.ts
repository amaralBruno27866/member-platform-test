import { Module } from '@nestjs/common';
import { CacheModule } from '../../../../cache/cache.module';
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { InsuranceModule } from '../../../others/insurance/modules/insurance.module';
import { PrivateAdditionalInsuredController } from '../controllers';
import {
  AdditionalInsuredBusinessRulesService,
  AdditionalInsuredCrudService,
  AdditionalInsuredLookupService,
  AdditionalInsuredEventsService,
} from '../services';
import { DataverseAdditionalInsuredRepository } from '../repositories';

@Module({
  imports: [DataverseModule, CacheModule, InsuranceModule],
  controllers: [PrivateAdditionalInsuredController],
  providers: [
    DataverseAdditionalInsuredRepository,
    AdditionalInsuredBusinessRulesService,
    AdditionalInsuredEventsService,
    AdditionalInsuredCrudService,
    AdditionalInsuredLookupService,
  ],
  exports: [AdditionalInsuredCrudService, AdditionalInsuredLookupService],
})
export class AdditionalInsuredModule {}
