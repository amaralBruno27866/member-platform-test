/**
 * Additional Insured Validators & Business Rules Architecture
 *
 * ## Validation Strategy
 *
 * Additional Insured validation is split into two layers:
 *
 * ### Layer 1: DTO Validators (Fast, No Database)
 * Location: `dtos/additional-insured-*.dto.ts`
 *
 * Decorators used:
 * - `@IsString` - Field type validation
 * - `@IsNotEmpty` - Required field validation
 * - `@MinLength / @MaxLength` - String length validation
 * - `@Matches` - Pattern validation (postal code Canadian format: A#A#A#)
 * - `@IsOptional` - Optional field handling
 *
 * Example (from DTO):
 * ```typescript
 * @IsString()
 * @MinLength(3)
 * @MaxLength(255)
 * @Matches(/^[a-zA-Z0-9\s\-&.,()]+$/)
 * osot_company_name: string;
 * ```
 *
 * ### Layer 2: Business Rules Validation (Slower, Database Access)
 * Location: `services/additional-insured-business-rules.service.ts`
 *
 * Complex validations requiring database lookups:
 * 1. **Company Name Uniqueness**
 *    - Constraint: Company name must be unique per insurance
 *    - Rule: Cannot have two additional insureds with same name under same insurance
 *    - Implementation: Repository.existsByCompanyName(companyName, insuranceGuid)
 *    - Error: BUSINESS_RULE_VIOLATION
 *
 * 2. **Insurance Validation**
 *    - Type Constraint: Insurance MUST be type GENERAL (Commercial)
 *    - Status Constraint: Insurance MUST be ACTIVE
 *    - Validation: InsuranceLookupService.findById(insuranceGuid)
 *    - Error: BUSINESS_RULE_VIOLATION
 *
 * 3. **Permission Validation**
 *    - Owner: Can only create for own insurances (where owner = user)
 *    - Admin: Can create for any insurance in organization
 *    - Main: Full access
 *    - Implementation: Checked via userRole and insurance.ownerid
 *    - Error: PERMISSION_DENIED
 *
 * 4. **Organization Validation**
 *    - Constraint: User and Insurance must belong to same organization
 *    - Inherited: Organization comes from parent Insurance
 *    - Implementation: Automatic via Insurance.organizationGuid
 *
 * ## Custom Validators Not Needed
 *
 * Considered but not implemented (all handled better elsewhere):
 * - IsValidCanadianPostalCode: Already covered by @Matches with regex
 * - IsValidInsuranceForAdditionalInsured: Requires DB (belongs in business rules)
 * - IsUniqueCompanyName: Requires DB (belongs in business rules)
 *
 * Decision: Keep validators simple, move complex logic to business rules service
 *
 * ## Example: Create Additional Insured Flow
 *
 * ```
 * 1. API Request arrives
 *    POST /private/additional-insureds
 *    Body: { insuranceGuid, osot_company_name, osot_address, osot_city, ... }
 *
 * 2. NestJS validates DTO (Layer 1)
 *    - Checks: company_name is string 3-255 chars
 *    - Checks: postal_code matches Canadian format
 *    - Checks: insuranceGuid is string
 *    - Status: ✓ DTO validation passed or ✗ Validation error returned
 *
 * 3. Controller receives validated DTO
 *    - Extracts user context from JWT
 *    - Calls AdditionalInsuredCrudService.create(dto, organizationGuid, userRole)
 *
 * 4. CRUD Service calls Business Rules (Layer 2)
 *    validation = await businessRulesService.validateForCreation(
 *      dto,
 *      organizationGuid,
 *      userRole
 *    )
 *
 * 5. Business Rules validates complex logic
 *    - Checks: Insurance exists
 *    - Checks: Insurance.type === GENERAL
 *    - Checks: Insurance.status === ACTIVE
 *    - Checks: Company name unique per insurance
 *    - Checks: User has permission (OWNER/ADMIN/MAIN)
 *    - Checks: Organization matches
 *    - Status: ✓ All validations passed or ✗ Business rule violation error
 *
 * 6. If business rules pass:
 *    - Mapper converts DTO → Internal
 *    - Repository creates record in Dataverse
 *    - Events published (AdditionalInsuredCreated)
 *    - Response returned to client
 * ```
 *
 * ## Error Response Examples
 *
 * Validation Error (Layer 1 - DTO):
 * ```json
 * {
 *   "error": "Bad Request",
 *   "message": ["Company name must be at least 3 characters"],
 *   "statusCode": 400
 * }
 * ```
 *
 * Business Rule Violation (Layer 2):
 * ```json
 * {
 *   "error": "Business Rule Violation",
 *   "message": "An additional insured with this company name already exists for this insurance",
 *   "code": "BUSINESS_RULE_VIOLATION",
 *   "operationId": "create_additional_insured_1706525400123"
 * }
 * ```
 *
 * Permission Denied (Layer 2):
 * ```json
 * {
 *   "error": "Permission Denied",
 *   "message": "You do not have permission to manage additional insureds for this insurance",
 *   "code": "PERMISSION_DENIED",
 *   "operationId": "create_additional_insured_1706525400123"
 * }
 * ```
 */

/**
 * Validators Index
 *
 * Currently no custom validators needed.
 * All format validation done in DTOs with built-in decorators.
 * All business logic validation done in business rules service.
 */
export {};
