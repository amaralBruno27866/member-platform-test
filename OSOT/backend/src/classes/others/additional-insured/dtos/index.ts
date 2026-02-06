/**
 * Additional Insured DTOs - Central Export
 *
 * Centralized export point for all Additional Insured DTOs.
 *
 * Usage:
 * import {
 *   AdditionalInsuredBasicDto,
 *   CreateAdditionalInsuredDto,
 *   UpdateAdditionalInsuredDto,
 *   AdditionalInsuredResponseDto,
 * } from '@/classes/others/additional-insured/dtos';
 */

export { AdditionalInsuredBasicDto } from './additional-insured-basic.dto';
export {
  CreateAdditionalInsuredDto,
  CreateAdditionalInsuredRequest,
} from './create-additional-insured.dto';
export {
  UpdateAdditionalInsuredDto,
  UpdateAdditionalInsuredRequest,
} from './update-additional-insured.dto';
export {
  AdditionalInsuredResponseDto,
  AdditionalInsuredListResponse,
  AdditionalInsuredDetailResponse,
  AdditionalInsuredCreateResponse,
} from './additional-insured-response.dto';
