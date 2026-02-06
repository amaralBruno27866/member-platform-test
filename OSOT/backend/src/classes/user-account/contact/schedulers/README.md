Schedulers

Purpose

Contains scheduled tasks and cron jobs related to contact maintenance. Examples include cleanup jobs, sync tasks with external systems, periodic validation of contact information, and communication preference updates.

Examples

- dailyContactCleanup -> remove stale temporary contacts and outdated communication preferences
- syncContactsWithDataverse -> periodic sync job that reconciles remote contact records
- validateContactChannels -> periodic validation of phone numbers and email addresses
- updateSocialMediaProfiles -> sync social media profile information and verification status

Notes

- Keep schedule configuration externalized (env or config).
- Ensure tasks are idempotent and safe to run in distributed environments.
- Include contact-specific maintenance like phone number validation, email deliverability checks, and social media profile updates.
