/**
 * Module: AuthModule
 * Objective: Organize and provide authentication-related controllers and services.
 * Functionality: Registers authentication service and controller, and exports the service for use in other modules.
 * Expected Result: Makes authentication logic available throughout the application.
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataverseModule } from '../integrations/dataverse.module';
import { JwtStrategy } from './jwt.strategy';
import { RedisService } from '../redis/redis.service';
import { LoginOrchestratorService } from './login-orchestrator.service';
import { UserLookupService } from './user-lookup.service';
import { AccountModule } from '../classes/user-account/account/modules/account.module';
import { AffiliateModule } from '../classes/user-account/affiliate/modules/affiliate.module';
import { OrganizationModule } from '../classes/others/organization/modules/organization.module';

// Enhanced Authentication System
import { EnhancedUserRepositoryService } from './services/enhanced-user-repository.service';
import { AccountAuthService } from './services/account-auth.service';

@Module({
  imports: [
    ConfigModule,
    DataverseModule,
    AccountModule, // Import AccountModule for AccountRepository and events
    AffiliateModule, // Import AffiliateModule to get AffiliateAuthService
    OrganizationModule, // Import OrganizationModule for organization lookup
    // UserProfileModule,
    // TableAccountAffiliateModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1d',
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    UserLookupService,
    EnhancedUserRepositoryService, // Enhanced authentication system
    AccountAuthService, // Account authentication service (moved from AccountModule)
    // AccountLookupService, // Now provided by AccountModule
    JwtStrategy,
    RedisService,
    LoginOrchestratorService,
  ],
  controllers: [AuthController],
  exports: [AuthService, UserLookupService],
})
export class AuthModule {}
