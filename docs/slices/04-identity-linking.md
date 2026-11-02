# Slice 4 — Identity linking

Status: **detailing accepted by owner on 2 November 2026; implementation pending**.
This document records the agreed discussion baseline. Documentation does not
establish provider feasibility or authorize implementation, cloud configuration,
commit, push or deployment. The owner subsequently authorized documentation
updates and staging for review; no commit or push is performed. Apple
authentication remains deferred.

Authority: [slice plan](../implementation_plan.md),
[identity policy](../architecture.md#identity-and-account-linking--owner-agreed-policy),
[product identity requirements](../product_spec.md#215-login-identity-and-workspace-initialization)
and [Slice 3](03-provider-sign-in.md).

## Objective and scope

Link Google and Microsoft sign-in to one existing Taskify account after explicit
proof of control of both identities, preserving its Firebase UID and ownership.
Verified matching email is a resolution hint, never authorization to link or
select the destination account. Different or absent emails do not prevent
explicit proof-based linking.

Include reauthentication, linking, account-resolution conflict guidance,
cancellation, outcome verification and minimal provider presentation. Exclude
unlinking, account deletion, credential transfer between existing accounts,
duplicate-account/data merging, profile editing, workspace provisioning and new
providers. No provisioning templates or Firestore provider registry are needed.

Slice 3 provider/session implementation and owner acceptance are now included in
this checkout after synchronization to `origin/main` at `fe7a600`. Its
[closure record](03-provider-sign-in-closure.md) reports Google/Microsoft personal-
account checks on desktop/mobile; work/school testing remains deferred until
features mature. Validate linking against these existing session, Logout and
compatibility boundaries; Slice 3 acceptance does not prove linking behavior.

## Entry point and presentation

Add a small **Sign-in methods** screen accessible from the Slice 3 authenticated
landing screen, without implementing the full Slice 26 My Account interface.
Show Google and Microsoft as linked, available to link, checking current status
or temporarily unavailable. Derive status from authenticated provider information,
not email comparisons or a separate Firestore registry. Do not expose an enabled
Apple control. Include accessible progress/errors, keyboard navigation and focus
recovery across mobile and desktop layouts.

## Explicit linking flow

1. Require current compatibility readiness and an initialized authenticated session.
2. Explain that the additional method will access the current Taskify account.
3. Reauthenticate through an already linked provider for every linking attempt.
4. Confirm that reauthentication returned the original UID; reject a mismatch.
5. Obtain authenticated proof from the additional provider.
6. Recheck session and compatibility admission before submitting linking against
   the original account.
7. Refresh authenticated account information and confirm the unchanged UID now
   includes the additional provider.
8. Report success only after confirmation.

Fresh reauthentication is an accepted product safeguard for this action, not a
claim that every SDK linking call automatically enforces it. Exact SDK method and
popup/redirect transport follow validated Slice 3 behavior. Keep credential
material and SDK objects inside infrastructure adapters.

## Sign-in collision recovery

When sign-in reports an account-resolution conflict, explain that the user must
sign in using their existing method. Offer the supported choices without exposing
an email-based account lookup. After successful sign-in, explicitly offer to link
the originally attempted provider through the normal linking flow.

Restart provider proof rather than persisting pending OAuth credentials across
navigation or reloads. Never infer the destination UID from a matching email.
Do not depend on discovering linked providers from an unauthenticated email query.

| Situation | Required behavior |
|---|---|
| Provider already linked to current account | Refresh status and report linked |
| Credential belongs to another UID | Stop; explain that the accounts remain separate |
| Wrong account selected during reauthentication | Reject UID mismatch and restart safely |
| Proof fails or expires | Preserve existing access and offer a fresh attempt |
| Different emails | Allow explicit linking after both proofs succeed |
| Missing email/profile fields | Use stable identity and render presentation safely |

Never delete another account, move its credentials or transfer its Tasks/data to
resolve a conflict. Such recovery requires a separately defined process.

## Cancellation and uncertain outcomes

Cancellation before submission leaves the account unchanged. After submission,
cancellation, navigation or network failure cannot guarantee the link was undone.
Show **Checking sign-in methods**, refresh authenticated account information and
classify the result as confirmed linked, confirmed unchanged or still unverified.
Offer retry verification for an unverified result; do not blindly replay linking
or automatically unlink as compensation.

Reload discards temporary intent and credential material, then reconstructs
provider status from authentication. A redirect flow must preserve only the
minimal nonsecret correlation needed for its deliberate return path; it must not
restore an unbound operation against whichever account happens to be signed in.
Any SDK-managed redirect credentials remain the adapter's responsibility, not
application storage or URLs.

## Session, compatibility and concurrency

Bind each attempt to its original UID, session generation and operation identifier.
Serialize attempts within the tab and reconcile changes originating elsewhere.

- Logout or account switching invalidates the attempt immediately.
- Recheck compatibility after provider interaction; never submit while blocked.
- Reconcile already submitted operations if compatibility subsequently changes.
- Ignore stale UI results without claiming an Auth mutation was cancelled.
- Preserve ownership and user profile choices; linking must not overwrite them.

The compatibility gate protects supported-client behavior. Firestore Rules do not
enforce Firebase Auth linking operations. No new Firestore access, backend tier,
offline queue or account-merge mechanism is introduced by this slice.

## Application and adapter boundary

Extend the Slice 3 authentication boundary with operations for fresh proof of the
current account, linking an additional provider and refreshing linked-provider
status. The application orchestrates admissions, session binding, operation state
and classified outcomes. The infrastructure adapter translates SDK errors and
retains credentials; UI and shared state expose no credentials or raw SDK errors.
Exact interfaces remain implementation details within these boundaries.

Diagnostics may identify operation/state, classified reasons and app/contract
versions. Exclude tokens, OAuth credentials and personal profile content.

## Acceptance and evidence

Validate Google-to-Microsoft and Microsoft-to-Google linking. Each successful
direction must preserve the original UID and permit later sign-in through either
linked provider to that same UID.

| Area | Required coverage |
|---|---|
| Identity | Same/different emails, absent profile fields and unchanged UID/ownership |
| Proof | Fresh current-account reauthentication, wrong-account selection and expired proof |
| Conflicts | Provider already linked, credential owned by another UID and no automatic merge |
| Recovery | Cancellation at every stage, uncertain completion, verification retry and reload |
| Races | Repeated attempts, Logout, cross-tab changes, account switching and stale completion |
| Compatibility | Blocked admission, recheck after provider return and revocation after submission |
| Presentation | Responsive layout, keyboard/focus behavior and announced progress/errors |
| Security | No credentials in application storage/logs/URLs and no widened Firestore access |
| Regression | Slice 3 sign-in, persistent sessions and Logout remain correct |

Use focused unit/component tests for orchestration and local adapter/emulator
checks where representative. These do not prove actual provider behavior.
Separately authorized real-provider checks must establish linking feasibility,
UID preservation, browser behavior and subsequent sign-in using either method.
Inspect provider/project configuration for automatic account-resolution behavior
that could undermine explicit linking policy; do not claim client UI alone
prevents such behavior. Return incompatible platform behavior for owner decision.

Update feature guidance during implementation to explain linking, cancellation,
separate-account conflicts and recovery accurately. No manual publication or
fabricated documentation URL is introduced; initial manual publication stays in
Slice 9. Benchmark relevant authentication/verification requests without inventing
account-volume limits.

## Technical references and remaining checkpoints

Official documentation consulted during detailing on 2 November 2026:

- [Firebase account linking](https://firebase.google.com/docs/auth/web/account-linking):
  provider-linking operations and conflicts when credentials belong to another account.
- [Firebase Microsoft authentication](https://firebase.google.com/docs/auth/web/microsoft-oauth):
  provider setup and account-exists-with-different-credential recovery context.

These references describe platform capabilities, not verified behavior of this
project or its pinned SDK. Recheck relevant platform limitations and configuration
during implementation. Linking-specific real-provider feasibility, integration validation and execution
evidence remain outstanding. Slice 3 acceptance does not supply that evidence;
Microsoft work/school testing remains deferred until features mature. Overall platform feasibility remains
INCONCLUSIVE. The next checkpoint is implementation authorization, not deployment.
