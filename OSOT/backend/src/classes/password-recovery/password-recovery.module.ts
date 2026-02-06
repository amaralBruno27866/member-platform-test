import { Module } from '@nestjs/common';
import { PasswordRecoveryController } from './password-recovery.controller';
import { PasswordRecoveryService } from './password-recovery.service';
import { DataverseModule } from '../../integrations/dataverse.module';
import { AccountModule } from '../user-account/account/modules/account.module';
import { AffiliateModule } from '../user-account/affiliate/modules/affiliate.module';
import { RedisService } from '../../redis/redis.service';
import { EmailService } from '../../emails/email.service';
import { EnhancedUserRepositoryService } from '../../auth/services/enhanced-user-repository.service';
import { UserLookupService } from '../../auth/user-lookup.service';
import { AccountAuthService } from '../../auth/services/account-auth.service';

@Module({
  imports: [DataverseModule, AccountModule, AffiliateModule],
  controllers: [PasswordRecoveryController],
  providers: [
    PasswordRecoveryService,
    RedisService,
    EmailService,
    EnhancedUserRepositoryService,
    UserLookupService,
    AccountAuthService,
  ],
  exports: [PasswordRecoveryService],
})
export class PasswordRecoveryModule {}
