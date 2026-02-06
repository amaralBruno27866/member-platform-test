# Affiliate Interfaces

## Purpose

Holds TypeScript interfaces that describe shapes used within the affiliate domain. Interfaces define contracts for repository operations, service return types, and shared domain concepts specific to affiliate management.

## Structure

The affiliate interfaces are organized into several categories:

### 📋 **Core Entity Interfaces**

- **`AffiliateInternal`** - Complete internal representation with all 27 fields from Dataverse
- **`AffiliateDataverse`** - Raw Dataverse format with OData annotations
- **`AffiliateRepository`** - Repository contract with CRUD and business operations

### 🔄 **Data Transfer Objects (DTOs)**

- **Request DTOs** - `CreateAffiliateDto`, `UpdateAffiliateDto`, `AffiliateLoginDto`
- **Response DTOs** - `AffiliateResponseDto`, `AffiliateListItemDto`, `AffiliateStatsDto`
- **Collection DTOs** - `AffiliateCollectionDto` with pagination support

### 🧩 **Subdomain Interfaces**

- **`AffiliateRepresentative`** - Contact person information
- **`AffiliateOrganization`** - Business profile data
- **`AffiliateContact`** - Communication channels
- **`AffiliateAddress`** - Location information
- **`AffiliateAccount`** - Security and access control

## Examples

### Core Entity Usage

```typescript
import { AffiliateInternal, AffiliateRepository } from './interfaces';

// Complete affiliate entity
const affiliate: AffiliateInternal = {
  osot_affiliate_name: 'Tech Solutions Inc.',
  osot_affiliate_area: AffiliateArea.INFORMATION_TECHNOLOGY_AND_SOFTWARE,
  osot_representative_first_name: 'John',
  osot_representative_last_name: 'Smith',
  osot_representative_job_title: 'CEO',
  osot_affiliate_email: 'contact@techsolutions.com',
  osot_affiliate_phone: '+1-416-555-0123',
  osot_affiliate_address_1: '123 Bay Street',
  osot_affiliate_city: City.TORONTO,
  osot_affiliate_province: Province.ONTARIO,
  osot_affiliate_postal_code: 'M5H 2Y4',
  osot_affiliate_country: Country.CANADA,
  osot_password: 'hashedPassword123',
  osot_account_declaration: true,
};
```

### Repository Contract

```typescript
import { IAffiliateRepository } from './interfaces';

class AffiliateService {
  constructor(private affiliateRepo: IAffiliateRepository) {}

  async findByArea(area: AffiliateArea): Promise<AffiliateInternal[]> {
    return this.affiliateRepo.findByArea(area, 10);
  }

  async searchAffiliates(term: string): Promise<AffiliateInternal[]> {
    return this.affiliateRepo.searchByName(term, 20);
  }
}
```

### DTO Usage for API

```typescript
import { CreateAffiliateDto, AffiliateResponseDto } from './interfaces';

// API request payload
const createRequest: CreateAffiliateDto = {
  affiliateName: 'Healthcare Partners Ltd.',
  affiliateArea: AffiliateArea.HEALTHCARE_AND_LIFE_SCIENCES,
  representativeFirstName: 'Sarah',
  representativeLastName: 'Johnson',
  representativeJobTitle: 'Director',
  affiliateEmail: 'sarah.johnson@healthpartners.ca',
  affiliatePhone: '+1-416-555-0198',
  affiliateAddress1: '456 University Ave',
  affiliateCity: City.TORONTO,
  affiliateProvince: Province.ONTARIO,
  affiliatePostalCode: 'M5G 1X5',
  affiliateCountry: Country.CANADA,
  password: 'securePassword123',
  confirmPassword: 'securePassword123',
  accountDeclaration: true,
};

// API response payload
const response: AffiliateResponseDto = {
  affiliateId: 'affi-0000042',
  affiliateName: 'Healthcare Partners Ltd.',
  affiliateArea: AffiliateArea.HEALTHCARE_AND_LIFE_SCIENCES,
  affiliateAreaLabel: 'Healthcare and Life Sciences',
  representativeFirstName: 'Sarah',
  representativeLastName: 'Johnson',
  representativeFullName: 'Sarah Johnson',
  representativeJobTitle: 'Director',
  affiliateEmail: 'sarah.johnson@healthpartners.ca',
  affiliatePhone: '+1-416-555-0198',
  affiliateAddress1: '456 University Ave',
  affiliateCity: City.TORONTO,
  affiliateCityLabel: 'Toronto',
  affiliateProvince: Province.ONTARIO,
  affiliateProvinceLabel: 'Ontario',
  affiliatePostalCode: 'M5G 1X5',
  affiliateCountry: Country.CANADA,
  affiliateCountryLabel: 'Canada',
  accountStatus: AccountStatus.PENDING,
  accountStatusLabel: 'Pending',
  activeMember: false,
  accountDeclaration: true,
  accessModifiers: AccessModifier.PRIVATE,
  accessModifiersLabel: 'Private',
  createdOn: '2024-01-15T10:30:00Z',
  modifiedOn: '2024-01-15T10:30:00Z',
  addressSummary: '456 University Ave, Toronto, ON M5G 1X5',
  socialMediaCount: 0,
};
```

