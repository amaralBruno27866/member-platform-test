import { Module } from '@nestjs/common';
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { DataverseInsuranceReportRepository } from '../repositories';
import { InsuranceReportService } from '../services';
import { InsuranceReportController } from '../controllers';
import { InsuranceReportEventsService } from '../events';

@Module({
  imports: [DataverseModule],
  providers: [
    DataverseInsuranceReportRepository,
    InsuranceReportService,
    InsuranceReportEventsService,
  ],
  controllers: [InsuranceReportController],
  exports: [InsuranceReportService, InsuranceReportEventsService],
})
export class InsuranceReportModule {}
