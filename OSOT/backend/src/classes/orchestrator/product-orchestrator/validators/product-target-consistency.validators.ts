import { CreateProductDto } from '../../../others/product/dtos/create-product.dto';
import { CreateAudienceTargetDto } from '../../../others/audience-target/dtos/audience-target-create.dto';
import { AddTargetToSessionDto } from '../dtos/add-audience-target-to-session.dto';
import { PRODUCT_ORCHESTRATOR_RULES } from '../constants/product-orchestrator.constants';

/**
 * Product Target Consistency Validators
 * Validates product and audience target data for orchestrator
 */

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate product data
 */
export function validateProductData(
  productDto: CreateProductDto,
): ValidationResult {
  const errors: string[] = [];

  // Check required fields
  for (const field of PRODUCT_ORCHESTRATOR_RULES.REQUIRED_PRODUCT_FIELDS) {
    const dtoField = mapFieldToDtoProperty(field);
    const value: unknown = productDto[dtoField];
    // Check for null or undefined, but allow 0 as valid (e.g., productCategory: 0)
    if (value === null || value === undefined) {
      errors.push(`Missing required field: ${dtoField}`);
    }
  }

  // Validate product code format
  if (
    productDto.productCode &&
    !PRODUCT_ORCHESTRATOR_RULES.PRODUCT_CODE_PATTERN.test(
      productDto.productCode,
    )
  ) {
    errors.push(
      'Product code must contain only uppercase letters, numbers, hyphens, and underscores',
    );
  }

  // Validate at least one price field
  const hasPriceField = PRODUCT_ORCHESTRATOR_RULES.REQUIRED_PRICE_FIELDS.some(
    (field) => {
      const dtoField = mapFieldToDtoProperty(field) as keyof CreateProductDto;
      const value = productDto[dtoField];

      return (
        value !== undefined &&
        value !== null &&
        typeof value === 'number' &&
        value >= 0
      );
    },
  );

  if (!hasPriceField) {
    errors.push('At least one price field must be specified (>= 0)');
  }

  // Validate price values (16 membership category prices)
  const priceFields = [
    'generalPrice',
    'otStuPrice',
    'otNgPrice',
    'otPrPrice',
    'otNpPrice',
    'otRetPrice',
    'otLifePrice',
    'otaStuPrice',
    'otaNgPrice',
    'otaNpPrice',
    'otaRetPrice',
    'otaPrPrice',
    'otaLifePrice',
    'assocPrice',
    'affPrimPrice',
    'affPremPrice',
  ] as const;
  for (const field of priceFields) {
    const value = productDto[field as keyof CreateProductDto];
    if (value !== undefined && value !== null && typeof value === 'number') {
      if (
        value < PRODUCT_ORCHESTRATOR_RULES.MIN_PRICE ||
        value > PRODUCT_ORCHESTRATOR_RULES.MAX_PRICE
      ) {
        errors.push(
          `Price ${field} must be between ${PRODUCT_ORCHESTRATOR_RULES.MIN_PRICE} and ${PRODUCT_ORCHESTRATOR_RULES.MAX_PRICE}`,
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate audience target data
 * Accepts both CreateAudienceTargetDto and AddTargetToSessionDto
 */
export function validateTargetData(
  targetDto: CreateAudienceTargetDto | AddTargetToSessionDto,
): ValidationResult {
  const errors: string[] = [];

  // Note: All target fields are optional (null = open-to-all)
  // We only validate format if fields are provided

  // Validate array fields don't exceed max selections
  const arrayFields = [
    'osot_location_province',
    'osot_location_region',
    'osot_employment_status',
    'osot_employment_sector',
    'osot_employment_setting',
    'osot_registration_class',
    'osot_practice_area',
    'osot_client_age_group',
    'osot_certification_specialty',
    'osot_preferred_language',
    'osot_years_in_practice',
    'osot_organization_size',
    'osot_leadership_role',
    'osot_education_level',
    'osot_professional_interest',
    'osot_ceu_topic_preference',
    'osot_membership_type',
    'osot_volunteer_interest',
    'osot_advocacy_interest',
    'osot_technology_adoption',
    'osot_work_model_preference',
    'osot_income_range',
    'osot_student_year',
    'osot_new_grad_status',
    'osot_international_grad',
    'osot_bilingual_capacity',
    'osot_indigenous_focus',
    'osot_rural_practice',
    'osot_telehealth_provider',
    'osot_research_involvement',
    'osot_publication_author',
    'osot_conference_attendance',
    'osot_mentorship_role',
  ];

  for (const field of arrayFields) {
    const value: unknown = targetDto[field as keyof CreateAudienceTargetDto];
    if (value && Array.isArray(value)) {
      if (value.length > 50) {
        errors.push(`${field} cannot have more than 50 selections`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Map Dataverse field name to DTO property name
 */
function mapFieldToDtoProperty(dataverseField: string): string {
  // Special mappings for price fields with acronyms
  const specialMappings: Record<string, string> = {
    osot_otstu_price: 'otStuPrice',
    osot_otng_price: 'otNgPrice',
    osot_otpr_price: 'otPrPrice',
    osot_otnp_price: 'otNpPrice',
    osot_otret_price: 'otRetPrice',
    osot_otlife_price: 'otLifePrice',
    osot_otastu_price: 'otaStuPrice',
    osot_otang_price: 'otaNgPrice',
    osot_otanp_price: 'otaNpPrice',
    osot_otaret_price: 'otaRetPrice',
    osot_otapr_price: 'otaPrPrice',
    osot_otalife_price: 'otaLifePrice',
    osot_assoc_price: 'assocPrice',
    osot_affprim_price: 'affPrimPrice',
    osot_affprem_price: 'affPremPrice',
  };

  // Check if there's a special mapping
  if (specialMappings[dataverseField]) {
    return specialMappings[dataverseField];
  }

  // Remove osot_ prefix and convert to camelCase
  const withoutPrefix = dataverseField.replace('osot_', '');
  const parts = withoutPrefix.split('_');

  return parts
    .map((part, index) =>
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join('');
}
