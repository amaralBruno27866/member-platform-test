import { Injectable, Inject } from '@nestjs/common';
import { createAppError } from '../../common/errors/error.factory';
import { ErrorCodes } from '../../common/errors/error-codes';
import { Privilege } from '../../common/enums';
import { RedisService } from '../../redis/redis.service';
import {
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
} from './password-recovery.dto';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../../common/keys/password-hash.util';
import { UpdateAccountDto } from '../user-account/account/dtos/update-account.dto';
import {
  AffiliateRepository,
  AFFILIATE_REPOSITORY,
} from '../user-account/affiliate/interfaces/affiliate-repository.interface';
import { AccountLookupService } from '../user-account/account/services/account-lookup.service';
import { AccountCrudService } from '../user-account/account/services/account-crud.service';
import { AffiliateLookupService } from '../user-account/affiliate/services/affiliate-lookup.service';
import { AffiliateCrudService } from '../user-account/affiliate/services/affiliate-crud.service';
import { EmailService } from '../../emails/email.service';
import { EmailTemplateUtil } from '../../emails/email-template.util';

// Enhanced Authentication System
import { EnhancedUserRepositoryService } from '../../auth/services/enhanced-user-repository.service';

@Injectable()
export class PasswordRecoveryService {
  private readonly TOKEN_EXPIRATION = 60 * 30; // 30 minutos
  private readonly REDIS_PREFIX = 'password-recovery';

  constructor(
    private readonly redisService: RedisService,
    private readonly accountLookupService: AccountLookupService,
    private readonly accountCrudService: AccountCrudService,
    private readonly affiliateLookupService: AffiliateLookupService,
    private readonly affiliateCrudService: AffiliateCrudService,
    @Inject(AFFILIATE_REPOSITORY)
    private readonly affiliateRepository: AffiliateRepository,
    private readonly emailService: EmailService,
    private readonly enhancedUserRepository: EnhancedUserRepositoryService,
  ) {}

  // 1. Solicitação de recuperação: gera token e envia email
  async requestPasswordRecovery(dto: ForgotPasswordRequestDto): Promise<void> {
    // Use Enhanced Repository for unified user lookup
    try {
      const userLookupResult = await this.enhancedUserRepository.getUserType(
        dto.email,
      );

      if (!userLookupResult.found) {
        // Simula tempo de busca para evitar timing attack
        await new Promise((resolve) => setTimeout(resolve, 500));
        return;
      }

      // Use unified password reset system
      const resetResult =
        await this.enhancedUserRepository.requestPasswordReset(dto.email);

      // Generate UUID token for external system compatibility
      const token = uuidv4();
      const redisKey = `${this.REDIS_PREFIX}:${token}`;
      await this.redisService.set(redisKey, dto.email, {
        EX: this.TOKEN_EXPIRATION,
      });

      // Send email with appropriate context based on user type
      const isAffiliate = userLookupResult.userType === 'affiliate';
      const organizationContext = isAffiliate
        ? resetResult.organizationName
          ? ` for ${resetResult.organizationName}`
          : ' for your organization'
        : '';

      // Render HTML template with variables
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const html = EmailTemplateUtil.renderTemplate('password-reset-request', {
        frontendUrl,
        token,
        accountType: userLookupResult.userType,
        organizationContext,
      });

      await this.emailService.send({
        to: dto.email,
        subject: `Password Recovery - OSOT${organizationContext}`,
        html,
      });
    } catch {
      // Enhanced error handling - always simulate success for security
      await new Promise((resolve) => setTimeout(resolve, 500));
      return;
    }
  }

