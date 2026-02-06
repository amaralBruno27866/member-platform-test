import { ApiProperty } from '@nestjs/swagger';
import {
  Category,
  AccessModifier,
  Privilege,
  UserGroup,
} from '../../../../common/enums';
import { ParentalLeaveExpected } from '../enums/parental-leave-expected.enum';

/**
 * List DTO for Membership Category
 * Optimized for listing operations with essential fields only
 * Used for paginated listings and search results
 */
export class MembershipCategoryListDto {
  @ApiProperty({
    description: 'Business ID for internal control and pagination',
    example: 'osot-cat-0000001',
  })
  osot_category_id: string;

  @ApiProperty({
    description: 'System unique identifier',
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  osot_table_membership_categoryid: string;

  @ApiProperty({
    description: 'Account ID if linked to account',
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    required: false,
  })
  osot_table_account?: string;

  @ApiProperty({
    description: 'Affiliate ID if linked to affiliate',
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
    description: 'Membership category',
    enum: Category,
    example: Category.OT_PR,
    required: false,
  })
  osot_membership_category?: Category;

  @ApiProperty({
    description: 'Users Group classification',
    enum: UserGroup,
    example: UserGroup.OT,
    required: false,
  })
  osot_users_group?: UserGroup;

  @ApiProperty({
    description: 'Expected parental leave duration',
    enum: ParentalLeaveExpected,
    example: ParentalLeaveExpected.FULL_YEAR,
    required: false,
  })
  osot_parental_leave_expected?: ParentalLeaveExpected;

  @ApiProperty({
    description: 'Access level',
    enum: AccessModifier,
    example: AccessModifier.PRIVATE,
    required: false,
  })
  osot_access_modifiers?: AccessModifier;

  @ApiProperty({
    description: 'User privilege level',
    enum: Privilege,
    example: Privilege.OWNER,
    required: false,
  })
  osot_privilege?: Privilege;

  @ApiProperty({
    description: 'Record creation date',
    example: '2025-01-15T10:30:00Z',
  })
  createdon: string;

  @ApiProperty({
    description: 'Last modification date',
    example: '2025-01-16T14:45:00Z',
  })
  modifiedon: string;

  // Computed display fields for listings
  @ApiProperty({
    description: 'User type for display',
    example: 'Account',
  })
  userType: 'Account' | 'Affiliate';

  @ApiProperty({
    description: 'Display-friendly membership year',
    example: '2025',
  })
  membershipYearDisplay: string;

  @ApiProperty({
    description: 'Display-friendly category name',
    example: 'OT Practising',
    required: false,
  })
  categoryDisplay?: string;

  @ApiProperty({
    description: 'Current status summary',
    example: 'Active',
  })
  status: 'Active' | 'Retired' | 'On Leave' | 'Student' | 'Inactive';

  @ApiProperty({
    description: 'Quick status indicators',
    example: {
      isActive: true,
      isRetired: false,
      isOnLeave: false,
    },
  })
  statusFlags: {
    isActive: boolean;
    isRetired: boolean;
    isOnLeave: boolean;
  };
}
