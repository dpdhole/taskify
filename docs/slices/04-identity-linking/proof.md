# Slice 4 — Popup current-account verification checkpoint

Historical popup checkpoint: the later [redirect checkpoint](redirect.md) records the resolution and current progress. Counts/hashes here describe the popup-only snapshot.

2 November 2026. Step 2 adds fresh verification through an already linked Google
or Microsoft method. This checkpoint does not add providers or complete Slice4.
The owner accepted finishing popup proof first and resolving safe redirect startup next.

## Behavior and boundaries

Sign-in methods offers Verify with Google/Microsoft only for methods confirmed by
an Auth reload. The adapter calls Firebase reauthenticateWithPopup for the original
SDK user, never a second sign-in. Only the UID result leaves infrastructure.
Wrong-account results leave the current session available with retry guidance.
Every verification invokes fresh proof; displayed success does not grant authority
for a future link attempt. Linking still needs fresh reauthentication plus the
accepted immediate pre-SDK UID/session/compatibility checks.

The controller binds proof to UID and session generation, rechecks compatibility
before accepting success, and rejects late results after Logout, account switch,
Back, disposal or cancellation. The adapter independently checks SDK user identity,
operation sequence and the same-origin Logout epoch. Operations remain serialized
until the underlying SDK promise settles, even after cancellation. The provider
window must close/settle before another verification. Back and Logout stay available.
Keyboard focus returns to the provider verification action after completion.

No email-derived matching, credential storage, account merge/unlink, provider
mutation, Firestore access/schema change or provisioning is added. No dependencies
or SDK initialization settings changed. Feature guidance is part of the UI.

## Redirect finding and owner decision

The attempted emulator redirect proof failed for both providers with auth/argument-error.
Pinned Firebase13.1.0 reauthenticateWithRedirect calls prepareUserForRedirect, whose
_setRedirectUser path needs the default resolver in initializeAuth, even when a
resolver is passed explicitly to the reauthentication call. Slice3 initializes Auth
without that default to process redirect returns explicitly. Enabling it changes
startup return processing and admission ordering, including current-user restoration.
That change requires separate review and race validation.

The experimental proof-return path was removed. Redirect proof now rejects before
SDK invocation or marker storage; no redirect fallback is advertised. Popup blockers
explain allowing popups and retrying. Existing Slice3 sign-in redirects still work.
Unsupported proof-operation markers fail closed at startup.

Owner decision: complete popup proof first; resolve redirect startup next. This is
an incremental checkpoint, not removal of mobile/redirect scope. Safe redirect
reauthentication and linking remain required before Slice4 completion. No private
SDK hooks, secondary Auth instance or speculative persistence change is introduced.

## Verification

152 unit/component tests, 7 integration tests, 33 headless Chromium checks and all
four builds passed, including type/layer/lint/format/module-isolation checks.
Final results and input/build hashes are recorded in
[proof evidence](proof-evidence.json) and the
[execution log](proof.log). Emulator checks use synthetic accounts,
not real Google/Microsoft credentials. A prior experimental run passed 31 browser
checks and failed the two redirect proof cases; those failures drove the explicit
unsupported path and owner decision. They are not represented as redirect acceptance.
The final suite checks popup success, wrong account, cancellation and popup-blocked
recovery for both providers while preserving the original UID and Logout access.
Existing sign-in, persistence, compatibility and isolation regressions are included.

The first sandboxed emulator startup could not activate its local hub. The authorized
retry used local service access; the runner checks ports and shuts down its own
services. No existing process was stopped. No interactive/provider acceptance, cloud
mutation or publication is claimed. The existing dev deployment is unchanged.

## Next sequence

1. Resolve supported redirect initialization/return handling with Logout, stale return,
   account-switch and compatibility race checks, then prove mobile redirect behavior.
2. Implement additional-provider linking and confirmed/uncertain outcome handling,
   honoring the owner-accepted SDK mutation boundary.
3. Validate automatic provider collision resolution and safe recovery; return any
   incompatible platform behavior for an owner decision before configuration changes.
4. Exercise both linking directions and obtain separately approved real-provider
   acceptance. Work/school remains deferred under the existing agreement.

Changes remain local and unstaged. User backup/recovery remains FUTURE.
