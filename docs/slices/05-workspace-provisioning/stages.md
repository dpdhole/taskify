# Slice 5 — Persisted codecs and stage-integrity checkpoint

4 November 2026. Continues the pure domain checkpoint on baseline e0b8e0b.
Production workspace writes remain disabled; this is local implementation and
feasibility evidence, not a complete Slice5 or deployment candidate.

## Implemented record boundary

workspace-records.ts decodes schema1 profile/settings/classifications/Views,
initialization, immutable receipts and name reservations. It rejects unknown fields
and schemas, absent/null-invalid required data, invalid timestamps/version counters,
noncanonical names and malformed immutable metadata. Protected Uncategorized and
All Tasks definitions are checked while allowing their permitted order changes.
Initial profile fields are optional; settings require an explicit valid timezone.
Resource/field/payload bounds remain for production contract measurement/finalization.

workspace-record-decoder.ts validates the expected UID/family document path,
rejects missing/cache/pending-write snapshots and translates actual SDK Timestamp
seconds/nanoseconds losslessly. Profile URLs undergo actual HTTPS URL parsing.
No SDK object enters domain state. Caller must still enforce session-generation
and compatibility admission; this translator is not the future read/write adapter.
Read-only accountDeletion is not decoded as a workspace record; its existence
always fences operations in the probe, including malformed/unknown control data.

## Local Rules feasibility design

Test-only policy: tests/support/provisioning-stage-probe.rules, with explicit
layout in provisioning-stage-layout.ts. Each immutable receipt requires its
already committed predecessor and exact seed content/guards in the same atomic
operation. The last receipt proves a chain of accepted stages; receipts cannot be
updated/deleted and seeds cannot be mutated during incomplete initialization.
Finalization checks the last committed receipt rather than reading every receipt
in one request. No client-declared count proves completion. Every write checks UID,
authoritative schema write permission and root deletion-fence absence.

| Phase | Stages | Writes per stage |
|---|---:|---:|
| Base: initialization/profile/settings/receipt | 1 | 4 |
| Category pairs with two guards and receipt | 6 | 5 |
| Single Location with guard and receipt | 10 | 3 |
| Single View with receipt | 7 | 2 |
| Final initialization transition | One update after24 receipts | 1 |

This recipe creates78 documents and performs one final update:79 recipe writes.
These counts exclude reads, retries, Rules access checks and fixture setup; they
are not production billing/capacity evidence. Atomicity/authorization are enforced
by Rules even when bypassing the future app orchestrator. The probe deliberately
uses atomic batches; transaction read/retry behavior is still to implement.

Initial recipe-map evaluation exceeded the Rules expression limit. Optimized lazy
selection exposed/fixed a hex-casing mismatch (canonical lowercase SHA-256 IDs).
Two-record Location stages still exceeded expressions; reduce Locations to one
record, retaining two Categories and one View per stage. All original checks remain.
The resulting24-stage recipe passes locally; no universal/production maximum or
exact spare Rules-budget headroom is certified.

## Verification and reproduction

- 66 focused unit tests passed across4 files:25 new record/snapshot cases plus
  the existing34 domain and7 candidate compatibility checks.
- 18 local integration tests passed through the reproducible command
  `npm run test:provisioning-stage` (Java21+ and cached Firestore emulator required).
  The checked runner uses only loopback Firestore and a demo project, refuses
  occupied service ports, preserves preview5173 and shuts its emulator down.
- Integration tests complete all stages, decode real stored snapshots for every
  workspace family, test base/named concurrent claims, guard/hash correspondence,
  partial rollback, forged/skipped/unknown-schema receipts, premature completion,
  immutable reservations/receipts, fenced base/named/View/final writes, cross-UID
  denial, disallowed writer schema and no resetting after completion.
- All TypeScript targets,40-file layer/cycle check and targeted ESLint/Prettier pass.
  No browser regression/build or real-provider run was needed/claimed for this
  unconnected record/probe checkpoint. Earlier readiness/browser evidence is history.

[Machine evidence](stages-evidence.json) records final
source hashes/counts and failed candidate corrections. [Execution log](stages.log)
contains final unit/static/integration output. Earlier failed candidate runs remain
under ignored .local/slice5-stages; they are not relabeled as passing product checks.

## Limits and next work

The Rules probe accepts a fixed seed recipe, explicit fixture UTC and an empty
optional profile. It does not impose UTC on the product or establish production
validation for all profile/timezone values. It forbids ordinary management writes;
rename/archive/reorder CRUD is outside this feasibility test. It cannot be deployed
as the application policy. Existing cloud deny-all workspace Rules/config stay intact.

Next: production profile/timezone validation policy, admitted transaction adapter
and retry/reconciliation orchestration; carry receipt/fence proof into reviewed
production Rules. Bind reads/writes/publication to UID/session generation/tickets,
then Loading/recovery/ready UI. Verify actual two-client transactions, lost
acknowledgement, gate/Logout/account-switch races and meaningful end-to-end behavior.
No claim of completed initialization, production NFC enforcement, exact quotas or
release rollback floor. Stage IDs/recipe are candidate template1 until full Rules
and controller feasibility is established. No cloud changes, stage, commit, push
or deployment. Slice4 remains held; owner local preview was preserved.

## Subsequent production-policy checkpoint

This report and its source hashes describe the historical checkpoint. The
[finalized initialization Rules](rules.md) add shared
timezone/profile bounds, confirmed production-policy tests and updated source
evidence. Earlier counts do not imply the current source still matches this snapshot.
