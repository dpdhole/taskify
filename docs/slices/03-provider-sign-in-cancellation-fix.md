# Slice 3 — Cancellation button correction

23 October 2026. Fixed locally; prepared for review against `2a7332a`.

## Report and cause

On desktop, close the Google or Microsoft popup, then select Cancel sign-in before
Firebase's popup-close polling settles. The page says signed out but briefly shows
Logout underneath the provider controls.

The controller used an unfinished SDK sign-in promise as a reason to offer Logout,
even after cancellation had been confirmed. The promise can remain pending for a
few seconds after the popup closes; it does not establish an authenticated session.

## Correction

An unfinished provider promise alone no longer enables Logout in the signed-out
state. The pending-operation lock remains until the SDK promise settles, preventing
another attempt from overlapping it. Logout/retry recovery for an actual identity,
quarantined session or observer failure remains available. No provider adapter,
credential handling, compatibility policy or backend configuration changed.

Four new regressions first failed against the old implementation: controller
emissions and rendered controls for Google and Microsoft. They now verify that
confirmed cancellation never shows Logout while the popup promise is still pending,
that late cancellation settlement keeps the page signed out, and that provider
controls become usable after settlement. Two additional checks retain sign-out
recovery when the Auth observer fails during an active attempt.

## Validation and review boundary

- Final `npm run verify` passed: 118 unit/component tests, strict type checks,
  lint/format, boundaries, all four builds and bundle-isolation checks.
- The first broad check encountered an existing preflight-test assumption: with
  the requested preview running on port 5173, the launcher reported its occupied port
  before the deliberately invalid Java path. Application regressions passed.
  The two preflight cases were temporarily excluded for local checks; after the
  owner explicitly requested stopping the server, full verification passed without
  exclusions. No unrelated process was stopped and no preflight code was changed.
- The owned local Auth preview was stopped at the owner's request; port 5173 is free.
  No new interactive OAuth or emulator-browser run was needed for this controller
  condition; the new UI regressions exercise the actual React session view in jsdom.
- [Evidence](03-provider-sign-in-cancellation-fix-evidence.json) and
  [final verification log](03-provider-sign-in-cancellation-fix.log).
- Source, regression tests and documentation are staged for review only. No commit,
  push, cloud configuration or deployment. Existing dev and Slice3 acceptance state
  remain unchanged; final login presentation and real-provider acceptance remain open.
