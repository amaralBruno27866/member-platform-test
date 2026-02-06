/**
 * Additional Insured Validators - Central Export
 *
 * Custom class-validator decorators for Additional Insured validation.
 *
 * IMPORTANT DISTINCTION:
 * - Validators (this folder): Simple format/structure validation using class-validator decorators
 * - Business Rules (services/additional-insured-business-rules.service.ts): Complex domain logic
 *   requiring database access
 *
 * VALIDATION LAYERS:
 * 1. **DTO Level** (Validators - early feedback, fast)
 *    - Format validation: Company name, address, postal code
 *    - Type/enum validation: City, province, privilege, access modifiers
 *    - Structure validation: All fields present/correct types
 *    - Custom validators: Insurance validity, company name uniqueness hints
 *
 * 2. **Business Rules Level** (services, slower but comprehensive)
 *    - Uniqueness: Company name must be unique per insurance
 *    - Relationship validation: Insurance exists, is GENERAL type, is ACTIVE status
 *    - Permission validation: User has access to parent insurance
 *    - Organization validation: User and insurance belong to same organization
 *    - Cascade rules: When parent insurance deleted, cascade delete additional insureds
 *
 * CUSTOM VALIDATORS:
 * - IsValidInsuranceForAdditionalInsured: GUID format check + guidance message
 * - IsUniqueCompanyNamePerInsurance: Format check + uniqueness guidance message
 *
 * Note: These validators check format only (cannot access database).
 * Actual validation happens in AdditionalInsuredBusinessRulesService.
 */

export { IsValidInsuranceForAdditionalInsured } from './is-valid-insurance-for-additional-insured.validator';
export { IsUniqueCompanyNamePerInsurance } from './is-unique-company-name-per-insurance.validator';
