import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

// Entity DTOs for validation
import { CreateAccountDto } from '../../../user-account/account/dtos/create-account.dto';
import { AccountBusinessRulesService } from '../../../user-account/account/services/account-business-rules.service';
import { AffiliateLookupService } from '../../../user-account/affiliate/services/affiliate-lookup.service';
import { AffiliateBusinessRuleService } from '../../../user-account/affiliate/services/affiliate-business-rule.service';
import { CreateAddressForAccountDto } from '../../../user-account/address/dtos/create-address-for-account.dto';
import { CreateContactForAccountDto } from '../../../user-account/contact/dtos/create-contact-for-account.dto';
import { IdentityCreateDto } from '../../../user-account/identity/dtos/identity-create.dto';

// Orchestrator DTOs
import { OrchestratorRequestDto } from '../dtos/orchestrator-request.dto';
import { OrchestratorValidationResultDto } from '../dtos/orchestrator-validation-result.dto';

// Interfaces
import { IValidationResult } from '../interfaces/orchestrator.interfaces';

// Enums
import { OrchestratorValidationErrorType } from '../enums/orchestrator-validation-error-type.enum';

/**
 * Service responsible for all validation logic in the account registration orchestrator.
 * Combines entity-level validations with orchestrator-specific business rules.
 */
@Injectable()
export class OrchestratorValidationService {
  private readonly logger = new Logger(OrchestratorValidationService.name);

  constructor(
    @Inject(forwardRef(() => AccountBusinessRulesService))
    private readonly accountBusinessRulesService: AccountBusinessRulesService,
    private readonly affiliateLookupService: AffiliateLookupService,
    @Inject(forwardRef(() => AffiliateBusinessRuleService))
    private readonly affiliateBusinessRuleService: AffiliateBusinessRuleService,
  ) {}

