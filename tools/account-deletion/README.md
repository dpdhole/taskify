# Account deletion operator — Auth finalization checkpoint

Implements DA1 through **awaiting_retirement**. Trusted Auth deletion and explicit
reconciliation are implemented; fence retirement remains disabled. Source:
[DA1](../../docs/slices/05A-delete-account/contract.md).
No command schedules itself. Creating this tool does not authorize a destructive run.

## Setup and targeting

Use the repository-pinned Node/npm toolchain. From the repository root:

```text
npm.cmd ci --ignore-scripts
npm.cmd --prefix tools/account-deletion ci --ignore-scripts
npm.cmd --prefix tools/account-deletion run typecheck
```

This package pins firebase-admin14.5.0 and tsx4.23.15 with its own lockfile;
node_modules is ignored. Administrative dependencies are not browser imports.
Production credentials use ADC/approved local impersonation outside Git. Project
metadata read and Auth user read/delete are required alongside Firestore get/list/create/
update/delete permissions. No Auth create/update/token-mint permission is required.
Firestore IAM is not per-UID isolation; the operator's target validation is mandatory.

Supported target: taskify-dev-dpdhole, project number243252492098, default database.
Cloud mode checks actual project ID/number/ACTIVE metadata and compatible runtime
policy before workspace traversal/mutation. Revision 3/serverRelease 3 with DA1
Rules is deployed; revision 2 is rejected. Missing project
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

These emulator tests do not validate cloud credentials or real accounts. Dev and qc
now serve app 0.3.0 with policy 3. Owner-reported provider, deletion and re-registration
evidence is recorded in the [QC UAT report](../../docs/slices/05A-delete-account/qc-promotion.md).
Cross-UID isolation, T7 and final acceptance remain pending.

## 6 November 2026 — Auth failure diagnostics

Non-success Auth deletion responses now expose only HTTP status and an allowlisted
reason. Raw messages, headers, credentials and account contents are never printed.
The operator still verifies authoritative Auth absence before advancing; diagnostics
never clear the latch or trigger retries. Transport/unknown failures remain uncertain.

One authorized reconciliation returned HTTP 403 SERVICE_DISABLED. A subsequent
read-only Auth lookup identified identitytoolkit.googleapis.com against consumer
projects/764086051850, rather than the intended project 243252492098. This does not
establish that Identity Toolkit is disabled on the Taskify project. Do not enable
services on the reported foreign consumer project or clear either job's controls.

Correct local ADC using a Firebase-supported Desktop OAuth client configuration
(or an approved service-account identity), then inspect and explicitly reconcile the
same jobs. Standard gcloud end-user OAuth credentials are not accepted by Firebase
Authentication; see https://firebase.google.com/docs/admin/setup#test_with_gcloud_end_user_credentials.
No successful Auth removal or fence retirement was established in this checkpoint.

## Windows tooling and ADC setup used during UAT

Run commands from the repository root, for example:

```powershell
Set-Location C:\DD\Projects\TaskifyIt\taskify-slice-verification
node --version
npm.cmd --version
npm.cmd ci --ignore-scripts
npm.cmd --prefix tools/account-deletion ci --ignore-scripts
npm.cmd --prefix tools/account-deletion run typecheck
node node_modules/firebase-tools/lib/bin/firebase.js --version
```

Use pinned Node 24.21.0/npm 11.19.0. Root dependencies supply TypeScript and Firebase
CLI; the separate operator install supplies firebase-admin and local tsx. A global
tsx is insufficient. Use npm.cmd in PowerShell when npm.ps1 is blocked; no execution
policy change is necessary. Its full path is `C:\Program Files\nodejs\npm.cmd`.

Firebase CLI login is separate from operator ADC. Existing CLI login was reused for
hosting/policy checks. If setting up a new machine, authenticate the approved
operator account interactively, then confirm the CLI project identity:

```powershell
node node_modules/firebase-tools/lib/bin/firebase.js login
node node_modules/firebase-tools/lib/bin/firebase.js projects:list
```

These commands do not authorize deployment. Cloud operator runs use ADC, not Firebase
CLI tokens. Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install),
open a new PowerShell window, and verify `gcloud --version`.

The initial plain `gcloud auth application-default login` configuration allowed
inspection but Auth deletion returned HTTP 403 SERVICE_DISABLED for consumer
project 764086051850. Do not enable services on that foreign project. The working
UAT configuration used the following Desktop OAuth client procedure:

1. Select project `taskify-dev-dpdhole` (number 243252492098) in Google Cloud Console.
2. Open Google Auth Platform → Clients → Create client → Desktop app.
3. Name it `Taskify local operator`; leave the AI-powered-agent checkbox unchecked
   for this fixed administrative script. Preserve existing provider/web clients.
4. Configure the consent screen/test-user access if required for the operator account.
5. Download the client JSON to a private location outside Git.
6. Authenticate with that file and the authorized operator account:

