/**
 * Insurance Report Item DTO
 *
 * Single insurance record included in a 24-hour report.
 * Used in both admin approval email and provider JSON payload.
 *
 * @file insurance-report-item.dto.ts
 * @module InsuranceModule
 * @layer DTOs
 */

import { ApiProperty } from '@nestjs/swagger';

export class InsuranceReportItemDto {
  @ApiProperty({
    description: 'Insurance GUID (unique identifier)',
    example: 'abc-123-def-456',
    format: 'uuid',
  })
  osot_table_insuranceid: string;

  @ApiProperty({
    description: 'Insurance number (human-readable autonumber)',
    example: 'osot-ins-0000001',
  })
  osot_insuranceid: string;

  @ApiProperty({
    description: 'Sponsoring entity (organization name)',
    example: 'OSOT - Ontario Society of Occupational Therapists',
  })
  sponsoring_entity: string;

  @ApiProperty({
    description: 'Order ID associated with this insurance',
    example: 'order-guid-123',
  })
  osot_table_order: string;

  @ApiProperty({
    description: 'User ID (insured person)',
    example: 'user-guid-456',
  })
  osot_table_account: string;

  @ApiProperty({
    description: 'Account group from the account record',
    example: 'Therapist',
  })
  osot_account_group: string;

  @ApiProperty({
    description: 'Category of membership',
    example: 'Professional',
  })
  osot_category: string;

  @ApiProperty({
    description: 'Membership type',
    example: 'Full Member',
  })
  osot_membership: string;

  @ApiProperty({
    description: 'Academic year for this insurance',
    example: '2026',
  })
  osot_membership_year: string;

  @ApiProperty({
    description: 'Certificate ID of insured person',
    example: 'CERT-2026-001',
  })
  osot_certificate: string;

  @ApiProperty({
    description: 'First name of insured',
    example: 'João',
  })
  osot_first_name: string;

  @ApiProperty({
    description: 'Last name of insured',
    example: 'Silva',
  })
  osot_last_name: string;

  @ApiProperty({
    description: 'Email of insured',
    example: 'joao@example.com',
  })
  osot_email: string;

  @ApiProperty({
    description: 'Phone number of insured',
    example: '(416) 555-1234',
  })
  osot_phone_number: string;

  @ApiProperty({
    description: 'Whether insured is a personal or corporate entity',
    example: 'Personal',
  })
  osot_personal_corporation: string;

  @ApiProperty({
    description: 'First address line',
    example: '123 Main Street',
  })
  osot_address_1: string;

  @ApiProperty({
    description: 'Second address line (optional)',
    example: 'Suite 100',
    required: false,
  })
  osot_address_2?: string;

  @ApiProperty({
    description: 'City of residence',
    example: 'Toronto',
  })
  osot_city: string;

  @ApiProperty({
    description: 'Province of residence',
    example: 'Ontario',
  })
  osot_province: string;

  @ApiProperty({
    description: 'Postal code',
    example: 'M5V 3A8',
  })
  osot_postal_code: string;

  @ApiProperty({
    description:
      'Insurance Question 1: Any allegations of professional negligence?',
    example: false,
    type: 'boolean',
  })
  osot_insurance_question_1: boolean;

  @ApiProperty({
    description: 'Explanation for Insurance Question 1',
    example: 'None',
    required: false,
  })
  osot_insurance_question_1_explain?: string;

  @ApiProperty({
    description:
      'Insurance Question 2: Has any insurer declined or cancelled coverage?',
    example: false,
    type: 'boolean',
  })
  osot_insurance_question_2: boolean;

  @ApiProperty({
    description: 'Explanation for Insurance Question 2',
    example: 'None',
    required: false,
  })
  osot_insurance_question_2_explain?: string;

  @ApiProperty({
    description:
      'Insurance Question 3: Aware of any facts that may give rise to a claim?',
    example: false,
    type: 'boolean',
  })
  osot_insurance_question_3: boolean;

  @ApiProperty({
    description: 'Explanation for Insurance Question 3',
    example: 'None',
    required: false,
  })
  osot_insurance_question_3_explain?: string;

  @ApiProperty({
    description: 'Insurance declaration: Affirm all statements are true',
    example: true,
    type: 'boolean',
  })
  osot_insurance_declaration: boolean;

  @ApiProperty({
    description: 'Date coverage becomes effective (ISO 8601)',
    example: '2026-01-29T00:00:00Z',
    format: 'date-time',
  })
  osot_effective_date: string;

  @ApiProperty({
    description: 'Date coverage expires (ISO 8601)',
    example: '2027-01-29T00:00:00Z',
    format: 'date-time',
  })
  osot_expires_date: string;

  @ApiProperty({
    description: 'Type of insurance coverage',
    example: 'Professional Liability',
  })
  osot_insurance_type: string;

  @ApiProperty({
    description: 'Insurance coverage limit (CAD)',
    example: 2000000,
    type: 'number',
  })
  osot_insurance_limit: number;

  @ApiProperty({
    description: 'Insurance premium amount (CAD)',
    example: 79.0,
    type: 'number',
  })
  osot_insurance_price: number;

  @ApiProperty({
    description: 'Total amount including taxes (CAD)',
    example: 89.27,
    type: 'number',
  })
  osot_total: number;

  @ApiProperty({
    description:
      'Insurance status (DRAFT, PENDING, ACTIVE, EXPIRED, CANCELLED)',
    example: 'ACTIVE',
  })
  osot_insurance_status: string;

  @ApiProperty({
    description: 'Insurance status display name (for UI rendering)',
    example: 'Active',
  })
  osot_insurance_status_display?: string;
}