  /**
   * Validates individual entity data using existing DTO validators
   */
  async validateEntityData(
    requestData: OrchestratorRequestDto,
  ): Promise<IValidationResult> {
    this.logger.debug('Starting entity data validation');

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate Account data
      if (requestData.accountData) {
        const accountDto = plainToClass(
          CreateAccountDto,
          requestData.accountData,
        );
        const accountErrors = await validate(accountDto);

        if (accountErrors.length > 0) {
          accountErrors.forEach((error) => {
            Object.values(error.constraints || {}).forEach((message) => {
              errors.push(`Account: ${message}`);
            });
          });
        }
      }

      // Validate Address data
      if (requestData.addressData) {
        const addressDto = plainToClass(
          CreateAddressForAccountDto,
          requestData.addressData,
        );
        const addressErrors = await validate(addressDto);

        if (addressErrors.length > 0) {
          this.logger.debug(
            `Address validation errors found: ${addressErrors.length}`,
          );
          addressErrors.forEach((error) => {
            this.logger.debug(
              `Address field '${error.property}' validation failed:`,
              error.constraints,
            );
            Object.values(error.constraints || {}).forEach((message) => {
              errors.push(`Address: ${message}`);
            });
          });
        }
      }

      // Validate Contact data
      if (requestData.contactData) {
        const contactDto = plainToClass(
          CreateContactForAccountDto,
          requestData.contactData,
        );
        const contactErrors = await validate(contactDto);

        if (contactErrors.length > 0) {
          contactErrors.forEach((error) => {
            Object.values(error.constraints || {}).forEach((message) => {
              errors.push(`Contact: ${message}`);
            });
          });
        }
      }

      // Validate Identity data
      if (requestData.identityData) {
        const identityDto = plainToClass(
          IdentityCreateDto,
          requestData.identityData,
        );
        const identityErrors = await validate(identityDto);

        if (identityErrors.length > 0) {
          identityErrors.forEach((error) => {
            Object.values(error.constraints || {}).forEach((message) => {
              errors.push(`Identity: ${message}`);
            });
          });
        }
      }

      this.logger.debug(
        `Entity validation completed. Found ${errors.length} errors`,
      );

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        errorType:
          errors.length > 0
            ? OrchestratorValidationErrorType.ENTITY_VALIDATION
            : undefined,
      };
    } catch (error) {
      this.logger.error('Error during entity validation', error);
      return {
        isValid: false,
        errors: ['Internal validation error occurred'],
        warnings: [],
        errorType: OrchestratorValidationErrorType.SYSTEM_ERROR,
      };
    }
  }

  /**
   * Validates cross-entity business rules and relationships
   */
  validateCrossEntityRules(
    requestData: OrchestratorRequestDto,
  ): IValidationResult {
    this.logger.debug('Starting cross-entity validation');

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate email consistency across entities
      if (requestData.accountData?.email && requestData.contactData?.email) {
        if (requestData.accountData.email !== requestData.contactData.email) {
          errors.push('Email addresses in account and contact data must match');
        }
      }

      // Validate name consistency
      if (
        requestData.accountData?.firstName &&
        requestData.identityData?.firstName
      ) {
        if (
          requestData.accountData.firstName !==
          requestData.identityData.firstName
        ) {
          warnings.push('First name differs between account and identity data');
        }
      }

      if (
        requestData.accountData?.lastName &&
        requestData.identityData?.lastName
      ) {
        if (
          requestData.accountData.lastName !== requestData.identityData.lastName
        ) {
          warnings.push('Last name differs between account and identity data');
        }
      }

      // Validate address requirements based on identity type
      if (requestData.identityData?.documentType && !requestData.addressData) {
        if (
          ['cpf', 'passport'].includes(
            requestData.identityData.documentType.toLowerCase(),
          )
        ) {
          errors.push(
            'Address information is required for the selected document type',
          );
        }
      }

      // Validate phone number format consistency
      if (requestData.contactData?.phone && requestData.addressData?.country) {
        // This would validate phone format based on country
        // Implementation would depend on your phone validation logic
        if (
          !this.validatePhoneForCountry(
            requestData.contactData.phone,
            requestData.addressData.country,
          )
        ) {
          warnings.push(
            'Phone number format may not be valid for the selected country',
          );
        }
      }

      this.logger.debug(
        `Cross-entity validation completed. Found ${errors.length} errors, ${warnings.length} warnings`,
      );

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        errorType:
          errors.length > 0
            ? OrchestratorValidationErrorType.CROSS_ENTITY_VALIDATION
            : undefined,
      };
    } catch (error) {
      this.logger.error('Error during cross-entity validation', error);
      return {
        isValid: false,
        errors: ['Error validating cross-entity relationships'],
        warnings: [],
        errorType: OrchestratorValidationErrorType.SYSTEM_ERROR,
      };
    }
  }

  /**
   * Validates orchestrator-specific business rules
   */
  validateBusinessRules(
    requestData: OrchestratorRequestDto,
  ): IValidationResult {
    this.logger.debug('Starting business rules validation');

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate minimum required data for registration
      if (!requestData.accountData) {
        errors.push('Account data is required for registration');
      }

      if (!requestData.contactData) {
        errors.push('Contact data is required for registration');
      }

      // Validate email domain restrictions (if any)
      if (requestData.accountData?.email) {
        const emailDomain = requestData.accountData.email.split('@')[1];
        if (this.isRestrictedDomain(emailDomain)) {
          errors.push(
            `Email domain '${emailDomain}' is not allowed for registration`,
          );
        }
      }

      // Validate age requirements (if birthDate is provided)
      if (requestData.identityData?.birthDate) {
        const age = this.calculateAge(
          new Date(requestData.identityData.birthDate),
        );
        if (age < 18) {
          errors.push('User must be at least 18 years old to register');
        }
        if (age > 120) {
          warnings.push(
            'Please verify the birth date - age seems unusually high',
          );
        }
      }

      // Validate duplicate prevention rules
      // Check email uniqueness and person uniqueness (firstName + lastName + dateOfBirth)
      if (requestData.accountData?.email) {
        // Note: This validation will be done asynchronously in validateAntiDuplicationRules
        // We add a placeholder here to ensure the validation is called
        // The actual validation happens in the async method below
      }

      this.logger.debug(
        `Business rules validation completed. Found ${errors.length} errors, ${warnings.length} warnings`,
      );

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        errorType:
          errors.length > 0
            ? OrchestratorValidationErrorType.BUSINESS_RULE_VALIDATION
            : undefined,
      };
    } catch (error) {
      this.logger.error('Error during business rules validation', error);
      return {
        isValid: false,
        errors: ['Error validating business rules'],
        warnings: [],
        errorType: OrchestratorValidationErrorType.SYSTEM_ERROR,
      };
    }
  }

  /**
   * Validates anti-duplication rules using AccountBusinessRulesService and AffiliateBusinessRuleService
   * This checks for:
   * 1. Email uniqueness in both Account and Affiliate tables
   * 2. Person uniqueness (firstName + lastName + dateOfBirth) in Account table
   * 3. Representative name uniqueness (firstName + lastName) in Affiliate table
   */
  async validateAntiDuplicationRules(
    requestData: OrchestratorRequestDto,
  ): Promise<IValidationResult> {
    this.logger.debug('Starting anti-duplication validation');
    console.log('🔍 [ANTI-DUPLICATION] Starting validation...');
    console.log('🔍 [ANTI-DUPLICATION] Email:', requestData.accountData?.email);
    console.log(
      '🔍 [ANTI-DUPLICATION] First Name:',
      requestData.accountData?.firstName,
    );
    console.log(
      '🔍 [ANTI-DUPLICATION] Last Name:',
      requestData.accountData?.lastName,
    );

    const errors: string[] = [];
    const warnings: string[] = [];
    let existingAccountEmail: string | undefined;

    try {
      // Validate email uniqueness in BOTH Account and Affiliate tables
      if (requestData.accountData?.email) {
        console.log(
          '✉️ [EMAIL CHECK] Validating email:',
          requestData.accountData.email,
        );

        // Check in Account table
        const emailValidation =
          await this.accountBusinessRulesService.validateEmailUniqueness(
            requestData.accountData.email,
            undefined, // No excludeAccountId for new registrations
            'main', // Use 'main' role for public registration validation (has full read access)
          );

        console.log('✉️ [EMAIL CHECK] Validation result:', emailValidation);

        if (!emailValidation.isValid) {
          existingAccountEmail = emailValidation.existingEmail ?? undefined; // Capture existing email
          const errorMsg =
            emailValidation.message ||
            'Email address is already registered in the Account system';
          console.log('❌ [EMAIL CHECK] Email is DUPLICATE:', errorMsg);
          console.log(
            '📧 [EMAIL CHECK] Existing account email:',
            existingAccountEmail,
          );
          errors.push(errorMsg);
        } else {
          console.log('✅ [EMAIL CHECK] Email is UNIQUE');
        }

        // Also check in Affiliate table
        try {
          const affiliateWithEmail =
            await this.affiliateLookupService.findByEmail(
              requestData.accountData.email,
            );

          if (affiliateWithEmail) {
            errors.push(
              'Email address is already registered in the Affiliate system',
            );
          }
        } catch (error) {
          this.logger.warn(
            `Failed to check email in Affiliate table: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          // Don't block registration if affiliate check fails
        }
      }

      // Validate person uniqueness (firstName + lastName + dateOfBirth) in Account table
      // Note: dateOfBirth can come from either account or identity data
      const firstName = requestData.accountData?.firstName;
      const lastName = requestData.accountData?.lastName;
      const birthDateFromIdentity = requestData.identityData?.birthDate;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const birthDateFromAccount =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (requestData.accountData as any)?.osot_date_of_birth;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const birthDate = birthDateFromIdentity || birthDateFromAccount;

      if (firstName && lastName && birthDate) {
        console.log('👤 [PERSON CHECK] Validating person uniqueness...');
        console.log('👤 [PERSON CHECK] First Name:', firstName);
        console.log('👤 [PERSON CHECK] Last Name:', lastName);
        console.log('👤 [PERSON CHECK] Birth Date:', birthDate);

        // Check in Account table (with dateOfBirth)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const birthDateString: string =
          typeof birthDate === 'string'
            ? birthDate
            : // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              birthDate.toISOString();

        console.log(
          '👤 [PERSON CHECK] Birth Date (formatted):',
          birthDateString,
        );

        const personValidation =
          await this.accountBusinessRulesService.validatePersonUniqueness(
            firstName,
            lastName,
            birthDateString,
            undefined, // No excludeAccountId for new registrations
            'main', // Use 'main' role for public registration validation (has full read access)
          );

        console.log('👤 [PERSON CHECK] Validation result:', personValidation);

        if (!personValidation.isValid) {
          existingAccountEmail = personValidation.existingEmail ?? undefined; // Capture existing email
          const errorMsg =
            personValidation.message ||
            'A person with the same first name, last name, and date of birth is already registered in the Account system';
          console.log('❌ [PERSON CHECK] Person is DUPLICATE:', errorMsg);
          console.log(
            '📧 [PERSON CHECK] Existing account email:',
            existingAccountEmail,
          );
          errors.push(errorMsg);
        } else {
          console.log('✅ [PERSON CHECK] Person is UNIQUE');
        }
      } else {
        console.log('⚠️ [PERSON CHECK] Missing data - Skipping validation', {
          hasFirstName: !!firstName,
          hasLastName: !!lastName,
          hasBirthDate: !!birthDate,
        });
      }

      // Validate representative name uniqueness (firstName + lastName) in Affiliate table
      // Note: Affiliate doesn't have dateOfBirth, only representative first/last name
      if (firstName && lastName) {
        try {
          const isRepresentativeUnique =
            await this.affiliateBusinessRuleService.validateRepresentativeUniqueness(
              firstName,
              lastName,
            );

          if (!isRepresentativeUnique) {
            errors.push(
              'A representative with the same first name and last name is already registered in the Affiliate system',
            );
          }
        } catch (error) {
          this.logger.warn(
            `Failed to check representative name in Affiliate table: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          // Don't block registration if affiliate check fails
        }
      }

      this.logger.debug(
        `Anti-duplication validation completed. Found ${errors.length} errors`,
      );

      console.log('📊 [ANTI-DUPLICATION] Validation completed');
      console.log('📊 [ANTI-DUPLICATION] Total errors:', errors.length);
      console.log('📊 [ANTI-DUPLICATION] Errors:', errors);
      console.log(
        '📊 [ANTI-DUPLICATION] Existing Email:',
        existingAccountEmail,
      );
      console.log('📊 [ANTI-DUPLICATION] Is Valid:', errors.length === 0);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        errorType:
          errors.length > 0
            ? OrchestratorValidationErrorType.BUSINESS_RULE_VALIDATION
            : undefined,
        existingAccountEmail,
      };
    } catch (error) {
      console.log(
        '❌ [ANTI-DUPLICATION] Validation FAILED with exception:',
        error,
      );
      this.logger.error('Error during anti-duplication validation', error);
      return {
        isValid: false,
        errors: ['Error validating duplicate prevention rules'],
        warnings: [],
        errorType: OrchestratorValidationErrorType.SYSTEM_ERROR,
      };
    }
  }

  /**
   * Comprehensive validation that runs all validation layers
   */
  async validateCompleteRegistration(
    requestData: OrchestratorRequestDto,
  ): Promise<OrchestratorValidationResultDto> {
    this.logger.debug('Starting complete registration validation');

    try {
      // Run all validation layers including anti-duplication checks
      const [
        entityResult,
        crossEntityResult,
        businessRulesResult,
        antiDuplicationResult,
      ] = await Promise.all([
        this.validateEntityData(requestData),
        Promise.resolve(this.validateCrossEntityRules(requestData)),
        Promise.resolve(this.validateBusinessRules(requestData)),
        this.validateAntiDuplicationRules(requestData), // NEW: Check for duplicates
      ]);

      // Combine results including anti-duplication errors
      const allErrors = [
        ...entityResult.errors,
        ...crossEntityResult.errors,
        ...businessRulesResult.errors,
        ...antiDuplicationResult.errors, // NEW: Add duplication errors
      ];

      const allWarnings = [
        ...entityResult.warnings,
        ...crossEntityResult.warnings,
        ...businessRulesResult.warnings,
        ...antiDuplicationResult.warnings, // NEW: Add duplication warnings
      ];

      const isValid = allErrors.length === 0;

      // Determine primary error type
      let errorType: OrchestratorValidationErrorType | undefined;
      if (!isValid) {
        // Prioritize anti-duplication errors as they are critical
        if (antiDuplicationResult.errors.length > 0) {
          errorType = OrchestratorValidationErrorType.BUSINESS_RULE_VALIDATION;
        } else if (entityResult.errors.length > 0) {
          errorType = OrchestratorValidationErrorType.ENTITY_VALIDATION;
        } else if (crossEntityResult.errors.length > 0) {
          errorType = OrchestratorValidationErrorType.CROSS_ENTITY_VALIDATION;
        } else if (businessRulesResult.errors.length > 0) {
          errorType = OrchestratorValidationErrorType.BUSINESS_RULE_VALIDATION;
        }
      }

      const validationResult = new OrchestratorValidationResultDto();
      validationResult.isValid = isValid;
      validationResult.errors = allErrors;
      validationResult.warnings = allWarnings;
      validationResult.errorType = errorType;
      validationResult.entityValidation = entityResult;
      validationResult.crossEntityValidation = crossEntityResult;
      validationResult.businessRulesValidation = businessRulesResult;
      validationResult.existingAccountEmail =
        antiDuplicationResult.existingAccountEmail ?? undefined; // NEW: Pass existing email

      this.logger.debug(
        `Complete validation finished. Valid: ${isValid}, Errors: ${allErrors.length}, Warnings: ${allWarnings.length}`,
      );

      return validationResult;
    } catch (error) {
      this.logger.error('Error during complete validation', error);

      const errorResult = new OrchestratorValidationResultDto();
      errorResult.isValid = false;
      errorResult.errors = ['System error occurred during validation'];
      errorResult.warnings = [];
      errorResult.errorType = OrchestratorValidationErrorType.SYSTEM_ERROR;

      return errorResult;
    }
  }

  /**
   * Helper method to validate phone number format for a specific country
   */
  private validatePhoneForCountry(phone: string, country: string): boolean {
    // This is a simplified implementation
    // In a real scenario, you would use a proper phone validation library
    if (!phone || !country) return false;

    // Remove non-numeric characters for basic validation
    const numericPhone = phone.replace(/\D/g, '');

    // Basic validation based on country
    switch (country.toLowerCase()) {
      case 'br':
      case 'brazil':
        return numericPhone.length >= 10 && numericPhone.length <= 11;
      case 'us':
      case 'usa':
        return numericPhone.length === 10;
      default:
        return numericPhone.length >= 7 && numericPhone.length <= 15;
    }
  }

  /**
   * Helper method to check if email domain is restricted
   */
  private isRestrictedDomain(domain: string): boolean {
    const restrictedDomains = [
      'tempmail.com',
      '10minutemail.com',
      'guerrillamail.com',
      // Add more restricted domains as needed
    ];

    return restrictedDomains.includes(domain.toLowerCase());
  }

  /**
   * Helper method to calculate age from birth date
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }
}
