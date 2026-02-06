DTOs

Purpose

Contains Data Transfer Objects used for request validation and response shaping in the contact domain. DTOs define the expected shape of input and output payloads and can include validation decorators for contact-specific fields.

Examples

- create-contact.dto.ts -> CreateContactDto { firstName, lastName, primaryEmail, mobilePhone, socialMedia }
- contact-response.dto.ts -> ContactResponseDto for responses (omits sensitive fields)
- contact-registration.dto.ts -> ContactRegistrationDto for registration workflows
- list-contacts.query.dto.ts -> Query parameters for contact searches and filtering

Usage

- Use class-validator decorators to validate incoming requests.
- Keep DTOs minimal and focused to the endpoint's needs.
- Include contact-specific validations like email format, phone number patterns, social media handle formats.
