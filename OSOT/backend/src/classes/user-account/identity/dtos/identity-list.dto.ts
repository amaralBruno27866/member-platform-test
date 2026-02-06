import { ApiProperty } from '@nestjs/swagger';
import {
  Language,
  Gender,
  Race,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

/**
 * Identity List DTO for returning summarized identity data in list operations.
 * Contains essential identity fields for list views and search results.
 * Used for GET operations that return multiple identity records.
 *
 * Key characteristics:
 * - Lightweight subset of identity information for performance
 * - Excludes detailed cultural/personal information for privacy
 * - Includes key identifiers and basic display information
 * - Optimized for list rendering and search result display
 * - Respects privacy settings with minimal data exposure
 */
export class IdentityListDto {
  @ApiProperty({
    example: 'osot-id-0000001',
    description: 'Identity autonumber ID',
  })
  osot_identity_id: string;

  @ApiProperty({
    example: 'c3f4a5b6-7d8e-9f0a-1b2c-3d4e5f6a7b8c',
    description: 'Unique identifier for entity instances',
  })
  osot_table_identityid: string;

  @ApiProperty({
    example: 'osot-id-0000001',
    description: 'User business identifier',
  })
  osot_user_business_id: string;

  @ApiProperty({
    example: 'Alex',
    description: 'Preferred or chosen name for display',
    required: false,
  })
  osot_chosen_name?: string;

  @ApiProperty({
    example: [Language.ENGLISH],
    description: 'Primary language preference',
    isArray: true,
    enum: Language,
  })
  osot_language: Language[];

  @ApiProperty({
    example: Gender.PREFER_NOT_TO_DISCLOSE,
    description: 'Gender identity (if sharing permitted)',
    enum: Gender,
    required: false,
  })
  osot_gender?: Gender;

  @ApiProperty({
    example: Race.OTHER,
    description: 'Racial identity (if sharing permitted)',
    enum: Race,
    required: false,
  })
  osot_race?: Race;

  @ApiProperty({
    example: AccessModifier.PRIVATE,
    description: 'Privacy/visibility preferences',
    enum: AccessModifier,
  })
  osot_access_modifiers: AccessModifier;

  @ApiProperty({
    example: Privilege.OWNER,
    description: 'User privilege level',
    enum: Privilege,
    required: false,
  })
  osot_privilege?: Privilege;

  @ApiProperty({
    example: 'c1f4a5b6-7d8e-9f0a-1b2c-3d4e5f6a7b8c',
    description: 'Related account identifier (if linked)',
    required: false,
  })
  osot_table_account?: string;

  @ApiProperty({
    example: 'c5f4a5b6-7d8e-9f0a-1b2c-3d4e5f6a7b8c',
    description: 'Owner identifier',
  })
  ownerid: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Identity record creation date',
  })
  createdon: string;

  @ApiProperty({
    example: '2024-01-20T14:45:00Z',
    description: 'Identity record last modification date',
    required: false,
  })
  modifiedon?: string;
}

/**
 * Usage notes:
 * - This DTO provides minimal identity information for list views
 * - Cultural/personal details are included only if privacy settings allow
 * - Privilege level and account relationships shown when available
 * - Access modifiers determine what information is actually displayed
 * - Optimized for performance in list operations and search results
 * - Indigenous identity details are omitted for privacy in list view
 * - Disability information is not included in list view for privacy
 * - Created/modified dates help with record management and sorting
 */
