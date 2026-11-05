# Slice 5A — Cloud preflight and release verification checkpoint

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

The [channel policy](../hosting_channels.md#explicit-instructions) requires a named
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

See [T7 procedure](05A-delete-account-t7-verification.md). It requires approved
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

[Machine evidence](05A-delete-account-release-verification-evidence.json) contains
only public build/hash/configuration and sanitized administrative metadata. No raw
tokens, provider secrets, account emails or user record contents are stored there.
Temporary build/check scripts remain ignored under .local/slice5a-verification.
No executable source, commit, push or publication is included in this report.
