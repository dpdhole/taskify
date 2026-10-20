# Future scope: changing the app timezone / relocation

Discussion agreement: travel never changes the account's configured timezone. For PoC/beta the configured timezone is fixed after setup; relocation by changing that setting is unsupported. This document is a local experiment design note, not an authoritative repository amendment.

A future timezone-change feature should be an explicit account operation, not a response to browser/device timezone detection.

Before implementation resolve:

1. For each existing date-only and exact-time value, whether relocation preserves its instant, its selected civil date/local time, or its original per-value timezone. No silent assumption of a common policy across these values.
2. Whether future inputs use a new account timezone while old values retain their original zone/policy version. Define clear labels if values can retain different zones.
3. Impact on Planned Start/Due calendar ordering, Paused Until, Today/Tomorrow, grouping, relative-date entry and overdue calculations. Historical audit instants must remain unchanged.
4. A validated IANA/DST conversion strategy, including ambiguous/nonexistent times and timezone-rule updates; do not accept arbitrary client offsets as authoritative.
5. Explicit preview of affected Tasks, confirmation where schedules change, version/concurrency checks, audit events, and recoverable multi-step processing if records must change. Changing a preference must not silently bypass Task/event atomicity.
6. Cross-device consistency and recovery from a partially completed migration. A mutable profile offset must never retroactively invalidate the meaning of all existing dates without a defined migration model.

The current India-only experiment introduces no production migration or timezone-change workflow.
