# Slice 5A — Real-provider and T7 verification procedure

The owner accepted [supervised test-support closure](closure.md) on 24 November.
The scoped experiments below pass as recorded. General retirement acceptance
and its remaining assumptions are explicit follow-up work.

Updated 24 November 2026. The assessment below reconciles the dated observations.
T7 remains open for general retirement acceptance.
Partial owner UAT evidence is recorded in the [QC report](qc-promotion.md).
Controlling scope: [DA1](contract.md) and the
[release preflight](release-verification.md).

## Current gap assessment, 24 November 2026

| Requirement | Evidence and result | Remaining qualification |
|---|---|---|
| Valid write baseline | Original-token REST batch accepted four records before fencing on 24 November | Owner-supplied event preserved in chat; the later export lost its history |
| Online and existing stream fencing | Online recreation denied and preexisting profile stream returned permission-denied | Live observations apply to the recorded clients and runs |
| Queued before intent | Valid four-record batch queued before fencing and denied on reconnect | [Pre-fence queue evidence](pre-fence-queue-evidence.json) |
| Write commits before fence | Four records independently found and later cleaned | [Write-first evidence](live-overlap-pre-cleanup-evidence.json) |
| Write completes after fence | Partially transmitted REST request completed after the exact requested fence was observed and returned 403 | [Fence-first evidence](live-fence-first-evidence.json); full server receipt before admission was not established |
| Refresh and expiry | Refresh rejected after deletion; captured original tokens returned 401 after expiry and trusted deadlines | Nominal token lifetime alone does not bound every request already executing |
| Trusted retirement and stale worker | Exact anchor/deadline, repeated empty/Auth checks and final transactional lease validation | Live exact-job canaries plus emulator stale-worker coverage |
| After retirement | Original-token read and four-record write returned 401; independent old namespace absence and comparison hashes matched | [Write evidence](live-write-canary-post-write-evidence.json); owner-reported HTTP result and independent administrative state checks are distinct |
| Fresh identity isolation | Own reads allowed, cross-UID reads denied, old-job resume and retirement preserved comparison workspace | [Client checks](client-isolation-evidence.json), [resume checks](resume-isolation-evidence.json) |

