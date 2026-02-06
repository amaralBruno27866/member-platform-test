Mappers

Purpose

Contains mapping utilities that transform data between layers (e.g., Dataverse records to DTOs, external API payloads to contact domain models, social media data to internal formats).

Examples

- mapDataverseToContactInternal(dataverseRecord) -> ContactInternal
- mapCreateDtoToDataverse(createDto) -> DataverseContactData
- mapContactToResponseDto(contact) -> ContactResponseDto
- mapSocialMediaToInternal(socialData) -> SocialMediaHandle[]

Guidelines

- Keep mappers pure and side-effect free.
- Centralize complex transformations to keep services small.
- Include contact-specific mappers for phone number formatting, social media normalization, and communication channel standardization.
