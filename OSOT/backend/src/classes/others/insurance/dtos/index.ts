/**
 * Insurance DTOs
 *
 * Barrel export for all insurance Data Transfer Objects:
 * - InsuranceBasicDto: Base DTO with shared fields
 * - CreateInsuranceDto: Create new insurance certificate
 * - UpdateInsuranceDto: Update existing insurance (limited fields)
 * - InsuranceResponseDto: API response DTO
 *
 * Usage:
 * import {
 *   CreateInsuranceDto,
 *   UpdateInsuranceDto,
 *   InsuranceResponseDto,
 * } from '@/classes/others/insurance/dtos';
 */

export * from './insurance-basic.dto';
export * from './create-insurance.dto';
export * from './update-insurance.dto';
export * from './insurance-response.dto';
