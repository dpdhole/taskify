# Slice3 — Auth adapter and session controller

23 October2026. **Step2 implemented and locally validated in the working tree.**
[Configuration](03-provider-sign-in-configuration.md) preceded this step. Google/
Microsoft sign-in interactions and controls are subsequent steps; neither provider
is claimed usable yet. No cloud settings, deployment, commit or push in step2.

## Implemented behavior

- Firebase Auth adapter initializes explicit LOCAL persistence, probes usable
  browser storage and waits for SDK initialization. It projects only UID and
  optional name/email; SDK objects, tokens and raw SDK errors stay out of core/UI.
- A single stable Firebase app owns Auth and the memory-cached Firestore client.
  The shared contract reader uses that database. Existing isolated proof/emulator
  reader construction remains available for its separate entries.
- Portable session controller keeps restoration separate from compatibility.
  Protected admission requires identity, completed initialization and the current
  gate generation. Logout stays available while compatibility is blocked.
- UID changes, restoration retries, Logout and disposal advance the session
  generation and invoke the account-state clearing hook. Current app composition
  has no account/workspace records to clear; future stores must attach to this
  boundary. Async consumers must validate both session and compatibility tickets.
- Logout immediately hides identity/protected content and invalidates admissions.
  Success requires both SDK completion and a null identity observation. A temporary
  fresh observer also permits confirmation after the restoration observer fails.
  Failure/15-second timeout keeps content hidden and permits explicit Logout retry;
  superseded SDK settlements cannot clear or reopen newer work.
- Normal operation has one Auth observer. Logout temporarily adds one confirmation
  observer. Stop/dispose releases subscriptions without signing out the remembered
  session. Runtime disposal also terminates Firestore and deletes the app instance.
- Session store/view shows restoring, signed-out, gated identity, minimal verified
  account, retry and Logout states. No login flash before initialization, real
  workspace, provisioning, linking or enabled provider sign-in controls.

The same-origin configuration and callback registrations from step1 are retained.
Persistent sessions are origin-scoped: dev/qc/uat share the backend but do not
share browser session storage. Stable app naming preserves refresh persistence
within an origin; it is not cross-domain single sign-on.

## Running this checkpoint

~~~powershell
npm run dev -- --mode auth
npm run build:auth
npm run verify
npm run verify:all
~~~

For real local configuration, open http://localhost:5173. Auth mode loads ignored
.env.auth.local. Unknown hosts or missing configuration fail closed. The separate
`dist-auth` artifact is an incremental validation target, not a newly published
preview. Ordinary/default mode retains the compatibility-only surface; selecting
Auth as the final ordinary product entry is part of completing Slice3.

SDK imports are permitted only in infrastructure. No hosted API, generic account
repository, new dependency pin or Firestore Rules widening was added. Provider
sign-in methods/attempt cancellation guards will extend the port in the Google/
Microsoft flow steps; late OAuth completion behavior is not claimed covered by
this restoration/Logout checkpoint.

## Validation

- npm run verify passed: types,25-file boundary/cycle checks, lint/format,
  **85 unit/component tests**, four builds and module isolation.
- Final emulator runner passed: **7 integration tests and11 Chromium tests**, no
  browser retries. Includes existing Foundation/compatibility regressions.
- New controller cases exercise initialization/observer ordering, blocked gate,
  UID transitions, stale admission, storage failure, observer failure, restoration
  timeout/retry, failed/unknown Logout and late SDK settlement/disposal.
- Adapter unit cases verify strict cloud/demo separation, persistence failure,
  minimal identity projection and sanitized failures; UI component cases exercise
  restoration, compatibility-blocked Logout and failed-Logout presentation.
- Headless browser checks use real Firebase SDK + loopback Auth emulator with
  synthetic identities, not Google OAuth. At390/1280px they render the session
  screen, verify no overflow, refresh persistence and gated UI Logout. A two-tab
  check covers identity replacement and Logout propagation.
- Browser fixture is served only by the loopback session-test Vite mode on5176.
  Ordinary development denies its URL; all four build graphs exclude tests and
  administrative/Node libraries. Nothing from this fixture is a product sign-in
  mechanism. Owned port checks abort if occupied; services were shut down.

[Executed logs](03-provider-sign-in-session.log) and
[exact inputs/evidence](03-provider-sign-in-session-evidence.json) distinguish
this run from the immutable Foundation and preceding configuration checkpoints.
A first typecheck caught a test-library option mismatch and was corrected before
passing checks. Final browser checks include the rendered UI refinement. Existing
bundle-size warnings remain; no performance or real-provider acceptance inferred.
Auth build is approximately757.7KB /232.3KB gzip at this checkpoint.

## Remaining work

Next implement Google flow, then Microsoft flow, with duplicate-attempt prevention,
provider cancellation/error classification, popup/redirect handling and protection
against late provider completion after Logout. Complete the combined restoration/
redirect/race matrix afterward. Preserve the session boundary when adding methods.

Microsoft account types and both callback lists were visually verified from owner
screenshots. Microsoft secret expiry, Google audience/test-user restrictions and
actual OAuth completion remain unverified. Ask before any visible/interactive
provider test. Headless emulators are not evidence of live provider feasibility.

All hosting/promotion requests still require an explicit channel. Live promotion
remains deferred until the product is ready and explicitly approved. Account
linking is Slice4, workspace/profile provisioning Slice5 and user backup/recovery
FUTURE. Slice3 is not complete at this checkpoint.
