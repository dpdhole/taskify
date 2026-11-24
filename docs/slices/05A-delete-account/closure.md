# Slice 5A — Closure, 24 November 2026

Status **accepted and closed for supervised test-account reuse**.

The owner accepted the bounded closure recommendation and instructed completion
of the current review followed by slice closure. This record narrows acceptance
to the original purpose of supporting testing with limited provider identities.
It supersedes the earlier requirement to complete every general retirement and
release-hardening gate before closing this testing-support slice.

## Accepted delivery

| Capability | Evidence |
|---|---|
| Confirmed intent, provider proof and request recovery | Owner desktop/mobile UAT and [QC checkpoints](qc-promotion.md) |
| UID-scoped fence and workspace denial | Live second-tab recovery, Rules tests and [T7 assessment](t7-verification.md#current-gap-assessment-24-november-2026) |
| Supervised recursive workspace cleanup and Auth deletion | Exact-job operator runs, [cleanup](live-write-canary-cleanup-evidence.json) and [Auth verification](live-write-canary-auth-evidence.json) |
| Reuse of the provider identity with a fresh UID | Owner re-registration evidence, [cross-UID access checks](client-isolation-evidence.json) and [old-job resume isolation](resume-isolation-evidence.json) |
| Scoped retirement safety experiments | Original-token read and write denial after authorized exact-job retirement, [post-write read-back](live-write-canary-post-write-evidence.json) |
| Current recovery review | Clean QC artifact provenance, HTTPS hashes and bounded restoration procedure in [recovery review](release-verification.md#recovery-review-24-november-2026) |

The accepted ordinary operator endpoint is awaiting_retirement. The old fence
continues to block the old UID while registration under a new UID allows reuse
of the provider identity. Control metadata retirement is a separately gated
operation. The live canaries retired only their specifically authorized controls.
Retained controls require eventual review through a separately accepted retirement
policy. They contain operational metadata and have no automatic deletion schedule.

The normal workflow is an application deletion request, inspection of its exact
project/UID/job, explicit operator authorization, verified cleanup/Auth removal,
then ordinary registration and initialization with a distinct UID. The operator
runbook documents setup, ADC, commands and reconciliation.
[Operator instructions](../../../tools/account-deletion/README.md).

## Completed final review

The general cloud retire command is guarded before connection. Final closure
checked that it reports retirement-disabled for a cloud target. The reviewed
4,200-second interval, live experiments and independent read-backs retain their
scope. Fully delivered in-flight operations and cross-service privileged recreation
remain assumptions for future general retirement enablement. The contract already
excludes old-UID administrative recreation and out-of-band privileged writes.

The current QC recovery artifact is Hosting version c11eb2d24b38e44e, app 0.3.0,
build 3acadd26609f-41b33b3697e4eddb, from clean local commit
3acadd26609ff03988db99689e0c0fac4b17b296. All four public artifact hashes matched
HTTPS in the final review. The prior dev artifact lacks the recreated QC hostname
and is unsuitable for recovery on that hostname. The review and forward recovery
are complete. A distinct deployed rollback/restoration rehearsal is follow-up work.

Seventy-five focused tests, five deletion UI tests, operator typechecks and
revision-3 candidate validation passed in the final assessment. Earlier cloud and
emulator evidence remains dated and scoped. The final downloaded observations
file lost its earlier event history after reload. The owner-pasted write outcome
and independent post-write checks remain the evidence for that experiment.

## Explicit follow-up work

| Follow-up | Trigger and required outcome |
|---|---|
| General retirement enablement | Before enabling routine cloud fence retirement, accept the supported in-flight ordering basis, operational quiescence policy, retention handling and revised retirement contract |
| Broader release recovery | Before broader release acceptance, run an explicitly authorized distinct-candidate/restoration rehearsal with compatible DA1 policy and recovery UI checks |
| Current release provider/device matrix | Before broader rollout, verify Google/Microsoft personal popup and actual mobile redirect on the selected build/hostname |
| Evidence and source integration | Review, stage and commit the pending operator/harness/documentation changes; integrate the isolated QC hostname commit through the normal repository workflow |

These follow-ups are outside the accepted test-support closure. Slice 4 linking
remains held. Slice 6 navigation is the next implementation slice. QC currently
expires on 24 December 2026 at 08:41:40 IST and renewal requires an explicit request.

The closure records product scope acceptance. Pending source changes are still
uncommitted in the verification checkout. The isolated QC hostname fix has its
own local commit and has been deployed. Repository review and commit remain the
next administrative handoff.
