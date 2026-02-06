Schedulers

Purpose

Contains scheduled tasks and cron jobs related to address maintenance. Examples include cleanup jobs, sync tasks with external systems, periodic address validation, and postal code updates.

Examples

- dailyAddressCleanup -> remove stale temporary addresses and outdated geographic data
- syncAddressesWithDataverse -> periodic sync job that reconciles remote address records
- validatePostalCodes -> periodic validation of postal codes and address completeness
- updateGeographicData -> sync geographic coordinates and normalization rules

Notes

- Keep schedule configuration externalized (env or config).
- Ensure tasks are idempotent and safe to run in distributed environments.
- Include address-specific maintenance like postal code validation, geographic data updates, and normalization rule refreshes.