The outstanding client-write case is a fully delivered operation already executing
inside Firestore when intent commits, especially an operation whose authorization
could precede its eventual commit. Transport overlap alone cannot establish that
internal ordering. Firestore documents transaction serializability by commit time,
but that statement alone does not establish an authorization-to-commit bound for
every supported nontransactional write path. The documented 270-second transaction
limit applies to transactions. Applying it to every Commit request would be an
unsupported inference. Review the supported write paths and their authoritative
ordering guarantees before accepting the general retirement bound. Another expiry
or partial-body canary would repeat existing evidence. [Transaction isolation](https://firebase.google.com/docs/firestore/transaction-data-contention),
[transaction limits](https://firebase.google.com/docs/firestore/quotas).

The final Auth absence check and Firestore control deletion are separate service
operations. A privileged writer or Auth creator could act between those operations.
The lease fences this operator's transactional mutations, while privileged external
actors require operational quiescence and an explicit no-old-UID-recreation policy.
The current canaries establish preservation in their controlled environment. A
general retirement release needs the responsible operator, access restrictions and
incident handling recorded for this assumption. Server client libraries bypass
Security Rules. [Rules and IAM](https://firebase.google.com/docs/firestore/security/rules-structure).

Firebase documents one-hour ID tokens and refresh-token expiry on user deletion.
The 4,200-second interval adds a ten-minute margin. Neither that documentation nor
these finite observations establishes an undocumented propagation bound for every
in-flight request. Retain the general retirement gate until the remaining ordering
and quiescence assumptions are accepted or the contract is revised.
[Auth sessions](https://firebase.google.com/docs/auth/admin/manage-sessions).

The ordinary cloud retire path remains disabled. The dated exact-job canary window
is a test guard and expires at 11:56:50 IST on 24 November. Existing retained jobs
require their own review and authority. Final slice acceptance also requires the
provider matrix on the current QC build, held-linking qualifications and T8 recovery
evidence. [Release recovery review](release-verification.md#recovery-review-24-november-2026).

## Preconditions and evidence discipline

- Publish the reviewed 0.3.0/DA1 Rules/revision 3 to an explicitly approved destination.
  Verify exact deployed identities, policy floor and actual operator ADC permissions.
  Preserve billing, other channels and provider configuration.
- Select a sacrificial Google or Microsoft personal Taskify identity with no needed
  application records. Establish UID A from the authenticated session, never email
  lookup. Keep linked-method testing qualified by the unresolved Slice 4 hold.
- Obtain user confirmation through typed DELETE and fresh provider proof. Record
  accepted UID/job/inventory/control state. Inspect the exact target before obtaining
  explicit authority to run its operator cleanup/Auth deletion. No arbitrary UID,
  fabricated request, test-only proof bypass, global sweep or force flag.
- Tokens stay only in ephemeral memory of the controlled test process/browser.
  Disable HAR, network traces, request-header logs and screenshots containing tokens
  or account details. Persist only test IDs, timings, bounded status/error codes,
  aggregate counts and hashes. Losing the process may require a new test, not raw
  credential recovery from files. Do not expose tokens in chat or source control.

## Provider and UID-isolation matrix

1. For each approved provider, verify normal sign-in/restoration/Logout, then popup
   proof and cancel before submitting intent. Check the original UID is unchanged
   and no request exists. Repeat actual mobile redirect with same-UID return and
   explicit final-request boundary. Record browser/device/build and owner-reported
   versus independently observed evidence separately.
2. Test cancelled/failed/wrong-account verification and account switching. Confirm
   no deletion request is sent. Test compatibility/network loss without bypassing
   admission. Do not claim the held linking defect is resolved by this evidence.
3. For the exact authorized deletion job, observe second-tab recovery and refusal
   to provision while A's Auth still exists, including after data emptiness. Logout
   does not cancel the operator. Unknown outcomes remain blocked/reconcilable.
4. After verified Auth removal, register the same provider identity again and record
   distinct UID B. B may initialize while A remains fenced; it cannot read A's job,
   data or markers. Resuming A's job must leave B untouched. Formerly linked-method
   re-registration/conflict coverage stays pending where linking is unaccepted.

## T7 observations

Keep a normal online client, an offline/queued client and an already-open SDK stream
for A under controlled observation. Capture relevant issuance/expiry metadata in
memory. Use legitimate schema-valid initialization/provisioning writes as probes;
a malformed or intrinsically prohibited write is not proof that fencing works.
Never use B's namespace for A's probes.

| Phase | Required observation |
|---|---|
| Before intent | Baseline admissible write path is established without creating unnecessary user data |
| Intent committed, Auth present | Rules deny new/pending writes and provisioning; second client hides content |
| Data verified, Auth deletion | Independent emptiness and exact pinned identity; interruption/unknown responses reconcile; Auth absence confirmed |
| Auth absent, fence retained | Old credentials cannot refresh; stale/offline/queued attempts cannot recreate data; new B remains independent |
| Safety window | Preserve the fence through at least 4,200 seconds from the resolved trusted absence anchor, not intent or local clock |
| Expiry/stream checks | Distinguish authenticated Rules denial from actual expired/revoked credential rejection; inspect stream closure/reconnection and already-in-flight outcomes |
| Retirement eligibility | Recheck Auth absence, full inventory emptiness, immutable job/anchor and current lease; no unsupported versions or uncertain operations |
| After separately approved retirement canary | Old A cannot recreate data; B remains untouched; no controls are cleared merely to make a test pass |

An expired-token 401/UNAUTHENTICATED response is different from a 403/PERMISSION_DENIED
caused by the retained fence. A fenced denial alone does not establish safety after
fence removal. SDK automatic anonymous fallback on a public read is also not proof
that an old token remains valid. Record the actual authorization layer and outcome.

One-hour ID-token lifetime and refresh-token invalidation on user deletion supply
platform constraints, not complete application proof. The extra ten-minute margin
does not establish an undocumented propagation bound. Review open-stream and delayed
request behavior explicitly; do not replace real elapsed platform behavior with a
fake clock or emulator-only test.

## Retirement gate and failure handling

The current retire command is disabled before connecting. Do not bypass it or remove
the fence by hand to obtain a passing result. A positive retirement canary needs a
reviewed guarded implementation and separately authorized exact lab target after
the preceding safety prerequisites. If the evidence cannot justify that operation,
retain the fence and report T7 inconclusive. No production retirement enablement
follows automatically from a single canary or the scheduled deadline.

Unexpected admitted writes, recreated old UID, unsupported inventory, Auth lookup
uncertainty or a safety-bound failure stops the test. Preserve control metadata,
capture content-free evidence and request explicit reconciliation; never delete a
substitute UID, roll back the job state, fabricate completion or silently expand
scope. Keep real accounts/workspaces outside the selected target unchanged.

After T7 is supported, review contract/implementation changes and targeted local
tests before enabling any retirement path. Slice 5A closure still requires owner
acceptance and coordinated release/rollback evidence.

Platform references reviewed 5 November 2026:
[Firebase sessions](https://firebase.google.com/docs/auth/admin/manage-sessions),
[Firestore Rules conditions](https://firebase.google.com/docs/firestore/security/rules-conditions).

## Operator command templates for verification

Use the [operator setup and ADC runbook](../../../tools/account-deletion/README.md)
first: root and operator dependencies, pinned tooling, Desktop OAuth client ADC,
actual ADC principal permissions and no mixed emulator/cloud configuration.
Firebase CLI login does not authenticate the operator. These commands use PowerShell
npm.cmd to avoid execution-policy errors. They do not create a deletion request;
obtain that request through the real provider/UI flow first.

For each separately authorized test account A, use its original UID and persisted
job UUID. Never use replacement UID B in these commands:

```powershell
Set-Location C:\DD\Projects\TaskifyIt\taskify-slice-verification
$deletionUid = "<ORIGINAL_UID_A>"
$deletionJob = "<PERSISTED_JOB_UUID>"
$deletionTarget = @('--project', 'taskify-dev-dpdhole', '--project-number', '243252492098', '--uid', $deletionUid, '--job-id', $deletionJob)

# 1. Read-only preflight after real intent admission.
npm.cmd --prefix tools/account-deletion run operator -- inspect @deletionTarget

# 2. Requested state only, after exact-target destructive authorization.
npm.cmd --prefix tools/account-deletion run operator -- execute @deletionTarget --confirm-job $deletionJob

# 3. Read back after completion, interruption or unknown outcome.
npm.cmd --prefix tools/account-deletion run operator -- inspect @deletionTarget
```

Before step 2, establish the online/offline/queued/open-stream observations described
above; executing first and opening stale clients afterwards is not equivalent proof.
Do not run another mutation while a prior process or external operation is unresolved.
If inspection shows unfinished cleanup, select ordinary resume:

```powershell
npm.cmd --prefix tools/account-deletion run operator -- resume @deletionTarget --confirm-job $deletionJob
```

If inspection shows auth_deleting, resolve credential/API failures and establish
that the previous process stopped and its call settled or was reconciled. Only then:

```powershell
npm.cmd --prefix tools/account-deletion run operator -- resume @deletionTarget --confirm-job $deletionJob --reconcile-auth --prior-run-stopped
npm.cmd --prefix tools/account-deletion run operator -- inspect @deletionTarget
```

These are alternatives, not a batch to paste blindly. Keep the sanitized command
result, state, aggregate inventory, Auth-presence outcome and trusted timestamps.
Successful finalization reports awaiting_retirement/accountRemoved=true with
controlRetired=false and retirementEnabled=false. Inspection must confirm empty
inventory and Auth absence. Unknown outcomes require inspection, not replay.

Record the trusted authAbsentObservedAt/retireNotBefore fields without rewriting
them. Wait at least the specified 4,200 seconds from the trusted absence anchor
while executing controlled old-client probes. There is deliberately no sleep-then-
retire command template: elapsed time, successful resume and new-UID registration
alone cannot establish T7. Cloud retire blocks before connecting; do not
clear the fence manually. Any future positive retirement canary needs reviewed
implementation and separate exact-target approval.

After same-provider registration creates UID B, keep A's target variables unchanged.
Verify B cannot access A's job/data, and an explicitly authorized resume of A's
awaiting_retirement job leaves B intact. That resume can write control metadata;
it must not be described as read-only. Real stale-token/queued-write/stream probes
require a controlled client harness; the operator CLI is not a substitute and
these templates do not claim those probes have been executed.

## 6 November 2026 — Independent post-removal read-back

[Read-only evidence](post-removal-evidence.json) confirms both
original jobs are awaiting_retirement, their inventories are empty and their Auth
identities are absent. The distinct fresh UID has an Auth identity, workspace
initialization record and no accountDeletion fence. Both trusted retirement deadlines
were still in the future at observation; neither fence was changed.

This establishes independently observed post-removal state, not T7 completion.
Administrative inspection bypasses browser Rules, so cross-UID access denial and
operator-resume isolation remain separate checks. No pre-removal token, offline
queue or already-open stream evidence has been captured in this verification run.
If original client sessions still exist, preserve them without clearing storage,
then observe old-session access/refresh/offline replay under controlled testing.
If those sessions were replaced during re-registration, do not claim retrospective
coverage: a separately authorized sacrificial account run must establish baseline
online/offline/open-stream clients before deletion. Elapsed time alone is insufficient.
Retirement remains disabled; no canary or manual fence removal is authorized here.

### Original desktop tab after deletion — owner screenshot

On 6 November 2026 the owner identified an original desktop session after executing
deletion and supplied a screenshot. It shows Welcome to Taskify, You are signed out,
provider sign-in buttons, and diagnostics: app 0.3.0, build
78e59efd1273-cf161c48e0041603, session signed-out. Workspace content is not displayed.
This is owner-provided evidence of the visible signed-out state on the original tab.
Whether this happened without manual Logout, reload or storage clearing has not yet
been established. The screenshot alone does not demonstrate token expiry/revocation,
old authenticated write denial, offline replay or stream behavior. Preserve the tab
without new sign-in or storage clearing while clarifying those observations.

### Controlled two-tab repeat — owner report, 6 November 2026

The owner established Tab 2 as an untouched original session, with a screenshot
showing Workspace ready, session signed-in, app 0.3.0 and build
78e59efd1273-cf161c48e0041603. Tab 1 completed redirect provider proof followed by
explicit permanent deletion request for UID `jq2VPHjG43hZ0KJtdHzyT7icZB12`, job
`d5ce4f10-6487-4f92-af50-5f5a2d41def3`. This UID was previously the fresh replacement
workspace; it is now the original target of this third, owner-executed deletion run.

Owner-reported inspection showed requested, recognized initialization inventory,
authPresent=true and authMatches=true. Execution reported awaiting_retirement,
accountRemoved=true, controlRetired=false, retirementEnabled=false, and
retireNotBefore={seconds:1793980828,nanoseconds:543000000}. The owner confirmed the
fence is awaiting_retirement. No additional operator command was run by the agent.

The timing of the supplied signed-in screenshot relative to operator completion
is not established. It documents the untouched-tab setup but cannot yet establish
whether that tab automatically hid workspace content or signed out after admission
and Auth removal. Obtain its current untouched state before reload, Logout or new
sign-in. A signed-in Workspace ready display persisting after admission would be a
client recovery/isolation finding, even if server-side Rules deny operations; it
must not be counted as a passing observation. No claim of stale-token, queued-write,
stream or retirement safety follows from the operator success alone.

### Untouched Tab 2 live update — owner confirmed

The owner subsequently confirmed Tab 2 displayed confirmation without refresh and
provided a screenshot showing Account removal verified, temporary metadata awaiting
safe operator retirement, and Workspace access is blocked. The Workspace ready
content is absent; Refresh status and Logout remain available. This resolves the
previous uncertainty about the supplied baseline screenshot: the untouched tab
received the removal milestone and hid workspace content without manual refresh.

Record live cross-tab status propagation and workspace-content hiding as
owner-observed passes for job d5ce4f10-6487-4f92-af50-5f5a2d41def3. The header still
says signed in/session and compatibility verified; this screenshot does not show
automatic sign-out, token expiry, revoked refresh rejection, queued-write denial or
post-retirement safety. No such conclusions are claimed. Keep the fence retained.

### Tab 2 refresh after removal — owner confirmed

After the live confirmation observation, the owner refreshed Tab 2. The supplied
screenshot shows Welcome to Taskify, You are signed out and provider sign-in options;
workspace content is absent. Record post-removal reload/session-restoration recovery
as owner-observed passing for the third job. This is explicitly a refreshed tab,
not evidence of spontaneous sign-out. It does not identify the token rejection
layer or establish offline queued-write, expired-token or post-retirement safety.
The original uninterrupted stream observation ended when the tab was refreshed.

## Fresh-UID isolation checkpoint — 6 November 2026

The owner supplied current Firebase Auth UID `3C5SInr1sYYtjyHNy5Qvh9r8UrZ2` after
the third deletion. Cloud inspection established that its Auth identity and initialized
workspace exist and no deletion fence is present.

[Resume isolation evidence](resume-isolation-evidence.json) records hashes/counts
before and after guarded finalization/resume of completed old job
62abaeaf-af43-461e-9365-17e6fab81e66 for UID Td9Kpq9i67MiLUpOjy6nwUuVgWZ2.
The old job was checked awaiting_retirement, empty and Auth-absent before mutation.
The fresh workspace contained 78 documents both times with identical complete
path/content hash; the inspected Auth UID/creation-time fingerprint also matched.
The fresh fence remained absent; old Auth remained absent and its fence retained.
This independently verifies cloud old-job resume isolation for this pair. Raw
workspace contents were not persisted. The resume can update old control metadata;
this was not a read-only operation. No fresh-user writes or fence retirement occurred.

The isolated production Rules runner passed 102 tests across four files, including
cross-UID intent/status denial and distinct-UID initialization while old UID is
fenced. Operator units passed 28 tests. These are local/emulator access-isolation
checks, not live browser authorization evidence. Live fresh-user reads against old
job/data namespaces still need an authenticated client-context probe; privileged
Admin SDK reads bypass Rules and cannot establish that result. Stale-token/offline
queue/stream checks and retirement remain pending.

## Live authenticated-client cross-UID read denial — passed

At 2026-11-06 15:46:18.640 UTC (21:16:18 IST), the owner supplied the
[client probe result](client-isolation-evidence.json). Authentication matched
fresh UID 3C5SInr1sYYtjyHNy5Qvh9r8UrZ2. Its own profile and initialization records
were read successfully from the server, establishing a positive baseline. All nine
reads of the three old UIDs' accountDeletion controls, profile/main and
initialization/workspace returned permission-denied. A missing old record returning
not-found would not have passed: actual authorization denial was required.

This is owner-supplied live client-context evidence against taskify-dev-dpdhole,
not an Admin SDK or emulator check. The first sign-in used a mismatching account;
the harness blocked its reads. The owner retried the correct account, confirmed
matching UID, then ran the probe. No Rules bypass, custom token, Firestore write,
operator mutation or fence retirement was used by this read-only probe.

Together with the cloud old-job resume snapshot, this completes the scoped fresh-UID
read-access isolation and old-job resume isolation checks for the tested targets.
It does not prove every record family or cross-UID write denial, nor stale-token,
offline queue, open-stream or post-retirement safety. Those T7 gates and final
acceptance remain pending. All old fences remain retained.

## Instrumented cloud run preparation — 6 November 2026

The [T7 harness runbook](../../../tools/t7-safety/README.md) defines an interactive,
local-only instrumented procedure using a new disposable provider identity. The
owner selected that approach. Its valid initialization batch baseline, independent
online/offline Auth contexts, original-token capture, preexisting profile stream,
server-observed job anchor, post-removal queued/online reinitialization attempts,
refresh probe and sanitized export are implemented. No fence retirement is enabled.

Local validation passed 103 production Rules/adapter/provisioning cases, including
the exact baseline helper accepted before fencing and queued recreation denied
after cleanup. Harness/project type checks, lint and browser arming-guard checks
pass. The cloud observation run awaits the owner's disposable identity sign-in,
valid baseline and exact-target deletion request/authorization. No cloud T7 result
or completed safety window is established by harness preparation.

Important limitation: disconnection precedes deletion, but the queued recreation
candidate is added only after confirmed Auth/data removal so it is a create rather
than an always-forbidden update of existing initialization records. Already-queued
pre-fence/in-flight writes remain a separate coverage gap. No automatic T7 pass or
retirement follows from this narrower scenario.

## 7 November 2026 instrumented cloud run before token expiry

The authorized disposable UID s4A0u7QRNYXwau4HGNXOmEMmU6F2 and job
6d09f862-74b1-492f-a607-91b201120724 reached awaiting_retirement. Operator read-back
confirmed empty application inventory and Auth absence. The owner supplied the
[pre-expiry client observations](instrumented-t7-pre-expiry-evidence.json).

- The four-record baseline committed successfully. A server-backed profile listener
  was established before deletion and later returned permission-denied before
  operator cleanup. The job listener observed requested through awaiting_retirement.
- The online base reinitialization attempt and the offline client's queued attempt
  after reconnect both returned permission-denied after removal. The offline client
  was disconnected before deletion, and its write was queued after cleanup.
- The captured original ID token received HTTP 403 PERMISSION_DENIED before its
  advertised expiry. Forced SDK refresh then returned auth/user-token-expired.
  This refresh error is a separate observation from the captured-token read.
- The trusted absence anchor is 08:57:41.180 IST and the safety window ends at
  10:07:41.180 IST. Original token expiry is 09:47:24 IST. The owner plans to
  re-probe at or after 10:08 IST with the same in-memory token.

After-window token response and independent final inventory/anchor read-back are
pending. The retained fence and pre-expiry denial do not establish post-retirement
safety. Pre-fence in-flight write coverage remains open.

### After-window read-back and missed token probe

At 11:51 IST the owner reported an empty harness state. The raw token probe and
online write actions stopped locally because the original in-memory state was gone.
The reset cause is unknown. The original token's after-expiry response was not
observed, and signing in again cannot recover that observation.

The [independent after-window read-back](instrumented-t7-post-window-evidence.json)
confirmed that the trusted server time was past retireNotBefore. The exact job was
still awaiting_retirement, its inventory empty and Auth absent. Its trusted absence
anchor and retirement deadline matched the pre-expiry evidence. The before-expiry
stream, write denial and refresh rejection results remain valid for this run.

T7 remains incomplete. A new instrumented run would be needed to capture the
original token after expiry, with the harness page kept alive throughout. Pre-fence
in-flight writes and post-retirement safety remain separate coverage gaps.

### Repeat run interrupted by page refresh

The owner reused the disposable provider identity and obtained fresh UID
ZkReGAEwa8NRYOIxuI26YxNvPpE3. The four-record baseline committed, the profile
listener received a server snapshot, and the offline client disconnected. The
captured token advertised expiry at 13:02:11 IST on 7 November 2026.

The authorized execution of job 0dedc40f-cbfe-45c2-bb0f-f6b4798be3df completed.
Read-only inspection confirmed awaiting_retirement, an empty inventory and
Auth absence. The returned retirement deadline was 13:18:49.666 IST.

The owner reported that the harness automatically refreshed before the
post-removal probes. Vite HMR was disabled for this repeat and its server logs
showed no reload signal during the check. The refresh source remains unknown.
The page holds its token and client instances in memory, so a full reload loses
the original token and offline client. This repeat provides baseline and operator
read-back evidence. It does not supply the after-expiry token observation.

Before another destructive repeat, validate a capture setup that keeps the original
token alive through a harness-page reload while preserving the in-memory-only
credential boundary. Keep T7 open and both fences retained.

### Reload recovery validated locally

The loopback harness process now retains the original token in memory. The same
tab can recover its narrow, read-only probe using a random session-storage run
identifier. Synthetic browser validation used the same capture across two reloads,
preserved separate stubbed 403 and 401 results, and confirmed foreign-origin denial
and release. No live Firebase token was used by that test. A page reload still ends
the original SDK listener and queue, so those observations must be exported first.
The next live repeat needs a new UID/job and separate execution authorization.
See the [harness runbook](../../../tools/t7-safety/README.md).

### Live repeat with the local process capture

On 7 November 2026 the authorized job 77815785-032e-4cd8-a06b-780b6b590f5e
for disposable UID s0SIcYWa7CaO9vUqT38SoxyzM7P2 reached awaiting_retirement.
Operator inspection confirmed empty inventory and Auth absence. The
[owner-supplied pre-expiry observations](reload-resilient-t7-pre-expiry-evidence.json)
show the valid four-record write baseline and the existing profile stream rejected.
Both online and queued base recreation were denied. The local process captured-token
probe returned HTTP 403 PERMISSION_DENIED before expiry, and forced Auth refresh
returned auth/user-token-expired. No pre-deletion HTTP 200 event was supplied for the
raw token probe. The successful SDK baseline and stream are separate observations.

The original token advertises expiry at 13:20:30 IST and the trusted retirement
window ends at 13:34:29.778 IST. The owner can use the same capture at or after
13:35 IST, including after a tab reload if the local process remains alive.
The after-window response and independent final read-back are still pending.

### Recovered original token rejected after the safety window

The owner reported the same tab restored its capture reference at 13:23:27 IST.
The recovered probe for UID s0SIcYWa7CaO9vUqT38SoxyzM7P2 returned HTTP 401
UNAUTHENTICATED at 14:33:15 IST, after the token expiry at 13:20:30 and the
trusted window deadline at 13:34:29.778. This is the same capture whose
before-expiry read returned HTTP 403 PERMISSION_DENIED. The restored page shows
baseline/armed/removed false because its original SDK clients ended on reload.
Its run identifier recovered the original token read probe from local process
memory. It did not recreate the SDK listener or queue.

[Independent after-window evidence](reload-resilient-t7-post-window-evidence.json)
confirms the trusted server read was past the deadline. The exact job remains
awaiting_retirement, inventory empty and Auth absent. The trusted absence anchor
and retirement deadline match the earlier snapshot. No fence retirement occurred.

This closes the missing after-expiry original-token observation for the tested
run. The before-expiry stream denial, online write denial, queued recreation
denial and forced refresh rejection are recorded separately. The queued write
was created after cleanup. Pre-fence in-flight or already-queued writes and
post-retirement behavior remain outside this evidence. Retirement is disabled and
requires reviewed implementation, separate canary authorization and acceptance.

### Pre-fence queued replay prepared and tested locally

The owner released the captured token and downloaded sanitized observations for
the completed after-expiry run. The harness now supports a separate pre-fence
queue variant. It checks absent base records and fence, disconnects the second
client, queues the known valid base batch and verifies its local pending-write
metadata before QC initializes the workspace. Reconnect requires the server-observed
removal milestone. See the [harness runbook](../../../tools/t7-safety/README.md).

The production Rules emulator suite passed 104 tests. The new case accepted the
same base batch on an unfenced control UID, confirmed pending offline writes and
an empty server workspace before admission, then observed permission-denied on
replay after admission with an unexpired synthetic Auth context. The control
remained present and the base record absent. Typecheck, lint and browser guard
checks passed. The cloud variant awaits a fresh disposable UID and exact-target
authorization. Server requests already in flight and post-retirement behavior
remain separate gates.

### Live replay of a write queued before fencing passed

For disposable UID 0sGUioXWWwYy7Yc1n5FRavlO2kw1, the owner log records the valid
four-record initialization batch pending in the disconnected client while the
server base records and fence were absent. This preceded normal QC setup and
job 147eb917-a539-48bf-bdc7-ad5c64312eeb. The authorized operator verified data
removal and removed Auth, leaving the fence awaiting_retirement. On reconnect
after removal, the already pending batch returned permission-denied with
`timing: before-fence`. Independent post-replay inspection confirmed empty
inventory, Auth absent and the retained fence. [Live evidence](pre-fence-queue-evidence.json).

This closes the pre-fence offline queue replay gap for this test. The test holds
the batch in the SDK queue until reconnect. A request already traveling to or
processing at Firestore and post-retirement behavior remain separate coverage.

### Overlapping transaction and fence-absent model

The production Rules emulator suite passed 107 tests. The new cases cover:

| Case | Observed result |
|---|---|
| Initialization transaction reads the empty namespace, then the fence commits before its write commit | Permission denied. All four base documents remain absent and the fence is present. |
| Initialization commits first, then the fence commits | All four committed documents remain discoverable to the operator. Client profile reads are denied. |
| Fence absent, old client unauthenticated or authenticated as the new UID | Old namespace initialization denied. The new UID initializes its own workspace. |
| Fence absent, old UID still authenticated | Valid initialization is accepted under the old UID. The fresh UID's profile remains unchanged. This is the counterexample retirement must exclude. |

The transaction test pauses after a real emulator server read and resumes its
commit after admission. It covers overlapping transactions and the fence winning
commit order. It does not reproduce a write packet already sent to the live service
or establish expiry behavior of a previously authenticated live transport. Firestore
documents serialization by commit time. [Firestore transaction isolation](https://firebase.google.com/docs/firestore/transaction-data-contention#serializable_isolation_by_commit_time).

The fence-absent fixture starts without a control record. It models Rules behavior
without removing an existing fence. Its synthetic Auth context can remain valid
independently of Auth removal and expiry, so it cannot certify live post-retirement
behavior. The observed live original-token 401 and refresh denial remain separate
from this local counterexample.

### Remaining live verification and canary gates

- Exercise a valid initialization commit that overlaps live fence admission using
  a disposable identity and a controlled client transport. Keep the workspace
  empty until the test starts so invalid duplicate updates cannot mask the result.
  Use real provider proof and the normal deletion admission path. Record dispatch,
  fence acknowledgement, write outcome and independent inventory. A commit accepted
  before the fence must be included in cleanup. A commit evaluated after the fence
  must be denied. A delayed acknowledgement alone does not identify commit order.
- For retirement, review the exact-job implementation before a live canary. Require
  supported policy, verified Auth absence and empty inventory, unchanged trusted
  absence anchor and recomputed deadline, no unresolved prior operation, and an
  owned lease with a final transactional state/identity/anchor check. A read-back
  showing the window elapsed is insufficient by itself.
- Obtain separate authorization for the exact disposable retirement target. Capture
  credentials and client observations before removal, retain the capture through
  expiry, and verify old-client rejection with the fence present. After a guarded
  retirement, independently verify the control is absent, Auth and inventory remain
  absent, and old-client reads/writes remain rejected. Compare fresh UID records
  and Auth fingerprint before/after. Preserve sanitized results and stop on any
  unexpected old-UID admission. The current operator still rejects retire.

No live write overlap or post-retirement canary was run in this checkpoint.

### Live overlap harness and guarded synthetic retirement

The [live overlapping commit procedure](../../../tools/t7-safety/README.md#live-overlapping-commit-variant)
uses two client instances on one disposable UID. It uses linked-provider
reauthentication with an in-memory SDK client and the production admission adapter.
One bounded Firestore REST Commit and the intent admission are launched together.
The harness logs both outcomes and a commit timestamp when acknowledged. This
records client overlap while leaving the actual server ordering to observation.
The live run needs interactive provider proof and explicit deletion confirmation.

The operator now supports a guarded synthetic retirement on checked loopback Auth
and Firestore endpoints. It rechecks Auth absence and empty inventory, and performs
an exact-job transactional fence deletion under the current lease and trusted
server-time deadline. Tests verify early refusal, recreated Auth and unexpected
old data refusal, control absence after retirement, and a fresh UID unaffected.
The synthetic deadline is backdated solely in the fixture. Cloud `retire` still
blocks before connecting. A reviewed live gate and separately authorized exact
canary are required for post-retirement cloud evidence.

Validation passed 109 production Rules/adapter/provisioning tests and 10 operator
SDK emulator tests. The new REST tests verify the wire payload succeeds without a
fence and receives 403 with a fence. The browser smoke test verified the overlap
action refuses use without its prerequisites. No live race or retirement occurred
in this preparation checkpoint.

### Live overlapping commit won before admission

On 7 November 2026 the owner ran the overlap control for UID
bkdP7syrtWb1wcffev2DPTFdTaD2 and job 5d2cfa9b-dab1-47c4-8f94-54551eb0a137.
The commit was pending at intent dispatch. It returned HTTP 200 with commitTime
10:05:24.745449 UTC. The immediate intent result was unverified, followed by a
server job listener event of requested. Independent read-back resolved the
acknowledgement uncertainty without resubmitting intent.

The fence creation time was 10:05:24.843711 UTC, 98.262 ms after the writer
commit. Its record version was 1. All four base records exist with creation time
equal to the writer commit. Operator inspection reports requested, the exact
four-record inventory and a matching Auth identity. The before-fence winner is
therefore discoverable for cleanup. [Independent metadata](live-overlap-pre-cleanup-evidence.json).

Cleanup for this exact target requires separate execution authorization. This run
observed the live write-first ordering. The fence-first overlap result remains
emulator evidence. Cloud retirement remains disabled.

### Live write-first cleanup verified

The owner authorized execution for UID bkdP7syrtWb1wcffev2DPTFdTaD2 and job
5d2cfa9b-dab1-47c4-8f94-54551eb0a137. The operator completed data and Auth removal.
[Independent post-cleanup read-back](live-overlap-post-cleanup-evidence.json)
confirmed the four previously discoverable records are gone, the inventory is empty,
Auth is absent and the fence is awaiting_retirement. The trusted absence anchor is
15:39:19.252 IST and the safety deadline is 16:49:19.252 IST on 7 November 2026.
This verifies cleanup of the live write that won the race. A live fence-first
outcome and guarded cloud retirement remain open.

### Fence-first transport probe prepared

The [fence-first relay](../../../tools/t7-safety/README.md#fence-first-transport-variant)
starts a bounded HTTPS commit with an incomplete body before real deletion admission.
It releases the final byte only after reading the matching requested fence. The
relay accepts one exact-UID base batch per capture and uses Firebase client auth.
The synthetic transport and browser prerequisite checks passed. The original
write-first capture remains on port 5182, and the new mode runs on port 5184.
The live result awaits provider proof and explicit confirmation for a fresh UID.
Cloud retirement remains disabled pending review and a separately authorized canary.

### Write-first token rejected after the safety window

The owner-supplied recovered capture for UID bkdP7syrtWb1wcffev2DPTFdTaD2 returned
HTTP 401 UNAUTHENTICATED at 17:32:08.757 IST on 7 November 2026, after both the
advertised expiry and the 16:49:19.252 IST safety deadline. The same-tab recovery
restored the original capture reference. It did not reconstruct the SDK clients.

[Independent read-back](live-overlap-post-window-evidence.json) confirmed the
trusted server time was past the deadline, the inventory was still empty, Auth
was absent, the fence remained awaiting_retirement, and the absence anchor and
deadline matched the post-cleanup snapshot. This verifies the write-first case
through the retained-fence observation window. It does not exercise fence removal.
The live fence-first relay result and separately reviewed retirement canary remain open.

### Live fence-first transport denied

The owner supplied the live relay log for UID XHAEHgdMnqhoq8NHi0Sdks8KSee2 and
job cac7d65a-0edd-40fe-bfa3-6c70b0420fdf. The partial HTTPS body was sent before
intent dispatch. The listener subsequently observed requested, and the relay read
the exact fence before completing the body. The full request returned HTTP 403
PERMISSION_DENIED. Independent operator inspection confirmed requested, an empty
inventory and a present, matching Auth identity. The immediate intent acknowledgement
was unverified, resolved by the listener and read-back. No second intent was needed.
See the [live fence-first evidence](live-fence-first-evidence.json).

The observed causal order comes from the relay's exact-fence read before sending
the final byte. Browser and server timestamps use different clocks. This covers a
request in transit completed after admission. The write-first run covers a fully
accepted write included in subsequent cleanup. The fence-first job is ready for
separate exact-target Auth cleanup authorization. Cloud retirement remains disabled.

### Fence-first Auth removal verified

The owner authorized execution for UID XHAEHgdMnqhoq8NHi0Sdks8KSee2 and job
cac7d65a-0edd-40fe-bfa3-6c70b0420fdf. Execution reported account removal with the
control retained. [Independent post-cleanup read-back](live-fence-first-post-cleanup-evidence.json)
confirmed the inventory remained empty, Auth was absent, and the job was
awaiting_retirement. The trusted absence anchor is 17:39:05.462 IST and the
safety deadline is 18:49:05.462 IST on 7 November 2026. The captured writer token
advertised expiry at 18:34:33 IST. Its after-window observation is pending.

### Fence-first after-window read-back

At 09:09:03 IST on 8 November, the restored harness returned `capture-unavailable`.
The process retention deadline for this token was 20:34:33 IST on 7 November,
two hours after the advertised expiry. The after-window instruction gave the
start time and omitted the capture cutoff. The local probe stopped before sending
a Firestore request, so this target has no after-expiry HTTP outcome.

[Independent read-back](live-fence-first-post-window-evidence.json) confirms the
trusted server time was past the safety deadline, with empty inventory, Auth absent,
unchanged anchor/deadline and the fence still awaiting_retirement. The live
fence-first 403 and prior runs' after-expiry 401 results stand as separate evidence.
The next distinct gate is review of the guarded retirement path and one authorized
canary. A repeat of the fence-first deletion sequence is unnecessary for the
already observed write denial. A canary with a token probe needs a capture that
remains available for its full observation window.

### Retirement canary review prepared

The [review and canary plan](retirement-canary.md) records the demonstrated
scenarios, capture requirements, transaction guards and remaining cross-service
quiescence assumption. The final Auth check now follows renewal shutdown.
The harness capture-only mode reduces the prospective live canary to one ordinary
disposable deletion and a before/after observation of its original token. The
cloud operator retirement gate remains closed until the exact canary is reviewed
and authorized. No fence was removed in this checkpoint.

### Authorized canary interrupted before retirement

On 8 November 2026 the harness process stopped after the original token returned
401 with the fence present. The process restart restored the harness page and
lost the memory-only capture. Read-only Firebase inspection confirmed the
authorized fence still in `awaiting_retirement`, with empty inventory and Auth
absent. Live post-retirement verification remains open.
[Canary recovery record](retirement-canary.md#authorized-canary-stopped-after-a-crash).

### Replacement canary verified the post-retirement read

On 8 November 2026 the guarded operator retired the separately authorized
replacement fence and verified absence of its Auth and workspace inventory.
The same captured token returned HTTP 401 before and after retirement. The
comparison workspace's inventory and Auth fingerprints matched before and after.
Live post-retirement write verification remains open.
[Execution evidence](retirement-canary-execution-evidence.json).

### Post-retirement write probe prepared on 24 November

The local harness now supports an original-token four-record write baseline on
an empty disposable UID and one repeat attempt after token expiry. The process
keeps the baseline acceptance with the captured token across page reloads.
The live operator must independently establish exact-job retirement before the
repeat attempt. The expected result is HTTP 401 UNAUTHENTICATED followed by an
independent empty-inventory check and comparison workspace fingerprint check.
The two focused harness tests and application typechecks passed. The existing
transport test required loopback access and passed when run with that access.
This checkpoint prepares the harness. Live write evidence is pending.
[Instructions](../../../tools/t7-safety/README.md#capture-with-a-valid-write-baseline).

### Live post-retirement write rejected on 24 November

The owner supplied a successful four-record initialization commit baseline using
the original token for UID NI96NtWbYzSyepQE9cdP5PnbbEq1. After separately
authorized cleanup, Auth deletion and retirement of job
0c7f0ff6-47b6-4b8d-884f-caffe9da9a0d, the same captured token's four-record
write returned HTTP 401 UNAUTHENTICATED at 10:36:15.115 IST. The baseline and
later commit used the same payload generator and create preconditions.

Independent read-back after the write confirmed zero old inventory documents,
absent Auth and absent control. The comparison workspace retained its 78 records
with matching inventory and Auth fingerprints. Active Rules and policy 3 matched
the pinned preflight. An initial read-back failed, then a read-only retry passed.
[Post-write evidence](live-write-canary-post-write-evidence.json) records the
owner-reported HTTP outcome and independent state checks separately.

This closes the scoped live post-retirement write probe. Fully delivered writes
already processing at Firestore before fencing and the cross-service quiescence
assumption still require final T7 assessment. Slice acceptance and release recovery
verification remain pending.

The owner later supplied a downloaded observations JSON containing only a
capture-reference-restored event at 10:41:11.580 IST. Its top-level UID and expiry
were empty and it contained no write outcome. A subsequent page reload had reset
the in-page event history, so that export does not preserve the earlier baseline
or write result. The earlier chat-supplied write event at 10:36:15.115 IST and
independent post-write read-back remain the recorded evidence for this scoped
check. No additional live write is required to replace the empty export.
