Schedulers

Purpose

Contains scheduled tasks and cron jobs related to account maintenance. Examples include cleanup jobs, sync tasks with external systems, and periodic notifications.

Examples

- dailyAccountCleanup -> remove stale temporary accounts
- syncAccountsWithDataverse -> periodic sync job that reconciles remote records

Notes

- Keep schedule configuration externalized (env or config).
- Ensure tasks are idempotent and safe to run in distributed environments.
