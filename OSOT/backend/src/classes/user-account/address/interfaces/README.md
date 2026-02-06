# Address Interfaces

## Purpose

Centralized location for all TypeScript interfaces related to address functionality. These interfaces define the shapes, contracts, and data structures used throughout the address domain.

## Interface Categories

### **Formatting Interfaces**

- `FormattedAddress` - Different formatted representations of addresses
- `AddressFormatOptions` - Configuration options for address formatting

### **Validation Interfaces**

- `PostalCodeValidation` - Result of postal code validation
- `PostalCodePattern` - Pattern definitions for postal code validation
- `AddressValidationRules` - Technical validation rules for addresses

### **Geographic Interfaces**

- `Coordinates` - Geographic coordinates (lat/lng)
- `GeographicDistance` - Distance between geographic points
- `PostalCodeInfo` - Detailed postal code information
- `ProvinceInfo` - Province/state information

### **Business Rules Interfaces**

- `CountryRules` - Country-specific business rules and requirements
- `GeographicInfo` - Geographic and cultural information

### **Internal Interfaces**

- `AddressInternal` - Complete internal address structure from Dataverse

## Usage

```typescript
// Import individual interfaces
import { FormattedAddress } from './formatted-address.interface';

// Import multiple interfaces from index
import {
  FormattedAddress,
  PostalCodeValidation,
  CountryRules,
} from '../interfaces';
```

## Best Practices

- **Single Responsibility**: Each interface serves a specific purpose
- **Well Documented**: All properties include JSDoc comments
- **Type Safety**: Strict typing with proper generics where needed
- **Reusability**: Interfaces are shared across utils, services, and controllers
- **Consistency**: Follow established naming and structure patterns
