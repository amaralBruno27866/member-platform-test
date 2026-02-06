# Affiliate DTOs

## Purpose

Contains Data Transfer Objects (DTOs) for the Affiliate module, providing structured data validation, transformation, and API documentation for all affiliate-related operations.

## Architecture

**Complete DTO Suite**: Following the established project pattern, the affiliate module includes all 6 standard DTOs for comprehensive data management:

1. **affiliate-basic.dto.ts** - Core affiliate data structure
2. **create-affiliate.dto.ts** - Affiliate creation with password
3. **update-affiliate.dto.ts** - Partial updates with password change
4. **list-affiliates.query.dto.ts** - Query parameters for filtering/pagination
5. **affiliate-registration.dto.ts** - Registration workflow with terms acceptance
6. **affiliate-response.dto.ts** - Formatted output with computed fields

## DTOs Overview

### 🏢 **AffiliateBasicDto**

**Purpose**: Core affiliate data structure with comprehensive validation covering all 27 Dataverse fields from Table Account Affiliate.csv.

**Key Sections**:

- **Organization Profile**: Name, business area
- **Representative Identity**: First/last name, job title
- **Contact Information**: Email, phone (with formatting)
- **Address Details**: Complete address with postal code validation
- **Social Media**: Website, Facebook, Instagram, TikTok, LinkedIn
- **Account Management**: Status, access, privileges

### 🆕 **CreateAffiliateDto**

**Purpose**: Affiliate creation with password security and OData binding support.

**Features**: Extends AffiliateBasicDto + password validation + Dataverse integration

### ✏️ **UpdateAffiliateDto**

**Purpose**: Partial updates with password change capability and audit tracking.

**Features**: PartialType(AffiliateBasicDto) + password change + update context

### 📋 **ListAffiliatesQueryDto**

**Purpose**: Comprehensive query parameters for filtering, sorting, and pagination.

**Features**: Geographic filters + business filters + date ranges + performance options

### 📝 **AffiliateRegistrationDto**

**Purpose**: Registration workflow with terms acceptance and tracking.

**Features**: Extends CreateAffiliateDto + legal compliance + referral system + source tracking

### 📤 **AffiliateResponseDto**

**Purpose**: Formatted API responses with computed fields and transformations.

**Features**: Computed fields + enum helper functions + social media summary + metadata

**Enum Integration**: Uses official enum helper functions for display names:

- `getAccountStatusDisplayName()` for account status labels
- `getProvinceDisplayName()` for province names
- `getCityDisplayName()` for city formatting
- `getCountryDisplayName()` for country names
- `AffiliateAreaLabels` for business area descriptions

## Usage Examples

```typescript
// Basic Creation
const createData: CreateAffiliateDto = {
  osot_Affiliate_Name: 'Tech Solutions Inc.',
  osot_Affiliate_Area: AffiliateArea.TECHNOLOGY,
  osot_Representative_First_Name: 'John',
  osot_Representative_Last_Name: 'Doe',
  osot_Affiliate_Email: 'contact@techsolutions.com',
  osot_Password: 'SecureP@ssw0rd123!',
  confirmPassword: 'SecureP@ssw0rd123!',
  osot_Account_Declaration: true,
  // ... other required fields
};

// Registration with Terms
const registrationData: AffiliateRegistrationDto = {
  ...createData,
  termsAccepted: true,
  privacyPolicyAccepted: true,
  verificationEmail: 'contact@techsolutions.com',
};

// Query with Filtering
const queryParams: ListAffiliatesQueryDto = {
  search: 'tech',
  affiliateArea: AffiliateArea.TECHNOLOGY,
  province: Province.ONTARIO,
  take: 20,
  includeCount: true,
};
```

## Integration

- **Constants**: Uses AFFILIATE_FIELD_LIMITS for validation
- **Enums**: Integrates with centralized enum system using official helper functions
- **Validators**: Uses affiliate.validators.ts for business rules
- **Utils**: Phone formatting and URL validation
- **Dataverse**: Field alignment with Table Account Affiliate.csv

## Technical Notes

- **Enum Usage**: All DTOs use official enum helper functions (not hardcoded mappings)
- **Validation**: Comprehensive class-validator decorators with business rule integration
- **TypeScript**: Full type safety with zero compilation errors
- **Documentation**: Complete Swagger/OpenAPI documentation for all endpoints
- **Performance**: Optimized queries with selective field loading and pagination

## Best Practices

- Use class-validator decorators to validate incoming requests
- Keep DTOs minimal and focused to the endpoint's needs
- Always use official enum helper functions for display names
- Leverage computed properties in response DTOs for enhanced UX
- Follow the 6-DTO pattern for consistency across modules
