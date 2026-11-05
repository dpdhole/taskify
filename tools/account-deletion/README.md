# Account deletion operator — Auth finalization checkpoint

Implements DA1 through **awaiting_retirement**. Trusted Auth deletion and explicit
reconciliation are implemented; fence retirement remains disabled. Source:
[DA1](../../docs/slices/05A-delete-account-contract.md).
No command schedules itself. Creating this tool does not authorize a destructive run.

## Setup and targeting

Use the repository-pinned Node/npm toolchain. From the repository root:

```text
npm --prefix tools/account-deletion ci --ignore-scripts
npm --prefix tools/account-deletion run typecheck
```

This package pins firebase-admin14.5.0 and tsx4.23.15 with its own lockfile;
node_modules is ignored. Administrative dependencies are not browser imports.
Production credentials use ADC/approved local impersonation outside Git. Project
metadata read and Auth user read/delete are required alongside Firestore get/list/create/
update/delete permissions. No Auth create/update/token-mint permission is required.
Firestore IAM is not per-UID isolation; the operator's target validation is mandatory.

Supported target: taskify-dev-dpdhole, project number243252492098, default database.
Cloud mode checks actual project ID/number/ACTIVE metadata and compatible runtime
policy before workspace traversal/mutation. Current deployed revision2 is rejected;
candidate revision3 has not been published or cloud-validated. Missing project
permissions or mismatches block, with no fallback to an email/provider lookup.

## Commands

Replace UID and JOB_UUID with the exact persisted request target, never email.
Inspect is read-only:

```text
npm --prefix tools/account-deletion run operator -- inspect --project taskify-dev-dpdhole --project-number 243252492098 --uid UID --job-id JOB_UUID
```

After separately authorizing the exact destructive target, use the same options
with execute or resume and append `--confirm-job JOB_UUID`. execute requires state
requested; resume handles the current unfinished stage. After verifying empty data,
both finalize the original Auth UID, record trusted absence and stop at
awaiting_retirement with the fence retained. At auth_deleting, resume additionally
requires `--reconcile-auth --prior-run-stopped`. Both flags attest that the earlier
process is stopped and its external call has settled or been reconciled. A timeout
alone does not establish remote cancellation. Wait for any live lease to expire;
there is no force takeover. Inspect before and after recovery. A repeated resume in
awaiting_retirement verifies Auth/data and repairs a missing deadline without
resetting its existing anchor. Unexpected old-UID recreation blocks processing.
retire always reports retirement-disabled before connecting. No force/ignore-unknown,
bulk target, email resolution or automatic expiry-based takeover of Auth work.

Output contains state, aggregate known-family counts or bounded error codes, never
record contents, paths or raw SDK exceptions. Zero means the reported command/
milestone succeeded, not full account removal. Exit2 means invalid target/job or
unsupported contract/inventory;3 means busy/stage pending/retirement disabled;
4 means Auth or data reconciliation;5 means other infrastructure/validation failure.

## Cleanup and recovery

All data is recursively discovered/validated before deletion. Missing parent
documents do not hide children. Unknown family/schema/shape stops the run. Each
transaction reads the control and candidates before atomically deleting at most100
documents and updating control under a matching live run/generation. Leases use
server readTime plus120 seconds. Full independent discovery proves emptiness before
recording data_verified with a server timestamp. The exact Auth creation-time
fingerprint is pinned and rechecked; a missing/changed identity stops cleanup.

On interruption inspect the same job, then explicitly resume. Committed batches
are reconciled by enumeration, not replayed from counters. A live foreign lease
reports busy. Expired/released leases acquire a new generation. Stale generations
cannot commit deletes or release another run's lease. On graceful errors lease
release is attempted; if unavailable it safely expires. No fence is cleared.

Discovery uses SDK collection listings and buffers paths. During an owned invocation,
a local30-second heartbeat renews the120-second lease in a server transaction.
Only one renewal runs at a time. Server readTime and the current run/generation
determine authority; a local timer never revives an expired or replaced lease.
Failed/unknown renewal stops further mutations. Shutdown cancels the next tick,
waits for any in-flight renewal, then attempts release. Read-only inspect and
pre-acquisition discovery do not start renewal writes. This is not a daemon or an
automatic account-deletion schedule. Auth-latch reconciliation still requires the
explicit attestations; no timer clears the fence or retires metadata.

A blocked process or request can still outlast its lease and must then stop safely.
Listing/path buffering and very-large-volume performance remain optimization work;
there is no constant-memory claim or speculative user-data cap. Privileged
out-of-band writers violate quiescence assumptions.

## Local verification

```text
npm run test:deletion-operator:local
```

The runner owns loopback Auth9099/Firestore8080 and preserves preview5173. Synthetic
fixture creation and cleanup occur only inside those emulators. `--emulator` requires
both exact endpoint environment values, uses no real credentials, and disables
metadata discovery. Mixed cloud/emulator endpoints are rejected. Multiple-project
emulator warnings reflect the production target namespace inside the isolated
demo emulator, not production access. Do not use emulator flags to target cloud.

Cloud metadata/IAM/ADC and real accounts are not validated by these tests. Provider
proof/browser request/UI are implemented locally; live provider/mobile redirect,
T7 retirement verification and authorized release remain before Slice5A acceptance.