```powershell
gcloud auth application-default login --client-id-file="C:\private\taskify-desktop-client.json"
```

This follows [Firebase's local end-user credential requirements](https://firebase.google.com/docs/admin/setup#test_with_gcloud_end_user_credentials).
The project ID is already pinned in operator initialization. ADC may persist refresh
credentials in the local gcloud credential store; never copy them, tokens or client
JSON into source, logs or chat. An existing GOOGLE_APPLICATION_CREDENTIALS overrides
the normal local ADC location: check for an unintended override if login has no effect.
Do not set GOOGLE_CLOUD_QUOTA_PROJECT as a workaround; this operator rejects it.
Never use cloud credentials alongside emulator endpoint variables.

Verify IAM on the actual ADC principal: project metadata get; Firestore entities
get/list/create/update/delete; Firebase Auth users get/delete. CLI-principal checks
alone do not prove ADC permissions. Successful inspect proves read access, not Auth
delete permission. After ADC correction, inspect the same job before reconciliation.
The owner subsequently reported both UAT jobs complete with fences retained; see
[exact UAT attribution](../../docs/slices/05A-delete-account/qc-promotion.md).

## Command and option reference

| Command | Behavior |
|---|---|
| inspect | Read-only target, inventory and Auth identity inspection |
| execute | Starts only from requested; cleans data, removes Auth last, retains fence |
| resume | Reconciles unfinished work; auth_deleting needs both recovery flags |
| retire | Always blocked before connecting; no retirement implementation enabled |

| Option | Requirement |
|---|---|
| --project | Required; taskify-dev-dpdhole only |
| --project-number | Required; 243252492098 only |
| --uid | Required; exact original request UID, never email or fresh replacement UID |
| --job-id | Required; persisted job UUID for that UID |
| --confirm-job | Every command except inspect; exactly equals --job-id |
| --reconcile-auth | resume only, paired with --prior-run-stopped for interrupted Auth work |
| --prior-run-stopped | Attests prior process stopped and external call settled/reconciled; not a force flag |
| --emulator | Synthetic loopback testing only; requires Auth 127.0.0.1:9099 and Firestore 127.0.0.1:8080 |

Exactly one command is accepted; unknown options are rejected. There is no help flag,
email lookup, bulk execution or force override. Running --help returns invalid-target.

### Copyable cloud command templates

Replace placeholders once from the accepted request and inspect before authorizing.
These variables are not credentials. Do not point them at the fresh workspace UID.

```powershell
$deletionUid = "<ORIGINAL_UID>"
$deletionJob = "<PERSISTED_JOB_UUID>"
$deletionTarget = @('--project', 'taskify-dev-dpdhole', '--project-number', '243252492098', '--uid', $deletionUid, '--job-id', $deletionJob)

# Read-only. Review exact target and inventory first.
npm.cmd --prefix tools/account-deletion run operator -- inspect @deletionTarget

# Irreversible; only after authorization for this exact project/UID/job.
npm.cmd --prefix tools/account-deletion run operator -- execute @deletionTarget --confirm-job $deletionJob

# Ordinary interrupted cleanup: inspect first, ensure previous run stopped.
npm.cmd --prefix tools/account-deletion run operator -- resume @deletionTarget --confirm-job $deletionJob

# auth_deleting only: use after prior process/call reconciliation, not on timeout alone.
npm.cmd --prefix tools/account-deletion run operator -- resume @deletionTarget --confirm-job $deletionJob --reconcile-auth --prior-run-stopped

# Read back state, independent inventory and Auth presence after completion/failure.
npm.cmd --prefix tools/account-deletion run operator -- inspect @deletionTarget
```

Run one applicable mutation, not all templates as a batch. Resume at awaiting_retirement
can verify Auth/data and repair a missing deadline under the original authorization;
it is not read-only. Normal success reports awaiting_retirement, accountRemoved=true,
controlRetired=false, retirementEnabled=false and retireNotBefore. The deadline alone
never enables retirement. Inspect should then show empty counts and authPresent=false.

| Outcome | Next step |
|---|---|
| job-mismatch | Check exact persisted jobId and matching --confirm-job; never edit job controls |
| validation-or-infrastructure-failure plus metadata warning | Configure ADC; CLI login alone is insufficient |
| stage-pending | Inspect durable state; use appropriate resume instead of repeat execute |
| busy / lease-lost | Confirm other processes stopped; wait/reinspect, never force takeover |
| auth-uncertain | Inspect Auth presence; diagnose credentials/HTTP status before explicit reconciliation |
| 403 SERVICE_DISABLED | Check credential consumer/project and Desktop ADC configuration; do not enable unrelated services |
| auth-changed / unsupported inventory | Stop for investigation; never substitute another UID or bypass validation |

Do not assume a failed command rolled back prior cleanup. Lost Auth acknowledgements
are reconciled by lookup. Sanitized diagnostics never establish successful deletion
without authoritative absence. Keep both the control and immutable Auth anchor intact.
