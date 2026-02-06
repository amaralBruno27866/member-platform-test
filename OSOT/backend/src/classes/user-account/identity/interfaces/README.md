# Identity Interfaces

## Purpose

Holds TypeScript interfaces that describe shapes used within the identity domain. Interfaces can define repository contracts, service return types, or shared domain concepts for managing user identity information including personal preferences, accessibility needs, and cultural identities.

## Examples

- `IIdentity { id: string, chosenName: string, language: string, gender?: string }`
- `IIdentityRepository { findById(id): Promise<IIdentity | null>, save(identity): Promise<void> }`

## Usage

- Prefer interfaces for internal contracts and DTOs for external API inputs/outputs.
- Keep interfaces descriptive and well-documented.
- Identity interfaces handle multiple choice fields (like languages) in both Dataverse format (comma-separated strings) and internal format (arrays).

## Example: Stripping internal fields

```ts
// service returns IdentityInternal
const internal = (await identityRepo.findByGuid(guid)) as IdentityInternal;
// controller should map to IdentityResponseDto and NOT return osot_table_identityid
const publicDto = mapDataverseToIdentityResponse(internal);
return publicDto;
```

## Identity-Specific Considerations

- **Language Field**: Handles multiple languages using Dataverse multiple choice format ("13,18") and internal array format ([13, 18])
- **Cultural Fields**: Race, Indigenous status, and Indigenous detail fields support optional cultural identity information
- **Accessibility**: Disability field supports accessibility needs identification
- **Privacy**: Access modifiers control visibility of identity information
- **Security**: Privilege field controls internal system access (never exposed to users)
