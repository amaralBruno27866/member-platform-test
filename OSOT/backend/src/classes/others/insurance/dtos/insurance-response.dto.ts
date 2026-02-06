/**
 * Insurance Response DTO
 *
 * Data Transfer Object for Insurance responses.
 * Returned by all endpoints (create, read, update, list).
 *
 * Architecture Notes:
 * - Includes all fields (system + business)
 * - No validation decorators (read-only response)
 * - Dates as ISO 8601 strings (frontend compatibility)
 * - Currency fields as numbers (2 decimal precision)
 * - InsuranceStatus enum for type safety
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessModifier, Privilege } from '../../../../common/enums';
import { InsuranceStatus } from '../enum/insurance-status.enum';

/**
 * Response DTO for Insurance entity
 */
export class InsuranceResponseDto {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  @ApiProperty({
    description: 'Insurance GUID (primary key)',
    example: 'abc-123-def-456-ghi',
    format: 'uuid',
  })
  osot_table_insuranceid: string;

  @ApiPropertyOptional({
    description:
      'Insurance autonumber ID (human-readable). Example: osot-ins-0000001',
    example: 'osot-ins-0000001',
  })
  osot_insuranceid?: string;

  @ApiPropertyOptional({
    description: 'Organization GUID (multi-tenant isolation)',
    example: 'org-guid-123',
    format: 'uuid',
  })
  organizationGuid?: string;

  @ApiPropertyOptional({
    description: 'Order GUID (parent order that triggered insurance)',
    example: 'order-guid-456',
    format: 'uuid',
  })
  orderGuid?: string;

  @ApiPropertyOptional({
    description: 'Account/User GUID (insured person)',
    example: 'account-guid-789',
    format: 'uuid',
  })
  accountGuid?: string;

  @ApiPropertyOptional({
    description: 'Record creation timestamp (ISO 8601)',
    example: '2026-01-23T10:30:00Z',
    format: 'date-time',
  })
  createdon?: string;

  @ApiPropertyOptional({
    description: 'Last modification timestamp (ISO 8601)',
    example: '2026-01-23T15:45:00Z',
    format: 'date-time',
  })
  modifiedon?: string;

  // ========================================
  // SNAPSHOT FIELDS FROM ACCOUNT/ADDRESS (14 required - IMMUTABLE)
  // ========================================

  @ApiProperty({
    description:
      'Account group classification (copied from table_account). Immutable snapshot.',
    example: 'Individual',
  })
  osot_account_group: string;

  @ApiProperty({
    description:
      'Professional category (copied from membership_category). Immutable snapshot.',
    example: 'OT',
  })
  osot_category: string;

  @ApiProperty({
    description:
      'Membership type (copied from membership_category). Immutable snapshot.',
    example: 'Standard',
  })
  osot_membership: string;

  @ApiProperty({
    description:
      'Certificate ID (copied from table_account.account_id). Immutable snapshot.',
    example: 'osot-acc-0000123',
  })
  osot_certificate: string;

  @ApiProperty({
    description:
      'First name of insured person (copied from table_account). Immutable snapshot.',
    example: 'John',
  })
  osot_first_name: string;

  @ApiProperty({
    description:
      'Last name of insured person (copied from table_account). Immutable snapshot.',
    example: 'Smith',
  })
  osot_last_name: string;

  @ApiPropertyOptional({
    description:
      'Business/corporation name if applicable (optional). Immutable snapshot.',
    example: 'John Smith Occupational Therapy Inc.',
  })
  osot_personal_corporation?: string;

  @ApiProperty({
    description:
      'Address line 1 (copied from table_address). Immutable snapshot.',
    example: '123 Main Street',
  })
  osot_address_1: string;

  @ApiPropertyOptional({
    description: 'Address line 2 (optional). Immutable snapshot.',
    example: 'Suite 450',
  })
  osot_address_2?: string;

  @ApiProperty({
    description: 'City (copied from table_address). Immutable snapshot.',
    example: 'Ottawa',
  })
  osot_city: string;

  @ApiProperty({
    description:
      'Province code (copied from table_address). Immutable snapshot.',
    example: 'ON',
  })
  osot_province: string;

  @ApiProperty({
    description:
      'Postal code without formatting (copied from table_address). Immutable snapshot.',
    example: 'K1A0A6',
  })
  osot_postal_code: string;

  @ApiProperty({
    description:
      'Contact phone number (copied from table_account). Immutable snapshot.',
    example: '6135551234',
  })
  osot_phone_number: string;

