# Slice 3 — Provider sign-in

Status: **detailing accepted by owner on 23 October 2026; implementation pending**.
The owner accepted the discussion baseline and authorized documenting it in the
separate `taskify-slice3` checkout. This is an implementation baseline, not evidence
of implemented authentication or provider feasibility. No code, configuration,
dependencies, tests, cloud setup, staging, commit, push or deployment is authorized
by this documentation work. Live promotion remains deferred until development
matures and requires explicit owner approval.

Authority: [product specification §21.5](../product_spec.md#215-login-identity-and-workspace-initialization),
[identity policy](../architecture.md#identity-and-account-linking--owner-agreed-policy)
and [slice plan](../implementation_plan.md).

## Provider scope amendment — 23 October 2026

The owner added Microsoft sign-in and deferred Apple authentication. Google and
Microsoft are the active Slice 3 providers. Apple feasibility, configuration,
implementation and live validation are deferred and are not Slice 3 acceptance
blockers. Do not expose an enabled Apple login control or claim Apple support.
Microsoft feasibility and real-provider validation remain required; no provider
configuration or successful authentication is implied by this amendment.
Implementation authorization remains in effect. This session now uses the fresh
`taskify-slice-detailing` checkout; the original checkout baseline below is historical.

## Objective and boundaries

Deliver Google/Microsoft sign-in, persistent device authentication and Logout,
integrated with the accepted [Slice 2 compatibility gate](02-compatibility-gate.md).

| Included | Deferred |
|---|---|
| Responsive branded hero and centered Google/Microsoft login controls | Proof-based linking and account-resolution workflow — Slice 4 |
| Session initialization and persistent authentication restoration | Workspace/default-record provisioning — Slice 5 |
| Cancellation, classified errors and safe retry | Full navigation — Slice 6 |
| Logout and account-state isolation | Account/profile editing — Slice 26 |
| Minimal authenticated landing state | Apple authentication, account deletion and email OTP |

Successful sign-in reaches a small authenticated screen with Logout and an honest
message that workspace functionality is not yet available. Do not simulate a
provisioned workspace or add unavailable navigation. Provisioning templates need
no changes because this slice provisions no records.

## Dependency and checkout baseline

The separate checkout starts at `f264868`, the accepted Slice 2 documentation
commit. Its baseline contains no accepted Slice 2 implementation. During the
read-only discussion, the original sibling checkout contained uncommitted
compatibility source while documentation still described implementation as
pending. Those files were not copied into this checkout and are not acceptance
evidence. Integrate Slice 3 against the reviewed and validated Slice 2 contract;
do not silently import unreviewed sibling changes or bypass the gate.

## Authentication and compatibility lifecycle

Authentication state and compatibility state remain independent. A restored
identity does not establish workspace readiness.

1. Start the public authoritative compatibility check and restore authentication.
2. Show session-restoration status until authentication initialization completes;
   avoid flashing login before restoration resolves.
3. Enable a new sign-in attempt only after compatibility succeeds.
4. After provider success, re-evaluate the current gate before admitting the
   authenticated screen. A previously admitted attempt does not confer readiness.
5. If compatibility is revoked during provider interaction, retain the resulting
   identity but block protected application access and show gate recovery.
6. Keep Logout available when compatibility verification fails.

Restoration may proceed while compatibility is unavailable because it does not
load workspace data or provision records. Authentication transitions must not
trigger implicit provisioning. A popup focus/visibility transition must honor
Slice 2 rechecks without discarding a valid provider result. Redirect return must
restore compatibility verification before protected access.

## Session boundary and account isolation

Use the stable Firebase authenticated UID as the account identifier, consistent
with the agreed architecture. Email, name and photo are optional presentation
values, not ownership keys. Missing profile fields must render safely.

The application authentication port exposes session initialization/identity
observation, sign-in with a supported provider, sign-out and subscription disposal.
Keep Firebase SDK objects, provider credentials and tokens inside the infrastructure
adapter. Expose only the minimum account presentation required by the UI.

Every identity transition advances a session generation. Async user-scoped results
must match their originating session generation and applicable compatibility
admission before publication. On Logout or UID change, immediately detach account
listeners and clear user-scoped state. Future workspace consumers must use this
boundary. No generic account repository or new account document is needed here.

Profile initialization/persistence belongs with Slice 5: available social profile
data may initialize presentation, but later provider results must not overwrite
user edits. Slice 3 makes no persistent profile-write claim.

## Persistence and Logout

Explicitly configure persistent device authentication before starting a provider
flow. If persistence cannot be established, show a recoverable error rather than
silently promising a remembered session. Authentication should persist until
Logout or invalidation; browser storage restrictions and invalidation require
clear recovery, not an unconditional persistence guarantee.

Logout performs these steps:

1. Block new account operations and invalidate outstanding session work.
2. Clear user-scoped presentation and subscriptions.
3. Request SDK sign-out.
4. Confirm signed-out state through the authentication observer.

If sign-out fails, keep protected content hidden, show a retry and do not claim
Logout succeeded. Taskify Logout signs out this browser's Taskify session; it does
not imply signing out of Google/Microsoft everywhere. Cross-tab restoration and Logout
behavior require browser validation. Late provider completion after Logout must
not reopen protected content or publish a stale account result.

## Provider feasibility checkpoint

Validate each provider before committing to the final transport. Feasibility
remains **unverified**; this document makes no current SDK, pricing or provider
configuration claim. Implementation discovery must consult current official
provider/Firebase documentation and record its findings.

| Area | Required evidence |
|---|---|
| Configuration | Required registrations, credentials, domains and callback URLs |
| Architecture fit | Static browser delivery and the approved Firebase topology |
| Cost | Provider requirements against agreed cost constraints |
| Browser behavior | Desktop/mobile completion, cancellation, blocked popup and redirect return |
| Identity | Stable UID, missing profile values and provider collision behavior |
| Operations | Credential ownership, rotation and configuration recovery |

Popup versus redirect remains open pending this evidence. No provider secret may
ship in a browser artifact. Live registration, configuration and testing require
their separate authorization. An unavailable or cost-incompatible provider returns
to the owner; do not silently omit it, introduce paid infrastructure or substitute
email OTP. Slice 3 remains incomplete until both in-scope providers (Google and Microsoft) are delivered
or its scope is explicitly revised.

## Collision, cancellation and recovery

Slice 3 handles collisions safely without implementing Slice 4 resolution:

- Never merge accounts based on matching email or automatically link credentials.
- Explain when another sign-in method may be required; no access to an existing
  account follows merely from an email match.
- Keep credentials out of URLs, logs and general application state.
- Treat provider cancellation as a normal return to login.
- Prevent duplicate concurrent sign-in attempts.
- Distinguish connectivity, provider configuration, persistence and account-resolution
  failures with useful retry/recovery guidance. Avoid exposing raw SDK errors.

Different/private email addresses do not authorize linking. Duplicate-account data
merging remains outside this slice. Diagnostics may record operation/state,
classified reason and app/contract versions; exclude credentials, tokens and
personal profile content.

## Implementation boundaries

Extend the existing Foundation layering with a small infrastructure authentication
adapter, application session controller, state projection and login/authenticated
views. Compose session and compatibility lifecycle in the application entry.
UI components must not call the Firebase SDK directly; SDK types remain outside
application/domain contracts. Dispose observers and superseded work safely.

No Task, settings or provisioning writes are required. Authentication does not
broaden Firestore permissions beyond the established compatibility boundary;
future per-account authorization remains the responsibility of the relevant
record slices. No backend tier, offline write queue or server-managed session is
introduced.

## Acceptance and evidence

| Area | Required validation |
|---|---|
| Feasibility | Documented outcome for Google and Microsoft, configuration/cost dependencies and transport selection |
| Session | Initialization, sign-in, cancellation, classified retry and duplicate-attempt prevention |
| Persistence | Refresh/browser-session restoration, storage failure and session invalidation |
| Gate integration | Compatibility unavailable at boot, revocation during provider interaction and recheck on redirect return |
| Isolation | Logout, UID changes, cross-tab transitions and stale async/provider completions cannot publish protected account state |
| Logout recovery | Confirmed sign-out, failed sign-out with hidden protected content and successful retry |
| Identity | Missing presentation fields, collision handling, no email-based merge or automatic linking |
| UI | Mobile/desktop layout, keyboard access, focus recovery, accessible names and announced progress/errors |
| Security/artifacts | No credentials in logs/artifacts; no widened data Rules or unintended provisioning |
| Guidance | Accurate explanation of available login/session/Logout behavior and limitations |

Use focused unit/component tests for orchestration and races, local adapter/emulator
integration where representative, and browser checks for lifecycle/persistence.
Emulator or mocked-provider success does not prove real OAuth, provider-console
configuration or actual browser/provider readiness. Record separately authorized
real Google/Microsoft evidence and its browser coverage. Run affected existing
compatibility/Foundation regressions during implementation. Assess relevant
startup/listener costs without inventing account-volume limits.

Update feature guidance during implementation; do not describe planned providers
as usable before validation. Initial manual publication remains the Slice 9
checkpoint; this slice does not invent a manual URL or publish a site.

## Implementation sequence and next checkpoint

Proceed, when authorized, through provider feasibility, session/controller
boundary, Google flow, Microsoft flow, then persistence/Logout/race validation. Keep
the agreed feature order; linking and provisioning remain separate slices.

The detailing is accepted. Documentation authorization does not authorize
implementation, cloud setup, staging, commit, push or deployment. Provider
feasibility, validated Slice 2 integration and actual authentication evidence
remain outstanding; overall platform feasibility remains INCONCLUSIVE.
