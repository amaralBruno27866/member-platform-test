/**
 * Class: ResponseTableAccountDto
 * Objective: Structure the response for a found user account, omitting sensitive fields.
 * Functionality: Returns all non-sensitive fields from the found table (e.g., Table_Account),
 *   excluding privilege, password, and access control information.
 * Expected Result: The frontend receives only safe, relevant user data for display or session use.
 *
 * Note: This DTO should be extended or composed for other account tables as needed.
 */

import { ApiProperty } from '@nestjs/swagger';
import { AccountGroup } from '../../common/enums/account-group.enum';

export class ResponseTableAccountDto {
  @ApiProperty({
    example: 'osot000123',
    description: 'The unique account ID (autonumber).',
  })
  osot_account_id: string;

  @ApiProperty({ example: 'Susan', description: 'The first name of the user.' })
  osot_first_name: string;

  @ApiProperty({
    example: 'Douglas',
    description: 'The last name of the user.',
  })
  osot_last_name: string;

  @ApiProperty({
    example: '1990-01-01',
    description: "The user's date of birth (ISO format).",
  })
  osot_date_of_birth: string;

  @ApiProperty({
    example: '+1-555-123-4567',
    description: "The user's mobile phone number.",
  })
  osot_mobile_phone: string;

  @ApiProperty({
    example: 'user@email.com',
    description: "The user's email address.",
  })
  osot_email: string;

  @ApiProperty({
    enum: AccountGroup,
    description: 'Account group classification.',
  })
  osot_account_group: AccountGroup;
}
