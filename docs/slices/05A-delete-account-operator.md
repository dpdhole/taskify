# Slice 5A — Operator discovery and bounded cleanup checkpoint

5 November2026, baseline11897a4. Owner instructed proceeding with the operator
checkpoint. [DA1](05A-delete-account-contract.md) remains controlling; this implements
its discovery/cleanup portion, not complete deletion or release acceptance.

## Delivered

- Isolated package and lockfile: firebase-admin14.5.0/tsx4.23.15. Cloud ADC/project
  metadata verification, compatibility/environment checks, default-database and
  endpoint-mixing rejection. No keys or real credential provisioning.
- Read-only inspect with aggregate counts; SDK traversal through missing parents;
  strict path/shape validation, unsupported-family rejection before deletion.
- Transactional120-second server-time leases, increasing generations, at most100
  application deletes plus one control update per batch. All reads precede writes.
  Stale owners cannot commit/release after takeover. Five transaction attempts.
- Original UID/Auth creation-time fingerprint, explicit execute/resume confirmation,
  independent empty traversal and server-confirmed data_verified milestone. Auth
  identity and deletion fence remain. No Auth deletion API or retirement execution.
- Sanitized CLI outcomes, [operator runbook](../../tools/account-deletion/README.md)
  and dedicated loopback emulator command. Full application builds stay isolated
  from administrative tooling.

## Evidence and limits

Eleven new unit fault-injection cases pass: read-only inspection,206 actual records
across100/100/6 delete batches, UID isolation, unknown data, malformed records,
project/job/auth guards, live/expired leases, stale-generation contention, interrupted
resume and completed-stage replay rejection. Five SDK emulator tests exercise
missing parents,205 classifications plus nested reservation, resolved timestamps,
Auth/fence retention, unsupported descendants, competing operators and endpoint
mixing. Emulator fixtures use synthetic identities only.

Full npm run verify passes476 unit/component tests, types, boundaries, generation/
assets, lint/format, four builds and bundle isolation. Subsequent targeted checks
cover the final endpoint/argument changes and standalone operator typecheck.
CLI smoke checks verify retirement-disabled exit3 and missing-target exit2 without
connecting. Initial formatting drift was fixed. An initial emulator run probed
metadata; the attempted fake-credential fix exposed Admin Firestore's credential
restriction. The final adapter uses a separate insecure loopback Firestore client,
dummy Auth emulator credential and disabled metadata discovery; final emulator
rerun verifies this configuration. Multiple-project warnings remain expected.

Cloud metadata/IAM/ADC behavior is implemented but unexecuted; no Firebase cloud operations,
real account cleanup, commit, staging, push or publication are performed. Current
deployed revision2 blocks this candidate operator. Full traversal buffers paths and
has no heartbeat: lease expiry safely stops mutations during unusually long passes;
large-volume traversal/renewal optimization remains pending. Pause-code persistence
is not added; failures retain the last stage/fence and emit a bounded operator error.

Next: Auth deletion/latch reconciliation, then deletion proof/token transfer,
request adapter/controller and UI. Retirement stays disabled pending T7. T1–T8
remain incomplete, Slice5A unaccepted and Slice4 held. This checkpoint advances
inventory and concurrency evidence; it does not establish real registration or
token-retirement safety.
