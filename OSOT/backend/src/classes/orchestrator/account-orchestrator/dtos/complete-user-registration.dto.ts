/**
 * Complete User Registration DTO
 *
 * Main input DTO that aggregates all entity DTOs for complete user registration.
 * This DTO combines data from all required entities: Account, Address, Contact,
 * Identity, Education (OT/OTA), and Management.
 *
 * DESIGN PRINCIPLES:
 * - Reuses existing entity DTOs for consistency
 * - Maintains all validation rules from individual entities
 * - Supports both OT and OTA education types
 * - Management is optional with safe defaults
 *
 * WORKFLOW INTEGRATION:
 * - Used as input for registration staging
 * - Stored in Redis during registration process
 * - Decomposed into individual entity calls during creation
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Import existing DTOs from entity modules
import { CreateAccountDto } from '../../../user-account/account/dtos/create-account.dto';
import { CreateAddressForAccountDto } from '../../../user-account/address/dtos/create-address-for-account.dto';
import { CreateContactForAccountDto } from '../../../user-account/contact/dtos/create-contact-for-account.dto';
import { CreateIdentityForAccountDto } from '../../../user-account/identity/dtos/create-identity-for-account.dto';
import { CreateOtEducationForAccountDto } from '../../../user-account/ot-education/dtos/create-ot-education-for-account.dto';
import { CreateOtaEducationForAccountDto } from '../../../user-account/ota-education/dtos/create-ota-education-for-account.dto';
import { CreateManagementForAccountDto } from '../../../user-account/management/dtos/create-management-for-account.dto';

export class CompleteUserRegistrationDto {
  // ========================================
  // ORGANIZATION CONTEXT (Multi-Tenant)
  // ========================================
  @ApiProperty({
    description:
      'Organization slug for multi-tenant registration. Determines which organization the user belongs to. Extracted from subdomain (e.g., org-a.platform.com) or defaults to "osot".',
    example: 'osot',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  organizationSlug?: string;

  // ========================================
  // ACCOUNT DATA (Required - Primary entity)
  // ========================================
  @ApiProperty({
    description: 'Account data for the new user',
    type: CreateAccountDto,
    example: {
      osot_first_name: 'Any',
      osot_last_name: 'Doe',
      osot_date_of_birth: '1990-12-25',
      osot_mobile_phone: '(555) 123-4567',
      osot_email: 'b.alencar.amaral@gmail.com',
      osot_password: 'P@ssw0rd!',
      osot_account_group: 1,
      osot_account_declaration: true,
    },
  })
  @ValidateNested()
  @Type(() => CreateAccountDto)
  @IsNotEmpty()
  account: CreateAccountDto;

  // ========================================
  // ADDRESS DATA (Required)
  // ========================================
  @ApiProperty({
    description: 'Address data for the new user',
    type: CreateAddressForAccountDto,
    example: {
      'osot_Table_Account@odata.bind': '',
      osot_address_1: '123 Main Street',
      osot_address_2: 'Suite 100',
      osot_city: 380,
      osot_province: 1,
      osot_postal_code: 'K1A 0A6',
      osot_country: 1,
      osot_address_type: 1,
      osot_address_preference: [1, 2],
      osot_other_city: 'Other City Name',
      osot_other_province_state: 'Other Province/State',
    },
  })
  @ValidateNested()
  @Type(() => CreateAddressForAccountDto)
  @IsNotEmpty()
  address: CreateAddressForAccountDto;

  // ========================================
  // CONTACT DATA (Required)
  // ========================================
  @ApiProperty({
    description: 'Contact data for the new user',
    type: CreateContactForAccountDto,
    example: {
      'osot_Table_Account@odata.bind': '',
      osot_secondary_email: 'secondary@example.com',
      osot_job_title: 'Senior Developer',
      osot_home_phone: '4165551234',
      osot_work_phone: '4165559876',
      osot_business_website: 'https://example.com',
      osot_facebook: 'https://facebook.com/johndoe',
      osot_instagram: 'https://instagram.com/johndoe',
      osot_tiktok: 'https://tiktok.com/@johndoe',
      osot_linkedin: 'https://linkedin.com/in/johndoe',
    },
  })
  @ValidateNested()
  @Type(() => CreateContactForAccountDto)
  @IsNotEmpty()
  contact: CreateContactForAccountDto;

  // ========================================
  // IDENTITY DATA (Required)
  // ========================================
  @ApiProperty({
    description: 'Identity data for the new user',
    type: CreateIdentityForAccountDto,
    example: {
      'osot_Table_Account@odata.bind': '',
      osot_chosen_name: 'Alex',
      osot_language: [13, 18],
      osot_gender: 9,
      osot_race: 1,
      osot_indigenous: true,
      osot_indigenous_detail: 0,
      osot_indigenous_detail_other: 'Mohawk Nation',
      osot_disability: false,
    },
  })
  @ValidateNested()
  @Type(() => CreateIdentityForAccountDto)
  @IsNotEmpty()
  identity: CreateIdentityForAccountDto;

  // ========================================
  // EDUCATION TYPE SELECTOR (Required)
  // ========================================
  @ApiProperty({
    description: 'Type of education (OT or OTA)',
    enum: ['ot', 'ota'],
    example: 'ot',
  })
  @IsEnum(['ot', 'ota'])
  @IsNotEmpty()
  educationType: 'ot' | 'ota';

  // ========================================
  // OT EDUCATION DATA (Conditional)
  // ========================================
  @ApiProperty({
    description: 'OT Education data (required if educationType is "ot")',
    type: CreateOtEducationForAccountDto,
    required: false,
    example: {
      'osot_Table_Account@odata.bind': '',
      osot_coto_status: 4,
      osot_coto_registration: 'AB123456',
      osot_ot_degree_type: 3,
      osot_ot_university: 5,
      osot_ot_grad_year: 45,
      osot_ot_country: 1,
      osot_ot_other: 'Additional certification in Hand Therapy',
    },
  })
  @ValidateNested()
  @Type(() => CreateOtEducationForAccountDto)
  @IsOptional()
  otEducation?: CreateOtEducationForAccountDto;

  // ========================================
  // OTA EDUCATION DATA (Conditional)
  // ========================================
  @ApiProperty({
    description: 'OTA Education data (required if educationType is "ota")',
    type: CreateOtaEducationForAccountDto,
    required: false,
    example: {
      'osot_Table_Account@odata.bind': '',
      osot_work_declaration: true,
      osot_ota_degree_type: 1,
      osot_ota_college: 2,
      osot_ota_grad_year: 45,
      osot_ota_country: 1,
      osot_ota_other: 'Additional OTA certification in Mental Health',
    },
  })
  @ValidateNested()
  @Type(() => CreateOtaEducationForAccountDto)
  @IsOptional()
  otaEducation?: CreateOtaEducationForAccountDto;

  // ========================================
  // MANAGEMENT DATA (Optional - has defaults)
  // ========================================
  @ApiProperty({
    description:
      'Management data (optional - will use defaults if not provided)',
    type: CreateManagementForAccountDto,
    required: false,
    example: {
      'osot_Table_Account@odata.bind': '',
      osot_life_member_retired: false,
      osot_shadowing: false,
      osot_passed_away: false,
      osot_vendor: false,
      osot_advertising: false,
      osot_recruitment: false,
      osot_driver_rehab: false,
    },
  })
  @ValidateNested()
  @Type(() => CreateManagementForAccountDto)
  @IsOptional()
  management?: CreateManagementForAccountDto;
}

/**
 * Helper type to get the appropriate education DTO based on type
 */
