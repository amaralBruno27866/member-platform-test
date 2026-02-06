import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for Membership Category
 * Used for API responses, includes all fields including system fields
 * Optimized for frontend consumption with proper formatting
 */
export class MembershipCategoryResponseDto {
  @ApiProperty({
    description: 'Business ID for internal control and pagination',
    example: 'osot-cat-0000001',
  })
  osot_category_id: string;

  @ApiProperty({
    description: 'System unique identifier for the membership category',
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  osot_table_membership_categoryid: string;

  @ApiProperty({
    description: 'Account ID (GUID) - Present if linked to an account',
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    required: false,
  })
  osot_table_account?: string;

  @ApiProperty({
    description:
      'Account Affiliate ID (GUID) - Present if linked to an affiliate',
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    required: false,
  })
  osot_table_account_affiliate?: string;

  @ApiProperty({
    description: 'Membership year',
    type: String,
    example: '2025',
  })
  osot_membership_year: string;

  @ApiProperty({
    description: 'Member eligibility status for accounts',
    example:
      'Living and working as an occupational therapist (clinical or non-clinical) in Ontario',
    required: false,
  })
  osot_eligibility?: string;

  @ApiProperty({
    description: 'Affiliate eligibility status for affiliates',
    example: 'Primary',
    required: false,
  })
  osot_eligibility_affiliate?: string;

  @ApiProperty({
    description: 'Membership category classification',
    example: 'OT - Practicing',
    required: false,
  })
  osot_membership_category?: string;

  @ApiProperty({
    description: 'Users Group classification (internal classification)',
    example: 'Occupational Therapist (includes retired/resigned)',
    required: false,
  })
  osot_users_group?: string;

  @ApiProperty({
    description: 'Parental leave start date (ISO format)',
    example: '2025-01-15',
    required: false,
  })
  osot_parental_leave_from?: string;

  @ApiProperty({
    description: 'Parental leave end date (ISO format)',
    example: '2025-12-15',
    required: false,
  })
  osot_parental_leave_to?: string;

  @ApiProperty({
    description: 'Expected parental leave duration',
    example: 'Full Year',
    required: false,
  })
  osot_parental_leave_expected?: string;

  @ApiProperty({
    description: 'Retirement start date (ISO format)',
    example: '2025-06-01',
    required: false,
  })
  osot_retirement_start?: string;

  @ApiProperty({
    description: 'Access modifier for the membership category',
    example: 'Private',
    required: false,
  })
  osot_access_modifiers?: string;

  @ApiProperty({
    description: 'Privilege level for the membership category',
    example: 'Owner',
    required: false,
  })
  osot_privilege?: string;

  // System fields
  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2025-01-15T10:30:00Z',
  })
  createdon: string;

  @ApiProperty({
    description: 'Record last modification timestamp',
    example: '2025-01-16T14:45:00Z',
  })
  modifiedon: string;

  @ApiProperty({
    description: 'Owner ID (GUID)',
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  ownerid: string;

  // Computed/Display fields for frontend
  @ApiProperty({
    description: 'User type indicator (Account or Affiliate)',
    example: 'Account',
  })
  userType: 'Account' | 'Affiliate';

  @ApiProperty({
    description: 'Human-readable membership year',
    example: '2025',
  })
  membershipYearDisplay: string;

  @ApiProperty({
    description: 'Human-readable category name',
    example: 'OT Practising',
    required: false,
  })
  categoryDisplay?: string;

  @ApiProperty({
    description: 'Human-readable eligibility status',
    example: 'Question 1',
    required: false,
  })
  eligibilityDisplay?: string;

  @ApiProperty({
    description: 'Status indicator based on category and dates',
    example: 'Active',
  })
  status: 'Active' | 'Retired' | 'On Leave' | 'Student' | 'Inactive';

  @ApiProperty({
    description: 'Indicates if parental leave is currently active',
    example: false,
  })
  isOnParentalLeave: boolean;

  @ApiProperty({
    description: 'Indicates if retirement is active',
    example: false,
  })
  isRetired: boolean;

  @ApiProperty({
    description: 'Days remaining in parental leave (if applicable)',
    example: 0,
    required: false,
  })
  parentalLeaveDaysRemaining?: number;
}
