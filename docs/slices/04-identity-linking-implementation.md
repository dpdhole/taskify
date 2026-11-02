# Slice4 — Explicit provider linking implementation

**Current disposition: OPEN / ON HOLD.** Owner deferred the reported local verification-cancellation defect and directed development to Slice 5; see the [hold and handoff](04-identity-linking-hold.md). The implementation and unit results below are historical, not real-provider acceptance or closure.

2 November 2026. Owner authorized linking implementation and instructed: perform
only unit-level testing; hold full-slice and regression testing until prompted.
This checkpoint implements the flow locally. It is not Slice4 completion, backend
feasibility acceptance, a deployment or real-provider acceptance.

## User flow

Sign-in methods offers Link Google or Link Microsoft for an unlinked method. The
confirmation explains that the additional identity will access this Taskify account.
The user selects an existing linked method and completes fresh verification for
this attempt. Standalone Verify current account success is not reused as authority.

After proof and a fresh server status check, an explicit Continue with the target
provider obtains additional-provider proof and starts the linking SDK call. Desktop
uses a popup; hosted coarse-pointer clients use redirect. Redirect verification
returns to the explicit Continue step rather than automatically submitting linking.
A separate redirect-verification choice is offered when preparing the attempt.
Every restart requires fresh proof; no cached OAuth credential is replayed.

## Boundaries and implementation

- The application flow binds UID, session generation and operation sequence. It
  checks fresh compatibility/session admission immediately before the linking call.
  Unknown provider/status responses and stale identities fail closed.
- The Firebase adapter owns a dedicated same-UID Auth context, SDK-managed session
  persistence and public user-copy/reauthentication/linking APIs. Fresh proof and
  the target link use that same SDK user/context, including its refreshed token;
  the primary Auth instance is not replaced or signed out by linking cleanup.
- A one-use proof handle is private to orchestration/infrastructure. It is bound
  to UID, primary SDK user, Logout epoch, target and operation nonce, with a
  five-minute intent limit. It never enters UI/shared state. Closing/reloading a
  popup-prepared flow discards its authority; a deliberate proof redirect restores
  continuation only after a valid SDK reauthentication result.
- Redirect metadata contains only version, UID, epoch, nonce, time, existing/target
  provider and phase. A unique SDK context namespace is derived from its nonce;
  Firebase owns OAuth-event verification. Metadata alone cannot grant proof.
  A link redirect return performs status reconciliation, never a replay.
- Cleanup is serialized and deferred during SDK writes. A nonsecret cleanup
  sentinel permits recovering an abandoned/failed cleanup on return or before a
  fresh attempt. Credentials remain in SDK objects/session persistence, not in
  application state, evidence, logs or application URLs.
- The owner-accepted SDK boundary remains controlling: target proof and mutation
  happen inside the SDK call. Once invoked, cancellation/Logout cannot promise
  that linking was undone. The original UID remains the mutation target even if
  the primary session changes while that call is already in flight.

No email matching or unauthenticated provider lookup is used. No unlink, merge,
credential transfer, account deletion, profile editing, Firestore/schema/Rules,
provisioning, dependency or deployment change is introduced. No updateProfile call
or Taskify profile/data write is made; provider-owned Auth metadata is not treated
as a user-selected Taskify profile.

## Outcomes and recovery

Success is reported only after an authoritative current-UID status lookup confirms
provider membership. SDK success alone is insufficient. Already-linked status is
reconciled rather than blindly resubmitted. Credential-owned-by-another-account
errors preserve separate accounts and never trigger data/credential movement.
A conflict cannot be promoted to chosen-identity success merely because that
provider also appears in the latest membership snapshot.

Before submission, cancellation invalidates proof. During a submitted call, the UI
requests cancellation and then checks server status once the SDK settles; cleanup
never unlinks as compensation. A lost/network result remains uncertain unless
membership confirms the method. Check link status performs only a fresh read. An
explicit subsequent check can report current absence; starting again still requires
new proof. Status reads and compatibility waits have deadlines. Logout, account
switching, Back and disposal prevent late UI resurrection; attempts remain serialized
until the underlying SDK operation settles.

Nonmutating proof may wait across visibility/credential revalidation, but no linking
call is submitted while compatibility is blocked. Hard failures invalidate proof;
already submitted operations remain subject to outcome verification. This does not
claim client admission can revoke an Auth request already handed to the SDK.

## Sign-in conflict handoff

A sign-in account-resolution conflict retains only the attempted provider as a hint.
After successful existing-method sign-in, the UI explicitly offers reviewing linking
through Sign-in methods. For deliberate sign-in redirects, the same nonsecret hint
is carried in the existing epoch/time-bound marker. Redirect conflicts offer an
explicit return to sign-in options. The hint is not a destination-UID lookup or
proof capability, and is cleared on Logout, identity change or confirmed membership.
No OAuth credential is retained for collision recovery.

## Validation and explicit hold

All 74 tests in the five new targeted unit specifications passed. Only these
targeted unit specifications were executed. They mock SDK/provider
calls and exercise the application, adapter bridge, popup/redirect metadata and
parent-controller projection; they do not contact Firebase or use a browser.
Static type, boundary/cycle, lint and formatting checks are also performed.

The browser fixture is wired for the new actions but has not been executed for
linking. Full existing unit regressions, emulator/integration/browser tests, real providers/
devices and full-slice acceptance are held until the owner prompts. No build or
publication artifact is produced in this checkpoint.
Previous 201/7/44 and earlier checkpoint counts are historical and do not validate
this linking implementation. Exact commands/results and source hashes are in
[unit evidence](04-identity-linking-implementation-evidence.json) and the
[execution log](04-identity-linking-implementation.log).

Pending validation includes both-direction actual SDK linking and later sign-in to
that same UID, mobile redirect/handler behavior, popup/focus/accessibility behavior,
real collision/automatic-resolution settings, cleanup/reload and submitted-operation
races, existing recovery regressions and provider-owned profile effects. The earlier
project API omitted allowDuplicateEmails; no setting is changed and explicit-only
platform resolution is not claimed. Work/school acceptance remains deferred.
Overall platform feasibility remains INCONCLUSIVE.

The local preview remains available; no agent-driven interactive or cloud linking
check occurred. This describes the original unstaged implementation checkpoint. Current staged-review scope and the subsequent owner hold are recorded in the [hold and handoff](04-identity-linking-hold.md). No publication or push is included.
User backup/recovery remains FUTURE.
