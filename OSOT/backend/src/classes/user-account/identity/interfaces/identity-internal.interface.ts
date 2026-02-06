import { Language } from '../../../../common/enums/language-choice.enum';
import { Gender } from '../../../../common/enums/gender-choice.enum';
import { Race } from '../../../../common/enums/race-choice.enum';
import { IndigenousDetail } from '../../../../common/enums/indigenous-detail.enum';
import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';

/**
 * Internal identity shape used inside the application and orchestrator.
 *
 * This interface includes internal identifiers (for example `osot_table_identityid`)
 * and sensitive fields like `osot_privilege` that must NOT be exposed directly
 * to end users. Public responses should use the DTOs in `../dtos` and the mappers
 * in `../mappers` to strip/hide these internal fields.
 *
 * SECURITY WARNING: Never expose this interface or its fields in public APIs.
 */
export interface IdentityInternal {
  // === SYSTEM FIELDS ===
  osot_table_identityid?: string; // internal GUID used to relate rows in Dataverse
  osot_identity_id?: string; // public business id (auto-generated: osot-id-0000001)
  ownerid?: string; // system owner id (managed by Dataverse)
  createdon?: string; // system creation timestamp
  modifiedon?: string; // system modification timestamp

  // === ACCOUNT RELATIONSHIP ===
  osot_table_account?: string; // lookup to Account table (required relationship)

  // === IDENTITY DATA ===
  osot_user_business_id?: string; // business required - unique business identifier
  osot_chosen_name?: string; // optional - preferred name different from legal name

  // === PERSONAL CHARACTERISTICS (Choice fields) ===
  osot_language?: Language[] | string; // business required - multiple choice (internal: array, Dataverse: string)
  osot_other_language?: string; // optional - other language not in predefined list
  osot_gender?: Gender; // optional - gender identity
  osot_race?: Race; // optional - racial identity

  // === CULTURAL IDENTITY ===
  osot_indigenous?: boolean; // optional - Indigenous identity (Yes/No field)
  osot_indigenous_detail?: IndigenousDetail; // optional - specific Indigenous identity
  osot_indigenous_detail_other?: string; // optional - other Indigenous identity description

  // === ACCESSIBILITY ===
  osot_disability?: boolean; // optional - disability status (Yes/No field)

  // === PRIVACY & PERMISSIONS ===
  osot_access_modifiers?: AccessModifier; // optional, default: PRIVATE - controls visibility
  osot_privilege?: Privilege; // INTERNAL ONLY - determines Dataverse app access

  // any other fields returned by Dataverse may be included here
  [key: string]: unknown;
}

/**
 * Usage notes:
 * - Services/repositories and the orchestrator may return/accept IdentityInternal.
 * - Controllers MUST use mappers to convert to public DTOs before returning responses.
 * - Language field uses array internally but stores as comma-separated string in Dataverse.
 * - Never expose osot_table_identityid, osot_privilege, or other sensitive internal fields.
 * - Indigenous and disability fields support optional self-identification.
 * - Cultural identity fields (race, indigenous) are optional and respect user privacy choices.
 *
 * @example Language field handling:
 * ```ts
 * // Internal representation (for business logic)
 * const identity: IdentityInternal = {
 *   osot_language: [13, 18], // English + French
 * };
 *
 * // Dataverse storage format
 * const dataverseFormat = {
 *   osot_language: "13,18", // Comma-separated string
 * };
 * ```
 */
