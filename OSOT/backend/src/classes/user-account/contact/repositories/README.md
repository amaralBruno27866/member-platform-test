Repositories

Purpose

Contains repository implementations that encapsulate data access logic for contacts. Repositories interact with Dataverse or external storage and provide a consistent API to services for contact-related operations.

Examples

- ContactRepository.findById(contactId): Promise<ContactEntity | null>
- ContactRepository.findByEmail(email): Promise<ContactEntity[]>
- ContactRepository.findByPhone(phone): Promise<ContactEntity[]>
- ContactRepository.save(entity): Promise<void>
- ContactRepository.searchByName(name): Promise<ContactEntity[]>

Guidelines

- Keep repository methods small and focused.
- Translate exceptions into domain-friendly errors where appropriate.
- Include contact-specific repository methods for multi-channel searches and duplicate detection.