  @ApiProperty({
    description:
      'Contact email address (copied from table_account). Immutable snapshot.',
    example: 'john.smith@example.com',
  })
  osot_email: string;

  // ========================================
  // INSURANCE DETAILS (6 required - IMMUTABLE EXCEPT STATUS)
  // ========================================

  @ApiProperty({
    description:
      'Insurance type/product name (copied from product). Immutable snapshot.',
    example: 'Professional Liability',
  })
  osot_insurance_type: string;

  @ApiProperty({
    description:
      'Insurance coverage limit in CAD (copied from product). Immutable snapshot.',
    example: 50000.0,
  })
  osot_insurance_limit: number;

  @ApiProperty({
    description:
      'Insurance premium/price in CAD (copied from product). Immutable snapshot.',
    example: 79.0,
  })
  osot_insurance_price: number;

  @ApiProperty({
    description:
      'Total amount including tax in CAD (copied from order_product). Immutable snapshot.',
    example: 89.27,
  })
  osot_total: number;

  @ApiProperty({
    description:
      'Insurance status. DRAFT (1), PENDING (2), ACTIVE (3), EXPIRED (4), CANCELLED (5). Mutable for lifecycle management.',
    enum: InsuranceStatus,
    example: InsuranceStatus.ACTIVE,
  })
  osot_insurance_status: InsuranceStatus;

  @ApiProperty({
    description:
      'Insurance declaration. User declares all information is true and complete.',
    example: true,
  })
  osot_insurance_declaration: boolean;

  // ========================================
  // DATE FIELDS (2 required, 1 optional - IMMUTABLE)
  // ========================================

  @ApiProperty({
    description:
      'Effective date when coverage starts (ISO 8601 date). Immutable snapshot.',
    example: '2026-01-23',
    format: 'date',
  })
  osot_effective_date: string;

  @ApiProperty({
    description:
      'Expiry date when coverage ends (ISO 8601 date). Immutable snapshot.',
    example: '2026-12-31',
    format: 'date',
  })
  osot_expires_date: string;

  @ApiPropertyOptional({
    description:
      'Endorsement effective date when amendment takes effect (ISO 8601 date). Optional. Immutable after set.',
    example: '2026-06-15',
    format: 'date',
  })
  osot_endorsement_effective_date?: string;

  // ========================================
  // QUESTIONS & ENDORSEMENTS (6 optional - IMMUTABLE)
  // ========================================

  @ApiPropertyOptional({
    description:
      'Question 1: Allegations of professional negligence. High-risk question.',
    example: false,
  })
  osot_insurance_question_1?: boolean;

  @ApiPropertyOptional({
    description:
      'Explanation for question 1 (required if question_1 = true). Max 4000 characters.',
    example: 'No allegations have been made.',
  })
  osot_insurance_question_1_explain?: string;

  @ApiPropertyOptional({
    description:
      'Question 2: Insurer cancellation/denial history. High-risk question.',
    example: false,
  })
  osot_insurance_question_2?: boolean;

  @ApiPropertyOptional({
    description:
      'Explanation for question 2 (required if question_2 = true). Max 4000 characters.',
    example: 'No prior cancellations.',
  })
  osot_insurance_question_2_explain?: string;

  @ApiPropertyOptional({
    description:
      'Question 3: Awareness of potential claims. High-risk question.',
    example: false,
  })
  osot_insurance_question_3?: boolean;

  @ApiPropertyOptional({
    description:
      'Explanation for question 3 (required if question_3 = true). Max 4000 characters.',
    example: 'Not aware of any potential claims.',
  })
  osot_insurance_question_3_explain?: string;

  @ApiPropertyOptional({
    description:
      'Endorsement description (admin-only policy amendment). Max 4000 characters. Immutable after effective date.',
    example: 'Coverage extended to include additional premises.',
  })
  osot_endorsement_description?: string;

  // ========================================
  // ACCESS CONTROL (2 optional)
  // ========================================

  @ApiPropertyOptional({
    description: 'Privilege level (visibility). Defaults to Owner.',
    enum: Privilege,
    example: Privilege.OWNER,
  })
  osot_privilege?: Privilege;

  @ApiPropertyOptional({
    description: 'Access modifier (access rules). Defaults to Private.',
    enum: AccessModifier,
    example: AccessModifier.PRIVATE,
  })
  osot_access_modifiers?: AccessModifier;
}
