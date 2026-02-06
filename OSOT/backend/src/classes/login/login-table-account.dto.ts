/**
 * Class: LoginTableAccountDto
 * Objective: Define the structure for internal login logic using Table_Account fields.
 * Functionality: Used internally to represent a logged-in account with all relevant fields for authentication and authorization.
 * Expected Result: Provides a type-safe structure for login logic, mapping Dataverse integer values to enums where available.
 *
 * Note: All documentation is written in plain English, using analogies and detailed explanations to help non-technical users understand each field.
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsBoolean,
  IsEnum,
  IsDefined,
  IsNumber,
} from 'class-validator';
import { AccountGroup } from '../../common/enums/account-group.enum';
import { AccountStatus } from '../../common/enums/account-status.enum';

export class LoginTableAccountDto {
  /**
   * The unique account ID (e.g., osot000123)
   */
  @ApiProperty({
    example: 'osot000123',
    description: 'The unique account ID.',
  })
  @IsString()
  osot_account_id: string;

  /**
   * The email address associated with the account.
   * Example: "user@email.com"
   */
  @ApiProperty({
    example: 'user@email.com',
    description: 'The email address for login.',
  })
  @IsEmail()
  osot_email: string;

  /**
   * The hashed password for the account (never exposed to frontend).
   */
  @ApiProperty({
    example: 'hashedpassword',
    description: 'The hashed password (internal use only).',
  })
  @IsString()
  osot_password: string;

  /**
   * Privilege level (e.g., 0: Login, 1: Owner, 2: Admin, 3: Main)
   */
  @ApiProperty({
    example: 2,
    description: 'Privilege level for the account.',
  })
  @IsDefined()
  @IsNumber()
  osot_privilege: number;

  /**
   * Account status (enum)
   */
  @ApiProperty({
    example: AccountStatus.ACTIVE,
    description: 'Account status (Active, Inactive, Pending).',
    enum: AccountStatus,
  })
  @IsEnum(AccountStatus)
  osot_account_status: AccountStatus;

  /**
   * Whether the account is an active member (true/false).
   */
  @ApiProperty({
    example: true,
    description: 'Is the account an active member?',
  })
  @IsBoolean()
  osot_active_member: boolean;

  /**
   * Account group (enum)
   */
  @ApiProperty({
    example: AccountGroup.OTHER,
    description: 'Account group (Therapist, Admin, Other, etc.)',
    enum: AccountGroup,
  })
  @IsEnum(AccountGroup)
  osot_account_group: AccountGroup;
}
