# Slice 4 — Sign-in methods status checkpoint

Historical step1 evidence; the later [popup proof checkpoint](proof.md) records current progress. Counts and input hashes below describe step1 only.

2 November 2026. Owner authorized review and beginning the implementation sequence.
Step 1 is implemented locally. Linking mutations remain unavailable; this is not
Slice 4 completion, linking feasibility acceptance or permission to deploy.

## First implemented feature

The authenticated landing opens Sign-in methods without introducing full My Account
or application navigation. A server refresh reads the current Firebase user's
providerData through a provider-independent reader. Only UID and supported provider
names leave infrastructure; no email matching, credentials or Firestore registry.

The controller binds reads to the existing session/compatibility ticket. Duplicate
clicks share one request; late results after Logout, account switching, Back,
disposal, compatibility revocation or timeout cannot restore provider presentation.
Failures clear status rather than displaying Not linked. A 15-second deadline offers
an explicit retry. Status is a confirmed snapshot, not a realtime provider feed.
The adapter also rechecks its current SDK user and same-origin Logout epoch.

Google and Microsoft show Linked, Not linked, Checking or Status unavailable.
Adding a method is honestly unavailable until the subsequent mutation step. Back
returns focus to the entry control; Logout remains reachable. A blocked compatibility
gate clears method claims and retains existing gate recovery. No full settings UI,
unlink, deletion, account merge, profile editing, provisioning or new providers.

## Checks and evidence

- 133 unit/component tests; 7 integration tests; 25 headless Chromium checks passed,
 with all four builds, type/layer/lint/format and module-isolation checks.
- New emulator browser cases at 390/1280px exercise actual SDK reload/provider status,
  keyboard focus, Back, blocked-gate recovery and clearing on Logout. Existing Slice 3
  and Foundation regressions passed. No real-provider account interaction occurred.
- One reload per open/explicit refresh, with no background polling. No additional
  Firestore access or schema/version change. Onboarding templates are unchanged.
- [Execution log](status.log) and
  [input/build/project evidence](status-evidence.json).

## Platform findings requiring attention before mutation

Firebase [documents automatic resolution](https://firebase.google.com/docs/auth/users#verified_email_addresses)
for some trusted-email provider sign-ins, including link/overwrite cases. The read-only
project API returned signIn:{} with allowDuplicateEmails omitted. This is not evidence
that automatic resolution is disabled. No configuration was changed and UI-only
prevention is not claimed. Validate relevant collision paths before choosing any
configuration change or accepting an exception to explicit proof policy.

The pinned SDK's linkWithPopup obtains target-provider proof and invokes linking
within the SDK; linkWithRedirect has the same application-boundary concern. The
public API does not expose a separate application callback between proof and link
submission. The original detailing asks for a compatibility/session check at that
point. [Firebase's linking flow](https://firebase.google.com/docs/auth/web/account-linking)
and the pinned implementation were reviewed; no private SDK hook or secondary
sign-in account is introduced as a workaround.

Boundary amendment accepted by the owner on 2 November 2026: require fresh current-account
reauthentication; validate original UID/session/compatibility immediately before
starting the SDK linking operation; treat the entire SDK call as mutation in flight;
verify/reconcile after return. Once started, cancellation/Logout can invalidate UI
work but cannot promise to undo an Auth mutation. This narrows where the client can
check admission. The owner explicitly accepted this SDK boundary; the detailing
now records that amendment. No promise is made to undo a submitted Auth operation.

## Remaining sequence

| Step | Scope | State |
|---|---|---|
| 1 | Read-only status boundary and entry screen | Implemented and locally validated |
| 2 | Fresh current-account reauthentication and UID/session binding | Next |
| 3 | Additional-provider linking and confirmed/uncertain outcome handling | SDK boundary accepted; implementation and collision feasibility checks pending |
| 4 | Sign-in collision intent, retry/cancellation and reconciliation | Pending |
| 5 | Both-direction emulator/real-provider acceptance | Pending; interactive tests require explicit approval |

Current changes are unstaged/uncommitted; no cloud mutation, deployment or push.
Existing dev is unchanged. The local test processes were shut down. User backup/
recovery remains FUTURE; initial manual publication remains Slice 9.
