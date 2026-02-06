import { Document } from 'mongoose';
import { AccountStatus } from '../enums/account-status.enum';
import { AccessModifier } from '../enums/access-modifier.enum';
import { Privilege } from '../enums/privilege.enum';
import { UserGroup } from '../enums/user-group.enum';

/**
 * Account Document Interface
 *
 * MongoDB representation of the Account entity.
 *
 * @file account-document.interface.ts
 * @module Account
 * @layer Interfaces
 */
export interface AccountDocument extends Document {
  /**
   * External user identifier (separate from Mongo _id).
   */
  user_id: string;

  /**
   * Legal first name.
   */
  first_name: string;

  /**
   * Legal last name.
   */
  last_name: string;

  /**
   * Primary email address.
   */
  email: string;

  /**
   * Optional phone number.
   */
  phone?: string;

  /**
   * Business group classification.
   */
  user_group: UserGroup;

  /**
   * Account lifecycle status.
   */
  account_status: AccountStatus;

  /**
   * Privilege level.
   */
  privilege: Privilege;

  /**
   * Data access modifier.
   */
  access_modifier: AccessModifier;

  /**
   * Hashed password.
   */
  password_hash: string;

  /**
   * Email verification flag.
   */
  is_email_verified: boolean;

  /**
   * Creation timestamp.
   */
  createdAt: Date;

  /**
   * Update timestamp.
   */
  updatedAt: Date;
}
