import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    name: 'osot_email',
  })
  @IsEmail()
  osot_email: string;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description: 'User password (minimum 8 characters)',
    name: 'osot_password',
  })
  @IsString()
  @MinLength(8)
  osot_password: string;

  @ApiProperty({
    example: 'osot',
    description:
      'Organization slug (lowercase, from subdomain or manual input)',
    name: 'organizationSlug',
    required: false,
  })
  @IsString()
  @IsOptional()
  organizationSlug?: string;
}
