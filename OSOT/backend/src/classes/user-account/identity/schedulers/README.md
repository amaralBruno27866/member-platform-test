# Schedulers

## Purpose

Contains scheduled tasks and cron jobs related to identity maintenance. Examples include cleanup jobs, sync tasks with external systems, and periodic notifications.

## Examples

- dailyIdentityCleanup -> remove stale temporary identity records
- syncIdentitiesWithDataverse -> periodic sync job that reconciles remote records
- identityVerificationReminders -> send periodic reminders for pending verifications

## Notes

- Keep schedule configuration externalized (env or config).
- Ensure tasks are idempotent and safe to run in distributed environments.