### Subdomain Interface Usage

```typescript
import { AffiliateRepresentative, AffiliateContact } from './interfaces';

// Working with representative information
const representative: AffiliateRepresentative = {
  osot_representative_first_name: 'Michael',
  osot_representative_last_name: 'Chen',
  osot_representative_job_title: 'Business Development Manager',
};

// Working with contact information
const contact: AffiliateContact = {
  osot_affiliate_email: 'info@example.com',
  osot_affiliate_phone: '+1-416-555-0156',
  osot_affiliate_facebook: 'https://facebook.com/example',
  osot_affiliate_linkedin: 'https://linkedin.com/company/example',
};
```

### Search and Filtering

```typescript
import { AffiliateSearchDto, AffiliateCollectionDto } from './interfaces';

// Search parameters
const searchParams: AffiliateSearchDto = {
  area: AffiliateArea.FINANCIAL_SERVICES_AND_INSURANCE,
  province: Province.ONTARIO,
  activeOnly: true,
  page: 1,
  limit: 25,
  sortBy: 'name',
  sortOrder: 'asc',
};

// Paginated results
const results: AffiliateCollectionDto = {
  affiliates: [
    /* array of AffiliateListItemDto */
  ],
  pagination: {
    page: 1,
    limit: 25,
    total: 157,
    pages: 7,
    hasNext: true,
    hasPrev: false,
  },
  filters: searchParams,
};
```

## Usage Guidelines

### 🎯 **Internal vs External Interfaces**

- **Use `AffiliateInternal`** for server-side business logic and database operations
- **Use DTOs** for API requests, responses, and client communication
- **Never expose** `AffiliateInternal` directly to public APIs

### 🔒 **Security Considerations**

- **Password fields** are always excluded from response DTOs
- **Internal IDs** (GUIDs) are not exposed in public responses
- **Privilege levels** are handled internally and not included in standard responses

### 📊 **Repository Patterns**

- **Business queries** like `findByArea()`, `findActiveAffiliates()` for common operations
- **Search functionality** with `searchByName()`, `advancedSearch()` for flexible filtering
- **Analytics methods** like `countByArea()`, `getRecentlyCreated()` for reporting

### 🏗️ **Type Safety**

- **Utility types** like `AffiliateRequiredFields`, `AffiliateUpdatableFields` for precise operations
- **Subdomain interfaces** for focused operations on specific data groups
- **Enum integration** with global enums for consistent choice field handling

## Key Features

### 🔗 **Global Enum Integration**

All choice fields are aligned with global enums:

- `AffiliateArea` (12 business sectors)
- `AccountStatus` (Active, Inactive, Pending)
- `Province` (Canadian provinces/territories)
- `Country` (International country codes)
- `AccessModifier` (Public, Protected, Private)

### 📱 **API-Ready DTOs**

Complete set of DTOs for:

- **Registration** - `CreateAffiliateDto` with validation-friendly structure
- **Updates** - `UpdateAffiliateDto` with partial update support
- **Authentication** - `AffiliateLoginDto`, `AffiliateAuthResponseDto`
- **Search** - `AffiliateSearchDto` with pagination and filtering

### 🎛️ **Flexible Data Access**

Repository interface supports:

- **CRUD operations** - Create, read, update, delete with proper typing
- **Business queries** - Area-based, status-based, geographic filtering
- **Advanced search** - Multi-criteria search with customizable parameters
- **Analytics** - Counting, statistics, and reporting functions

## Dependencies

- **Global Enums** (`src/common/enums/`) - Centralized choice field definitions
- **Constants** (`../constants/`) - Validation patterns and business rules
- **No external packages** - Pure TypeScript interfaces for maximum compatibility
