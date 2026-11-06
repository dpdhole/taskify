# Slice 5A — Real-provider and T7 verification procedure

Updated 6 November 2026. T7 procedure remains **unexecuted** and is **not destructive-run authority**.
Partial owner UAT evidence is recorded in the [QC report](05A-delete-account-qc-promotion.md).
Controlling scope: [DA1](05A-delete-account-contract.md) and the
[release preflight](05A-delete-account-release-verification.md).

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

Use the [operator setup and ADC runbook](../../tools/account-deletion/README.md)
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
alone cannot establish T7. Current retire always blocks before connecting; do not
clear the fence manually. Any future positive retirement canary needs reviewed
implementation and separate exact-target approval.

After same-provider registration creates UID B, keep A's target variables unchanged.
Verify B cannot access A's job/data, and an explicitly authorized resume of A's
awaiting_retirement job leaves B intact. That resume can write control metadata;
it must not be described as read-only. Real stale-token/queued-write/stream probes
require a controlled client harness; the operator CLI is not a substitute and
these templates do not claim those probes have been executed.

## 6 November 2026 — Independent post-removal read-back

[Read-only evidence](05A-delete-account-post-removal-evidence.json) confirms both
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
