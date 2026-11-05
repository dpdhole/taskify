# Slice 5A — Long-discovery lease renewal checkpoint

5 November2026, baseline21a55ac. Owner instructed proceeding to long-discovery
renewal, then continuing its validation. This extends [DA1](05A-delete-account-contract.md)
without changing persisted schema, inventory, operator policy or candidate release.
Slice5A remains unaccepted; retirement remains disabled.

## Implementation

- Owned cleanup/finalization starts a local30-second renewal heartbeat after lease
  acquisition. Each renewal transaction checks exact job, live lease, run ID and
  generation using server readTime, then extends by120 seconds and increments the
  control record version. Stage, verification anchors, original Auth-attempt latch
  and pause code are preserved. No expired/replaced lease is resurrected.
- Renewals run serially; the next tick is scheduled only after the current request
  settles. Unknown acknowledgement, validation failure, lost ownership or expiry
  records a local failure and stops further mutations. Owned traversal checks that
  failure between network operations. Read-only inspect/pre-acquisition discovery
  never starts heartbeat writes.
- Every exit cancels the next scheduled tick, waits for the in-flight renewal and
  attempts generation-bound lease release. No process waits merely for retirement;
  no hosted service, scheduler or automatic account-deletion invocation is added.
- A heartbeat after an external Auth call cannot turn uncertainty into completion.
  If renewal fails, retain auth_deleting and its original attempt, omit the absence
  marker and require explicit prior-run reconciliation before resuming. There is
  no blind Auth retry or automatic takeover across that boundary.

## Local verification

- Operator unit suite:27 passing cases, including eight new renewal cases. Simulated
  server time advances beyond one lease during traversal; successful renewals keep
  the same generation. Tests cover read-only inspection, expiry, takeover, unknown
  renewal outcome, preserved Auth latch, serial requests, cleanup waiting for an
  in-flight renewal, and failure after Auth removal requiring explicit reconciliation.
- Operator SDK emulator suite:9 passes, including an actual renewal transaction
  during discovery with server timestamps, unchanged generation, stopped scheduling,
  empty verified inventory and Auth/fence retention. Existing cleanup/Auth cases pass.
- Full npm run verify passed521 unit/component tests,56-file boundaries, typechecking,
  Rules generation drift, icon integrity, lint/format, four builds and bundle
  isolation after emulator shutdown. Standalone operator typecheck also passed.

These tests establish local behavior, not cloud IAM, live provider or token-expiry
safety. A stalled process/RPC can still exceed its lease; it must stop rather than
bypass ownership. Collection listings/path buffering and high-volume cost/performance
remain explicit limitations, not arbitrary user-data caps. Privileged out-of-band
writers remain outside supported quiescence assumptions.

## Remaining acceptance

Provider proof/request/UI and operator cleanup/Auth finalization are implemented
locally. Remaining work is real provider/mobile redirect and re-registration evidence,
cloud Rules/IAM and T7 stale-token/queued-write safety, then reviewed release/rollback
verification. Retirement is disabled until T7; it is not enabled by passing tests or
elapsed time. T1–T8 remain incomplete and Slice4 held. No staging, commit, push,
deployment, credential provisioning or real-account deletion is included here.
