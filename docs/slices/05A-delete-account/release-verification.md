# Slice 5A — Cloud preflight and release verification checkpoint

The final review is complete for the owner-accepted supervised testing scope.
The [closure record](closure.md) carries the distinct deployed recovery rehearsal
and broader rollout checks as follow-up work. The dated review below supplies
artifact identity, evidence and the prepared rehearsal procedure.

## Recovery review, 24 November 2026

This review supersedes the release-readiness statements in the historical
5 November checkpoint below. T7 live post-retirement write evidence is recorded,
while general retirement acceptance remains open. This checkpoint performed
read-only cloud inspection and local validation.

### Current recoverable artifact

| Item | Reviewed value |
|---|---|
| Target | Existing QC channel at taskify-dev-dpdhole--qc-6130iy0v.web.app |
| Hosting version | c11eb2d24b38e44e |
| Current release | 1795490723572000 |
| App/build | 0.3.0 / 3acadd26609f-41b33b3697e4eddb |
| Source | Clean commit 3acadd26609ff03988db99689e0c0fac4b17b296 |
| Local source and artifact | Sibling worktree taskify-qc-host-renewal, branch fix/qc-host-renewal-20261124, dist-auth |
| Retained files | index.html, release.json, JS and CSS; all four hashes match HTTPS |
| QC expiry | 24 December 2026, 08:41:40 IST |
| Backend compatibility | DA1 Rules, revision 3/serverRelease 3, app minimum/maximum 0.3.0 |
| Auth hostname | New QC hostname independently confirmed authorized |

[Read-only recovery evidence](recovery-review-evidence.json) contains current
channel identities, clean release metadata and file hashes. The existing dev
version 16f946a5cd6a587a is app 0.3.0 but lacks the new QC hostname. Its restoration
already produced the Auth/compatibility configuration error. App version equality
alone therefore cannot select a recovery artifact for the recreated QC channel.
The subsequent hostname fix demonstrated forward recovery to the sign-in screen.
It did not exercise a distinct deployed rollback and restoration sequence.

### Remaining release gates

| Gate | Assessment | Completion evidence |
|---|---|---|
| Recovery artifact provenance | Current clean artifact verified | Preserve exact files/hash manifest and version availability before a future release |
| Hosting recovery rehearsal | Pending | Approved QC switch to a distinct compatible candidate, restoration of saved version and independent browser/cloud read-back |
| Shared policy/Rules safety | DA1 and revision 3 independently read during the live write check | Capture exact before/after identity around the rehearsal; retain all supported accountDeletion fields/fence checks |
| Pending deletion recovery UI | Local controller and component tests pass; prior live second-tab/status recovery recorded | Show current recovery build on an already-requested disposable job, with workspace hidden and refresh/logout functional |
| Current provider/device matrix | Earlier evidence spans older build/hostname | Current QC Google and Microsoft personal popup and real mobile redirect, including proof cancellation and same UID return |
| Build/operator provenance | QC fixed source is clean; T7 operator/harness/evidence changes remain uncommitted in verification checkout | Review and commit the final operator/harness changes and preserve exact lockfile/toolchain identity before release acceptance |
| Operator permissions and environment | Prior live actions succeeded | Recheck the selected operator principal's permissions, endpoint identity, billing/resource baseline before rehearsal execution |
| Final owner acceptance | Pending | Explicit acceptance of the remaining T7 assumptions and completed T8 evidence |

### Reviewable QC recovery sequence

1. Record the existing QC release/version and expiry, exact active Rules hash and
   compatibility content/revision. Capture bounded job state/count metadata and
   comparison hashes for the selected fixtures. Select the exact operator source.
2. Verify the saved c11eb2d24b38e44e version is still finalized and the retained
   artifact hashes match. Confirm its current-host support and app 0.3.0 capability
   families. Verify provider callbacks, allowed Auth domain and API-key restrictions
   without retrieving secret values. Record source and destination before changes.
3. Select a distinct reviewed clean compatible rehearsal candidate. Approve QC for
   both the candidate switch and restoration to the saved version in one bounded
   instruction. A same-version clone is a no-op and cannot prove recovery.
4. Switch only QC Hosting to the approved candidate. Verify its expected identity
   and UI, then restore the saved version with the command below. Inspect any
   ambiguous response before retrying. Preserve the before/after release identities.
