# Slice 3 — Google sign-in checkpoint

23 October 2026. Owner authorized the next step after the Auth/session controller.
This checkpoint extends that controller; Microsoft remains the next implementation
step. Slice 3 acceptance and real-provider validation remain open.

## Implemented behavior

- Auth mode exposes Continue with Google only after session restoration and current
  compatibility readiness. Duplicate starts are blocked. SDK completion and the
  current gate determine protected readiness; an old compatibility decision is
  never carried across the provider trip.
- Desktop uses the Firebase popup API. Hosted coarse-pointer devices use redirect.
  Localhost defaults to popup; local mobile redirect is not claimed as verified.
  A blocked popup offers an explicit Continue with redirect action. Cancellation,
  network, account conflict and configuration failures have sanitized messages.
- The adapter owns GoogleAuthProvider and all SDK credentials. It requests account
  selection, keeps explicit local persistence, and does not store or project OAuth
  credentials into application state. No application email merge or linking occurs.
- Redirect initiation stores only an epoch and timestamp in sessionStorage. Return
  processing uses Firebase getRedirectResult, consumes the marker, and rejects
  returns older than 15 minutes or invalidated by a same-origin Logout.
- Logout immediately revokes presentation/admission. A localStorage epoch also
  invalidates pending provider intent in another tab on the same origin. Firebase
  beforeAuthStateChanged rejects a stale popup/redirect user before SDK commitment;
  disposal retains this guard until a pending popup settles. A cancelled popup
  must settle/close before another sign-in can start.
- Each preview origin has separate browser storage and authentication persistence.
  Cross-tab coordination does not imply cross-origin Logout between dev/qc/uat.
  The shared Firebase project still provides the same account identity service.

## Verification and limits

See [machine-readable evidence](03-provider-sign-in-google-evidence.json) and
[execution log](03-provider-sign-in-google.log) for the final check results.
The final local suite passed 102 unit/component tests, seven integration tests and
15 headless Chromium checks, with all four builds and static checks passing. The
new browser cases exercise actual Firebase popup/redirect APIs against the Auth
Emulator, including a390px redirect viewport and cross-tab Logout during a popup.
Firebase's resolver still loads the official iframe library from apis.google.com;
test routes allow that helper and local services only. Optional emulator visual
assets and all other external origins are blocked.

Local browser provider pages are Firebase Auth Emulator simulations. They do not
prove Google consent, configured OAuth audience, hosted redirect behavior, Safari
or real-device storage policy. Real OAuth needs a separately agreed interactive
test. Provider-console screenshots establish configuration evidence only.

The ordinary entry remains compatibility-only; use `npm run dev -- --mode auth`
and `http://localhost:5173` for the incremental Auth surface. Auth builds remain
in ignored dist-auth. No hosting publication, cloud changes, staging, commit or
push is part of this checkpoint. Workspace provisioning, user data writes and
proof-based account linking remain later slices. Backup/recovery remains FUTURE.

## Next step

Implement Microsoft sign-in through the same adapter/controller boundaries, then
complete the shared responsive login presentation and agreed provider acceptance
checks. Both personal and work/school Microsoft accounts are required.

## Subsequent dev publication

The owner subsequently requested dev deployment and explicitly approved the
uncommitted snapshot. See the [dev deployment record](03-provider-sign-in-dev-preview.md).
The earlier implementation checkpoint above remains historical; hosted checks do
not constitute real Google OAuth acceptance.
