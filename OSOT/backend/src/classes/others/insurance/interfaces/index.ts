/**
 * Insurance Interfaces
 *
 * Barrel export for all insurance interfaces:
 * - InsuranceDataverse: OData API representation
 * - InsuranceInternal: Internal application representation
 * - InsuranceRepository: Repository contract for data access
 * - INSURANCE_REPOSITORY: DI token for repository injection
 *
 * Usage:
 * import {
 *   InsuranceDataverse,
 *   InsuranceInternal,
 *   InsuranceRepository,
 *   INSURANCE_REPOSITORY,
 * } from '@/classes/others/insurance/interfaces';
 */

export * from './insurance-dataverse.interface';
export * from './insurance-internal.interface';
export * from './insurance-repository.interface';
