# Slice 4 — Redirect current-account verification checkpoint

2 November 2026. Continues the owner-authorized implementation sequence after the
[popup proof checkpoint](04-identity-linking-proof.md). Redirect reauthentication is
implemented locally for Google and Microsoft. Linking remains unavailable; this is
not Slice4 completion or real-provider/mobile acceptance.

## Supported implementation and tradeoff

The initial default-resolver approach was challenged because pinned SDK startup can
restore a redirect user without invoking beforeAuthStateChanged. Adding that resolver
to the primary Auth initializer would change the existing session admission path.
The primary initializer and persistent session therefore remain unchanged.

The Firebase adapter instead lazily creates a named Auth context for the same project
and UID, with browserSessionPersistence and the supported default redirect resolver.
Public updateCurrentUser makes an SDK-owned copy of the primary user. Redirect proof
runs on that copy, never through another identity sign-in. This creates no Firebase
user/project/backend. The named SDK storage namespace is distinct from the primary
persistent session. Only Auth is initialized in that context; no second Firestore
client is created and no SDK private methods/storage keys are read or patched.

This adds one temporary Auth context and SDK-managed session persistence for redirect
verification. That isolation prevents automatic startup or cleanup of a proof return
from replacing or signing out a newer primary account in another tab. Popup proof
continues to use the original primary user directly. Fresh proof in the isolated
context does not update the primary token authentication time. The later linking
step must not assume it did; SDK recent-login rejection and its actual mutation
target/confirmation still need validation before linking is enabled.

On return the adapter checks operation type, provider, original UID, current primary
SDK user and same-origin Logout epoch. Nonsecret application correlation is limited
to format version, UID, provider, epoch, nonce and creation time. The nonce is
nonsecret intent metadata; Firebase owns and verifies its OAuth/redirect event
correlation. Application metadata alone is never proof of authentication. Missing, malformed,
expired or mismatched returns never authorize continuation. Correlation is consumed;
proof metadata is ephemeral and returned only with a fresh current-account status
reload. The application rechecks its session generation and compatibility admission.
Displayed verification never grants permission for a later link attempt.

The temporary context is signed out and deleted after return/error. A nonsecret
cleanup sentinel allows retrying SDK cleanup after failure; failed cleanup suppresses
proof acceptance and never triggers primary sign-out. Cancel/dispose invalidate the
operation and clear deliberate intent. Disposal defers cleanup while SDK writes are
in flight; the settled path or next return performs cleanup without a storage race.
Overlapping initialization retries share the same promise. SDK-managed credentials stay inside Firebase
session persistence and disappear when that tab's session closes; credentials never
enter application state, logs, evidence or application URLs.

## User flow

Hosted touch/coarse-pointer browsers use redirect verification. Desktop verification
uses a popup and offers explicit redirect recovery when popups are blocked. The
existing same-origin Auth-domain configuration remains in use. On a valid/error
return for the current account, Sign-in methods opens automatically once the session
and compatibility gate are ready, reloads current provider status and presents the
result. A different account/new Logout epoch receives no old proof presentation.
Existing sign-in redirects and persistent sessions retain their previous behavior.

There is no resumed or automatic provider-link mutation. Additional-provider proof,
link submission and uncertain-result reconciliation are the next feature step.

## Validation and limits

185 unit/component tests, 7 integration tests and 41 headless Chromium checks passed
with zero browser retries. All four builds and type/layer/lint/format/module-isolation
checks passed. Results, reproducible commands and source/build hashes are recorded in
[redirect evidence](04-identity-linking-redirect-evidence.json) and
[execution log](04-identity-linking-redirect.log).

The prototype exercised both providers for success, wrong account, Logout while away
and account switching while away. Those eight cases were then converted to use the
production adapter. Browser/UI checks also exercise blocked-popup redirect recovery,
automatic return presentation and unchanged primary UID/Logout access at 390px.
Unit coverage includes malformed/expired metadata, wrong SDK operation/provider/UID,
late results after cancellation/Logout/account switch/dispose, cleanup failure and
compatibility-gated presentation. Existing session and compatibility regressions run
with the new cases.

All browser/provider interactions here are synthetic Firebase emulator flows using
headless Chromium. A 390px viewport is not real Safari/Android or provider acceptance.
Hosted Google/Microsoft redirect and both-direction linking acceptance remain open.
Microsoft work/school remains deferred under the prior agreement. Overall platform
feasibility remains INCONCLUSIVE until the outstanding linking/collision checks pass.

No cloud configuration, schema, Rules, deployment, staging, commit or push is included.
User backup/recovery remains FUTURE. Local test services are shut down after checks.

## References

- [Firebase Auth API](https://firebase.google.com/docs/reference/js/auth#updatecurrentuser):
  public user-copy, redirect-result and reauthentication APIs.
- [Auth dependencies](https://firebase.google.com/docs/auth/web/custom-dependencies):
  resolver and persistence initialization.
- [Auth persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence):
  session versus persistent Auth state.
- [Redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices):
  hosted origin/handler configuration and browser storage constraints.

Pinned implementation reviewed: Firebase13.1.0 initializeCurrentUser,
prepareUserForRedirect, updateCurrentUser and reauthenticateWithRedirect. Public API
support plus emulator evidence motivates the isolation choice; hosted behavior is
not inferred from emulator success.


## Review preparation — 2 November 2026

The owner requested staging after starting the local Auth preview. Source/test
inputs still match this checkpoint's evidence; no new acceptance result is claimed.
The local preview remains running at http://localhost:5173/. An exact dev artifact
passed local Hosting checks at 390/1280px, but publication awaits a clean reviewed
commit or an explicit snapshot exception under the hosting policy. The remote dev
channel is unchanged. Implementation, tests, guidance and the three incremental
checkpoint records are prepared together for staged review; no commit/push included.
Earlier unstaged/actions fields record the state when each checkpoint was executed.
