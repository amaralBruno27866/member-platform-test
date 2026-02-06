import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
  Matches,
} from 'class-validator';

// DTO para solicitação de recuperação de senha
export class ForgotPasswordRequestDto {
  @ApiProperty({
    example: 'user@email.com',
    description: 'Email da conta (Account ou Affiliate)',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    enum: ['account', 'affiliate'],
    default: 'account',
    required: false,
    description:
      'Tipo de conta (opcional - sistema detecta automaticamente se não fornecido)',
  })
  @IsOptional()
  @IsIn(['account', 'affiliate'])
  accountType?: 'account' | 'affiliate';
}

// DTO para resetar a senha
export class ResetPasswordRequestDto {
  @ApiProperty({
    description: 'Token recebido por email (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    minLength: 8,
    example: 'NovaSenhaForte123!',
    description:
      'Nova senha (mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  newPassword: string;

  @ApiProperty({
    enum: ['account', 'affiliate'],
    default: 'account',
    required: false,
  })
  @IsOptional()
  @IsIn(['account', 'affiliate'])
  accountType?: 'account' | 'affiliate';
}

// DTO para validação do token
export class ValidateResetTokenDto {
  @ApiProperty({
    description: 'Token recebido por email (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    enum: ['account', 'affiliate'],
    default: 'account',
    required: false,
    description:
      'Tipo de conta (opcional - sistema detecta automaticamente se não fornecido)',
  })
  @IsOptional()
  @IsIn(['account', 'affiliate'])
  accountType?: 'account' | 'affiliate';
}