export type EducationDto<T extends 'ot' | 'ota'> = T extends 'ot'
  ? CreateOtEducationForAccountDto
  : CreateOtaEducationForAccountDto;

/**
 * Usage example:
 *
 * ```typescript
 * const registrationData: CompleteUserRegistrationDto = {
 *   account: {
 *     osot_first_name: 'Any',
 *     osot_last_name: 'Doe',
 *     osot_date_of_birth: '1990-12-25',
 *     osot_mobile_phone: '(555) 123-4567',
 *     osot_email: 'b.alencar.amaral@gmail.com',
 *     osot_password: 'P@ssw0rd!',
 *     osot_account_group: 1,
 *     osot_account_declaration: true,
 *   },
 *   address: {
 *     'osot_Table_Account@odata.bind': '',
 *     osot_address_1: '123 Main Street',
 *     osot_address_2: 'Suite 100',
 *     osot_city: 380,
 *     osot_province: 1,
 *     osot_postal_code: 'K1A 0A6',
 *     osot_country: 1,
 *     osot_address_type: 1,
 *     osot_address_preference: [1, 2],
 *     osot_other_city: 'Other City Name',
 *     osot_other_province_state: 'Other Province/State',
 *   },
 *   contact: {
 *     'osot_Table_Account@odata.bind': '',
 *     osot_secondary_email: 'secondary@example.com',
 *     osot_job_title: 'Senior Developer',
 *     osot_home_phone: '4165551234',
 *     osot_work_phone: '4165559876',
 *     osot_business_website: 'https://example.com',
 *     osot_facebook: 'https://facebook.com/johndoe',
 *     osot_instagram: 'https://instagram.com/johndoe',
 *     osot_tiktok: 'https://tiktok.com/@johndoe',
 *     osot_linkedin: 'https://linkedin.com/in/johndoe',
 *   },
 *   identity: {
 *     'osot_Table_Account@odata.bind': '',
 *     osot_chosen_name: 'Alex',
 *     osot_language: [13, 18],
 *     osot_gender: 9,
 *     osot_race: 1,
 *     osot_indigenous: true,
 *     osot_indigenous_detail: 0,
 *     osot_indigenous_detail_other: 'Mohawk Nation',
 *     osot_disability: false,
 *   },
 *   educationType: 'ot',
 *   otEducation: {
 *     'osot_Table_Account@odata.bind': '',
 *     osot_coto_status: 4,
 *     osot_coto_registration: 'AB123456',
 *     osot_ot_degree_type: 3,
 *     osot_ot_university: 5,
 *     osot_ot_grad_year: 45,
 *     osot_ot_country: 1,
 *     osot_ot_other: 'Additional certification in Hand Therapy',
 *   },
 *   // otaEducation would be undefined when educationType is 'ot'
 *   management: {
 *     'osot_Table_Account@odata.bind': '',
 *     osot_life_member_retired: false,
 *     osot_shadowing: false,
 *     osot_passed_away: false,
 *     osot_vendor: false,
 *     osot_advertising: false,
 *     osot_recruitment: false,
 *     osot_driver_rehab: false,
 *   },
 * };
 * ```
 */
