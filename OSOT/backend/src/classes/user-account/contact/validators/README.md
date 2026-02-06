Validators

Purpose

Contains custom validation logic used by DTOs or services for contact-specific validations. Validators can be class-validator custom decorators or standalone helper functions for communication channels.

Examples

- IsValidPhoneNumber -> custom decorator to validate and format international phone numbers
- IsValidEmail -> validates email format and checks MX records
- IsValidSocialMediaHandle -> validates social media handles by platform
- IsCommunicationPreference -> validates communication preference combinations

Usage

- Prefer reusing class-validator + custom decorators for request validation.
- Keep complex validation in separate functions to permit unit testing.
- Include contact-specific validators for multi-channel communication validation and business rule enforcement.
