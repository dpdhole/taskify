# Slice 5A — Auth finalization and reconciliation checkpoint

5 November2026, baseline d184f36. The owner instructed continuing implementation.
This extends [operator cleanup](operator.md) through trusted Auth
absence and awaiting_retirement under [DA1](contract.md).
Slice5A remains unaccepted. Fence retirement stays disabled.

## Implemented boundary

- After independent data-emptiness and pinned-identity verification, atomically
  persist auth_deleting/authAttempt under the current lease. No external call
  occurs in a retryable Firestore transaction. Original Auth-attempt identity is
  retained through later acquisitions/recovery.
- Use exactly one bounded HTTP deletion request per invocation, with a60-second
  AbortSignal, redirect rejection and no application transport retry. Recheck
  control/lease after obtaining credentials and immediately before sending. Target
  only the original UID/project; never search by email or provider.
- A successful or failed response is reconciled through authoritative Auth lookup.
  Existing identity means uncertainty, not an automatic retry. A lost response
  followed by verified absence can advance. Missing Auth before the durable latch
  remains exceptional/orphan recovery, not permission to skip cleanup.
- An interrupted auth_deleting job requires resume plus both --reconcile-auth and
  --prior-run-stopped. These are explicit operator attestations of prior-process/
  call reconciliation, not a claim that lease expiry or local timeout cancels a
  remote operation. Live foreign leases remain blocking; no force takeover exists.
- Verified absence is committed with a server timestamp; its resolved value anchors
  retireNotBefore at+4,200 seconds. Crash before marker persistence requires a new
  conservative observation; crash after persistence preserves the original anchor.
  A later resume can repair a missing deadline without deleting Auth again.
- Execute/resume now orchestrate cleanup then Auth finalization and stop at
  awaiting_retirement. Output separates accountRemoved from controlRetired. A
  repeated resume verifies Auth absence and data emptiness; unexpected UID recreation
  blocks. Retire still exits disabled before connection, irrespective of elapsed time.

The chosen administrative endpoint and UID body follow the official
[projects.accounts.delete API](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v1/projects.accounts/delete).
The existing Firebase project is used; this adds no hosted backend, billing change
or identity-platform configuration. Cloud IAM/endpoint behavior is not validated by
emulator evidence. Runtime now needs firebaseauth.users.delete as well as read.

## Verification and remaining work

- Operator unit suite:19 cases, including eight new finalization/recovery cases.
  Exercises latch-before-call, failed/lost acknowledgement, explicit retry, missing
  Auth, new conservative anchor, missing-deadline repair, recreated UID and nonempty
  inventory. Existing stale-generation/lease/interrupted-batch coverage is retained.
- Operator emulator suite:8 cases, including actual synthetic Auth deletion,
  retained control/timestamps, second UID/data preservation, lost response after
  deletion and transport single-call/redirect/ownership guard checks.
- Full verification passed484 unit/component cases plus static checks and four
  build/bundle modes. Initial full verification reported two preflight failures
  because its port checks ran concurrently with the emulator. The emulator owned
  its services and shut them down; the sequential rerun passed all484 cases.
- Root and standalone operator types, lint/format, CLI flag validation and
  whitespace/link checks complete the local checkpoint. CLI smoke checks reject
  incomplete reconciliation flags with exit2 and retirement with exit3 before
  connecting. Final emulator transport checks include a rejected pre-send lease
  guard after credential acquisition. No interactive
  providers, real accounts, Firebase cloud resource changes or deployment are run.

See the updated [operator runbook](../../../tools/account-deletion/README.md).
Next implement provider proof/token transfer, request adapter/controller and UI.
Large-volume discovery heartbeat/renewal remains follow-on work; expiry stops safely.
T1–T8 remain incomplete, including real provider re-registration, cloud IAM/Rules
and T7 token-retirement evidence. No staging, commit or push is included here.
