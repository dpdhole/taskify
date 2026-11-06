# Slice 5A — QC promotion, 5 November 2026

Owner requested app 0.3.0/revision 3 on qc, then awaiting user UAT verification.
The exact dev Hosting version `16f946a5cd6a587a` was promoted without rebuilding.

- QC: https://taskify-dev-dpdhole--qc-xnxat620.web.app
- Source: clean commit `78e59efd127325e6b40bac7249d7a0035ef31d1a`.
- Build: `78e59efd1273-cf161c48e0041603`, app 0.3.0.
- Shared policy remains revision 3/serverRelease 3, app floor/ceiling 0.3.0.
- Exact DA1 Rules remain active; no backend policy or Rules publication was needed.
- QC expiry preserved: 22 November 2026, 13:19:33 IST.

All 27 HTTPS file hashes match the dev artifact. Cache/security headers pass.
At 390px and 1280px, compatibility becomes ready, both provider buttons are enabled,
refresh passes, and there are no page errors or horizontal overflow. An initial
browser request showed Site Not Found; retrying with a fresh URL passed both widths.
No provider sign-in or account deletion was performed.

Read-back confirmed unchanged billing, database, providers, Auth domains, shared
Rules/policy, dev/uat/live Hosting metadata and qc expiry. Only qc's release changed.
The separately committed button-spacing fix `7dd2be4` is not in this promoted
artifact; promotion preserves the existing dev version exactly.

**QC root URL access issue reported; UAT handoff is qualified.** The uat channel was not promoted.
Slice acceptance, real-provider/operator/T7 evidence and rollback rehearsal remain
pending; retirement stays disabled. No commit or push was performed.

[Promotion evidence](05A-delete-account-qc-promotion-evidence.json) records sanitized
metadata and checks. The [UAT procedure](05A-delete-account-t7-verification.md) remains
the controlling provider and safety verification sequence.

## Follow-up: root URL returns Site Not Found

The owner reported the bare qc URL still showing Site Not Found. Independent HTTP
checks reproduced a 404 at `/`, while a fresh query URL, `/index.html` and
`/release.json` returned 200 with the expected 0.3.0 build. This means the earlier
fresh-URL browser pass did not establish readiness of the bare root URL. The issue
is consistent with a cached negative response or serving-path inconsistency;
the precise cache layer is not established. It is not solely the owner's browser.

Temporary verification entry: `https://taskify-dev-dpdhole--qc-xnxat620.web.app/?verify=rev3`.
The bare root must pass independently before reporting the access issue resolved.
No deployment, policy change or channel recreation was performed during diagnosis.

## Owner UAT checkpoint — steps 1–12 confirmed

On 5 November 2026 the owner confirmed UAT steps 1–12 from the chat checklist,
covering release/workspace readiness, confirmation and proof/cancellation flows,
mobile redirect, explicit request submission, pending-state recovery and Logout.
The owner reported two jobs in `accountDeletion`: one originating from desktop
and one from mobile. This is owner-reported evidence; neither job has been
independently inspected in this checkpoint. No UID or job ID was supplied.

Step 12 includes exact-target inspection and authorization. Confirmation of the
checklist does not identify either destructive target for the operator; capture
and inspect each project/UID/job and obtain its explicit execution authorization
before cleanup/Auth deletion. Do not infer that the two jobs belong to the same
UID or that email confers authority over either target.

Next: inspect and authorize both exact targets, then verify operator cleanup/Auth
removal, distinct-UID re-registration and T7 safety (steps 13–15). No operator run,
Auth deletion or fence retirement is established by this UAT report. Retirement
remains disabled and Slice 5A acceptance remains pending. The bare-root access
issue remains open unless separately confirmed resolved.

## Owner UAT checkpoint — Auth removal and fresh registration, 6 November 2026

The owner supplied an operator result of awaiting_retirement, accountRemoved=true,
controlRetired=false and retirementEnabled=false. The owner subsequently confirmed
that the same identity and provider can set up a fresh workspace while the original
fence remains awaiting_retirement. This confirms the reported re-registration flow
with fence retention; no fence retirement is claimed.

The report did not identify which of the two UID/job pairs completed, or provide
an independently verified new UID. Attribute this result only to one unspecified
job until clarified. Explicit distinct-UID verification, isolation of the new
workspace from the old job, the other job's completion and T7 evidence remain
pending. No new operator invocation, deletion, retirement or release was performed
while recording this report.

### Exact job and fresh UID attribution — owner confirmed

- Completed old UID: `jBVZ41DdPGhJRLvqK2jZBFZx9QB2`.
- Completed job: `8525c7ab-0fa2-4baf-93d2-148b6abde779`.
- Final reported state: `awaiting_retirement`; fence retained.
- Fresh workspace UID: `jq2VPHjG43hZ0KJtdHzyT7icZB12`.

The owner explicitly supplied these identifiers on 6 November 2026, resolving the
previous attribution gap. The new UID differs from the completed old UID, confirming
owner-observed distinct-UID re-registration with the same identity/provider while
the old fence remains. This does not independently establish old/new access
isolation, operator-resume isolation or stale-token/T7 safety. The first job
`62abaeaf-af43-461e-9365-17e6fab81e66` for UID
`Td9Kpq9i67MiLUpOjy6nwUuVgWZ2` has no reported successful completion yet.
Retirement remains disabled. These identifiers record verification evidence and
do not authorize deletion of the fresh workspace.

### First job completion — owner confirmed, 6 November 2026

The owner also confirmed completion of UID `Td9Kpq9i67MiLUpOjy6nwUuVgWZ2`,
job `62abaeaf-af43-461e-9365-17e6fab81e66`. This supersedes the preceding statement
that its successful completion had not been reported. Both original jobs now have
owner-reported completion. No new structured operator output was supplied for this
first-job confirmation; no independent read-back occurred in this checkpoint.
No fence retirement is claimed; retirement remains disabled. Cross-UID access and
operator-resume isolation, T7 safety and final acceptance remain pending.

## Verification handoff update — 6 November 2026

Independent read-only evidence now confirms both initial jobs awaiting_retirement,
empty application inventories and absent original Auth identities. The then-fresh
UID jq2VPHjG43hZ0KJtdHzyT7icZB12 was subsequently deleted in owner-executed job
d5ce4f10-6487-4f92-af50-5f5a2d41def3. The owner reported successful redirect proof,
explicit intent and operator finalization with the fence retained.

For this controlled repeat, untouched Tab 2 received Account removal verified and
Workspace access is blocked without refresh, hiding workspace content. The owner
then refreshed Tab 2 and observed signed-out/provider sign-in. Live status propagation
and post-removal reload recovery pass as owner-observed evidence. No spontaneous
sign-out, token expiry, offline queued-write or post-retirement safety is inferred.
See the [T7 observations](05A-delete-account-t7-verification.md) and
[independent state evidence](05A-delete-account-post-removal-evidence.json).

Remaining gates: cross-UID access/operator-resume isolation, controlled stale-token,
offline/queued-write and stream evidence, reviewed retirement implementation and
canary, release/rollback verification and final owner acceptance. All fences remain
retained; no retirement was performed. This update prepares the review/commit
checkpoint and does not authorize publication or further destructive targets.