5. Verify restored HTTPS hashes, headers, bare-root refresh and 390px/desktop layout.
   Check compatibility readiness, normal sign-in and a pending deletion status UI.
   Use an existing requested fixture if available. Creation or processing of another
   deletion request requires the normal explicit target workflow.
6. Independently compare policy, Rules, fixtures and unrelated channel identities.
   Record any expiry adjustment by the Hosting service. Resolve each discrepancy
   before acceptance. Application restoration preserves the DA1 backend contract
   and the original deletion jobs' monotonic states.

The following restoration template targets the reviewed version and QC only. It
is prepared for the approved rehearsal and was not executed by this review.

```powershell
node node_modules/firebase-tools/lib/bin/firebase.js hosting:clone taskify-dev-dpdhole:taskify-dev-dpdhole@c11eb2d24b38e44e taskify-dev-dpdhole:taskify-dev-dpdhole:qc --project taskify-dev-dpdhole --config firebase.hosting.json --non-interactive --json
```

Require the existing QC channel before this command. CLI cloning into an absent
channel can create it and synchronize an Auth domain. Expired channels therefore
need separate recreation review. The current candidate's same-site version can
be reused by a new release without rebuilding. [Hosting version cloning](https://firebase.google.com/docs/hosting/manage-hosting-resources).

For backend incidents, hold retirement and preserve existing fences. Prepare a
corrected Rules/policy pair with DA1 semantics and monotonic compatibility revision,
using the publisher's expected-revision transaction guard. Never use a stale
revision-3 candidate to overwrite a later revision. Restore a compatible client
before resuming operator work. Lost Auth outcomes require exact-job reconciliation
with the prior-run-stopped attestation. Unexpected recreated old Auth/data requires
incident investigation and separately authorized correction.

### Local review checks

Seventy-five focused domain, operator, controller, canary and compatibility
publication tests passed. Five deletion UI component tests passed. Operator
typechecks and revision-3 candidate validation passed. These checks substantiate
the local recovery behavior and publication guards. The historical Rules/operator
emulator results and live tests retain their recorded scope. A deployed rollback
rehearsal and the current provider/device matrix remain outstanding.

## Historical preflight, 5 November 2026

5 November 2026. Owner instructed proceeding to real-provider, cloud, T7 safety and
release verification. Non-destructive checks completed first. This record does not
authorize publication or deletion of an unspecified account. Slice 5A is unaccepted.

## Exact prepared candidate

| Item | Prepared value |
|---|---|
| Source | Clean commit 78e59efd127325e6b40bac7249d7a0035ef31d1a |
| Application | 0.3.0 |
| Build | 78e59efd1273-cf161c48e0041603 |
| Artifact | 27 public files; hashes in accompanying evidence |
| Policy | Format 1, revision 3, serverRelease 3, min/max app 0.3.0 |
| Candidate Rules SHA-256, normalized LF | 6bea05acb65fd66f39f71964b7e4356d15057fb8b903dad2792cb7bbe6ff8536 |
| Proposed destination for approval | Existing dev channel; not yet authorized for this release |
| Project/database | taskify-dev-dpdhole / 243252492098 / (default) |

The Auth artifact was built from a clean tree before this documentation update.
It is isolated at .local/slice5a-verification/hosting with module graphs/maps excluded.
The reviewed source build is immutable; documentation changes do not rewrite it.
No commit, push or merge occurred. The recorded origin/main-only commit 8a85afc is
Slice 10 documentation; it was inspected, not merged or treated as implementation.

## Checks performed

- Existing operator CLI login read the exact active project. Billing remains
  disabled with no attached billing account. Default Firestore remains Native,
  asia-south1, pessimistic concurrency, with deletion protection enabled.
- Active compatibility remains revision 2/serverRelease 2, min/max app 0.2.0. The
  deployed Rules remain ruleset 5592c9e1-4db4-4658-b551-efc181840abc, normalized source
  SHA-256 445e474d22abbe1dee1d746436e96dd92411531734332090ae953ed6746b416f.
  They differ from the candidate as expected. No policy or Rules was deployed.
- Candidate Rules passed the Firebase Rules service's source-only syntactic/semantic
  test with zero errors/warnings. No test cases or application requests were sent
  through that compilation call. Compilation is not cloud request-budget/fence proof.
- Google and Microsoft providers remain enabled; Apple is also configured but stays
  outside the approved active testing scope. Existing localhost and dev/qc/uat
  domains are authorized. No OAuth secrets/key values were requested or logged.
- The CLI principal's testIamPermissions result grants all eight requested operator
  permissions: Firestore entities get/list/create/update/delete, Auth users get/delete,
  and project metadata get. This is not verification of a separate ADC principal.
- Operator ADC is not configured in the checked environment; no credential was
  created or exported. gcloud is not available on PATH. ADC provisioning remains
  a separate setup action before operator cloud execution.
- No accountDeletion requests currently exist (first page empty, no continuation).
  The initial minimal-field query was corrected after a 400 response; the corrected
  count read succeeded. No account/workspace inventory or identity list was exported.
- Current dev HTTPS release is still app 0.2.0, build 02458ffb68d1-6a446b9f4ba6aaed,
  commit 02458ffb68d1280f86ff4545284fe6d76023ec3a, Hosting version 40e35b075db747cb.
  qc/uat/live metadata was read without modification.
- Local Hosting verified all 27 artifact hashes, cache/security headers, SPA fallback
  and internal-file exclusions. Real public cloud compatibility reads on mobile 390px
  and desktop 1280px correctly show client-ahead, block sign-in, survive refresh,
  produce no page errors and have no horizontal overflow. An initial 127.0.0.1 run
  hit the explicit host restriction; rerunning at approved localhost passed.
- Local auth configuration and standalone candidate-policy validation pass.
  These checks do not count as OAuth sign-in, provider proof or T7 execution.

Read-only cloud metadata and source compilation occurred around 19:08–19:15 IST.
The machine evidence retains UTC observation/build timestamps. Application records,
Auth users, active Rules/policy, channels, billing and credentials are unchanged.

## Reviewable publication proposal — approval still required

The [channel policy](../../hosting_channels.md#explicit-instructions) requires a named
destination: "Every hosting/deployment request must clearly name its destination".
The current instruction named verification, not dev/qc/uat/live. Proposed next step:

1. Approve existing **dev** for the exact artifact above, plus shared DA1 Rules and
   revision 3 policy. All preview channels share this backend; the 0.3.0 floor blocks
   older clients and there is a short gate-blocked interval during rollout.
2. Recheck current policy revision 2 and active Rules hash immediately before apply.
   Deploy exact DA1 Rules first while serverRelease 2 still blocks intent creation.
3. Publish revision 3 with expected-revision 2 compare-and-set, then the pinned dev
   Hosting artifact. Use --no-authorized-domains; do not alter other channels or
   provider configuration. Retain reviewable resource/hash evidence.
4. Verify dev HTTPS bytes, headers, build, readiness, recovery and old-client blocking.
   Rollback must keep DA1 fence semantics and the 0.3.0 policy floor; use a compatible
   recovery artifact rather than admitting 0.2.0 or clearing pending jobs.
5. Perform non-destructive real-provider proof first, cancelling before final intent.
   Actual mobile redirect observations require the owner's selected device/account;
   desktop emulation is not a substitute. Slice 4 linking remains held.

No publication has been executed. The .local deployment configuration is a proposal,
not a grant to publish. Any uncertainty in a mutation must be read back before retry.

## T7 and destructive verification prerequisites

See [T7 procedure](t7-verification.md). It requires approved
operator ADC and an exact sacrificial project/UID/job produced by the real request
flow. The prior agreement requires explicit destructive targeting for each run;
general verification permission does not select an account to erase. Capture the
target from the accepted request, inspect its inventory, then obtain target-specific
operator execution authority. Do not manufacture admission evidence administratively.

No real-provider test, Auth deletion, stale-token probe or fence retirement ran in
this checkpoint. The retire command remains disabled. Positive retirement/rollback
verification cannot be claimed until its guard implementation and T7 evidence are
reviewed; elapsed time or Rules compile success is insufficient.

## Evidence

[Machine evidence](release-verification-evidence.json) contains
only public build/hash/configuration and sanitized administrative metadata. No raw
tokens, provider secrets, account emails or user record contents are stored there.
Temporary build/check scripts remain ignored under .local/slice5a-verification.
No executable source, commit, push or publication is included in this report.
