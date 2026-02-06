import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PasswordRecoveryService } from './password-recovery.service';
import {
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  ValidateResetTokenDto,
} from './password-recovery.dto';
import { ApiBody, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RateLimitGuard } from '../../auth/rate-limit.guard';

@ApiTags('Public PasswordRecovery Operations')
@Controller('password-recovery')
export class PasswordRecoveryController {
  constructor(
    private readonly passwordRecoveryService: PasswordRecoveryService,
  ) {}

  /**
   * Solicita recuperação de senha (envia token por email)
   * Sempre retorna sucesso, mesmo se email não existir (anti-enumeration)
   */
  @Post('request')
  @UseGuards(RateLimitGuard) // Protect against email enumeration and spam attacks
  @ApiOperation({
    summary: 'Solicita recuperação de senha',
    description:
      'Envia um email com token de recuperação de senha. Sempre retorna sucesso por motivos de segurança (não revela se email existe).',
  })
  @ApiBody({ type: ForgotPasswordRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Email de recuperação enviado (se o email existir)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Muitas requisições - tente novamente mais tarde',
  })
  @HttpCode(HttpStatus.OK)
  async request(
    @Body() dto: ForgotPasswordRequestDto,
  ): Promise<{ success: boolean }> {
    await this.passwordRecoveryService.requestPasswordRecovery(dto);
    return { success: true };
  }

  /**
   * Valida se o token de reset é válido
   */
  @Post('validate')
  @UseGuards(RateLimitGuard) // Protect against token brute-force attacks
  @ApiOperation({
    summary: 'Valida token de reset de senha',
    description:
      'Verifica se um token de recuperação é válido e não expirou (30 minutos de validade).',
  })
  @ApiBody({ type: ValidateResetTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token validado',
    schema: {
      type: 'object',
      properties: {
        valid: {
          type: 'boolean',
          example: true,
          description: 'true se token válido, false se inválido ou expirado',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async validate(
    @Body() dto: ValidateResetTokenDto,
  ): Promise<{ valid: boolean }> {
    const valid = await this.passwordRecoveryService.validateResetToken(
      dto.token,
    );
    return { valid };
  }

  /**
   * Reseta a senha usando token e nova senha
   * Sempre retorna sucesso genérico (anti-enumeration)
   */
  @Post('reset')
  @UseGuards(RateLimitGuard) // Protect against brute-force password reset attempts
  @ApiOperation({
    summary: 'Reseta a senha usando token',
    description:
      'Redefine a senha do usuário usando o token recebido por email. Sempre retorna sucesso por motivos de segurança.',
  })
  @ApiBody({ type: ResetPasswordRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Senha resetada com sucesso (se token válido)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Senha não atende aos requisitos de segurança',
  })
  @ApiResponse({
    status: 429,
    description: 'Muitas requisições - tente novamente mais tarde',
  })
  @HttpCode(HttpStatus.OK)
  async reset(
    @Body() dto: ResetPasswordRequestDto,
  ): Promise<{ success: boolean }> {
    try {
      await this.passwordRecoveryService.resetPassword(dto);
    } catch {
      // Sempre retorna sucesso para não revelar existência de email/token
    }
    return { success: true };
  }
}