  // Legacy method for backward compatibility
  async requestPasswordRecoveryLegacy(
    dto: ForgotPasswordRequestDto,
  ): Promise<void> {
    // Decide qual service usar
    // Decide which lookup to use. For now both affiliate and main accounts
    // can be searched with the AccountLookupService which respects
    // credentials when necessary. Keep anti-enumeration: always succeed.
    const user = await this.accountLookupService
      .findByEmail(dto.email)
      .catch((): null => null);
    if (!user) {
      // Simula tempo de busca para evitar timing attack
      await new Promise((resolve) => setTimeout(resolve, 500));
      return;
    }
    const token = uuidv4();
    const redisKey = `${this.REDIS_PREFIX}:${token}`;
    await this.redisService.set(redisKey, dto.email, {
      EX: this.TOKEN_EXPIRATION,
    });
    // Send real or mock email (in English)
    await this.emailService.send({
      to: dto.email,
      subject: 'Password Recovery - OSOT',
      html: `<p>You requested a password reset for your OSOT account.</p>
                 <p>Use the token below to reset your password:</p>
                 <p><b>${token}</b></p>
                 <p>This token will expire in 30 minutes. If you did not request this, please ignore this email.</p>`,
    });
  }

  // 2. Validação do token
  async validateResetToken(token: string): Promise<boolean> {
    const redisKey = `${this.REDIS_PREFIX}:${token}`;
    const email = await this.redisService.get(redisKey);
    return !!email;
  }

  // 3. Reset de senha (suporta Account e Affiliate)
  async resetPassword(dto: ResetPasswordRequestDto): Promise<void> {
    const redisKey = `${this.REDIS_PREFIX}:${dto.token}`;
    const email = await this.redisService.get(redisKey);
    if (!email) {
      throw createAppError(
        ErrorCodes.INVALID_INPUT,
        { token: dto.token },
        400,
        'Token inválido ou expirado',
      );
    }

    // Detect user type (account vs affiliate)
    const userLookupResult =
      await this.enhancedUserRepository.getUserType(email);

    if (!userLookupResult.found) {
      throw createAppError(
        ErrorCodes.ACCOUNT_NOT_FOUND,
        { email },
        404,
        'Usuário não encontrado',
      );
    }

    const isAffiliate = userLookupResult.userType === 'affiliate';

    // Validate user exists and update password based on type
    if (isAffiliate) {
      // AFFILIATE: Validate existence and get affiliate ID
      const affiliate = await this.affiliateLookupService.findByEmail(
        email,
        Privilege.OWNER,
      );

      if (!affiliate?.osot_table_account_affiliateid) {
        throw createAppError(
          ErrorCodes.ACCOUNT_NOT_FOUND,
          { email, userType: 'affiliate' },
          404,
          'Affiliate não encontrado',
        );
      }

      // AFFILIATE: Hash password and update using repository
      const hashedPassword = await hashPassword(dto.newPassword);
      await this.affiliateRepository.updatePassword(
        affiliate.osot_table_account_affiliateid,
        hashedPassword,
      );
    } else {
      // ACCOUNT: Validate existence and get account GUID
      const account = await this.accountLookupService.findByEmail(
        email,
        'main', // Use 'main' for administrative password recovery operations
      );

      if (!account?.osot_table_accountid) {
        throw createAppError(
          ErrorCodes.ACCOUNT_NOT_FOUND,
          { email, userType: 'account' },
          404,
          'Conta não encontrada',
        );
      }

      // ACCOUNT: Update password using AccountCrudService with GUID and 'main' role
      const updateDto: UpdateAccountDto = {
        osot_password: dto.newPassword,
      } as unknown as UpdateAccountDto;
      await this.accountCrudService.update(
        account.osot_table_accountid,
        updateDto,
        'main', // Use 'main' app for full permissions on password reset
      );
    }

    // Token cleanup optional: permite bloqueio posterior se necessário
    // await this.redisService.del(redisKey);

    // Prepare confirmation email context
    const organizationContext = isAffiliate ? ' for your organization' : '';

    // Render HTML template for password change confirmation
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const changeDate = new Date().toLocaleString('en-US', {
      timeZone: 'America/Toronto',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const confirmationHtml = EmailTemplateUtil.renderTemplate(
      'password-reset-confirmation',
      {
        frontendUrl,
        accountType: userLookupResult.userType,
        organizationContext,
        changeDate,
        ipAddress: 'N/A', // TODO: Capture from request context if needed
      },
    );

    // Send password change alert email (in English)
    await this.emailService.send({
      to: email,
      subject: 'Your password has been changed - OSOT',
      html: confirmationHtml,
    });
  }
}
