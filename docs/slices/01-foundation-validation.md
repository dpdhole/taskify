# Foundation slice — local validation

22 October 2026. **Implemented and locally validated; ready for owner review.**
No commit, push, live Firebase provisioning or deployment was performed.
See [detailing](01-foundation.md), [developer setup](../development.md),
[dependency conditions](01-foundation-dependencies.md), [readiness](readiness-check.md),
[final log](01-foundation-validation.log) and [exact evidence/input hashes](01-foundation-validation-evidence.json).

## Result

Final command: npm run verify:all, **exit 0** after a clean lockfile installation.

| Check | Result |
|---|---|
| Strict types | Passed: portable core without DOM/Node/SDK types, browser and tooling targets |
| Layer/cycle enforcement | Nine TS/TSX source files passed; tests reject forbidden relative/alias/SDK/nonliteral imports |
| Lint and scoped formatting | Passed |
| Unit/component | 18 passed, zero failures/skips |
| Local Rules/integration | 4 passed, zero failures/skips |
| Chromium browser | 4 passed, zero failures; no retries; 390px and 1280px viewports |
| Normal static build | 14 graph modules; excludes proof/application/domain/state/Firebase code |
| Proof static build | 115 graph modules; browser Firestore entry present; reviewed Node/Admin/CLI modules absent |
| Clean install | npm ci with scripts disabled, exit 0; independent package lock |
| Frozen evidence | All 256 SHA256 entries unchanged; immutable legacy spec unchanged |
| Advisory audit | Still 12 affected packages: 8 high, 4 moderate, zero critical; accepted Foundation-only conditions retained |

These are distinct Foundation tests, not additions to the overlapping historical
247-test platform experiment. No historical security suite was rerun or relabelled.

## Behavior actually exercised

- Shared application service with replaceable memory/Firebase read adapters;
  runtime rejection of malformed values and invalid/live local configuration.
- Reactive rendering, independent store instances, retry subscription replacement,
  stale callback rejection and teardown (including React StrictMode).
- Read of a single synthetic emulator document. Writes, collection listing and
  unrelated-document reads denied, including an authenticated test fixture write.
- Local Auth emulator response and Hosting root/deep-link SPA fallback. Mock/local
  fixtures are not real Google/Apple provider validation.
- Built proof at narrow/wide widths, keyboard focus, controlled memory update,
  direct route refresh/Back, Firebase listener update, malformed fixture error and retry.
- Ordinary static and development entries render correctly; direct proof entry/source
  URLs in ordinary development mode return404.
- Occupied-port preflight leaves its owner running; explicitly missing Java fails
  clearly even when the runner is invoked from another cwd. Child Node path handles
  the installed Windows path containing spaces.

Full checks use demo-taskify-foundation, loopback Auth/Firestore/Hosting and isolated
workspace caches. CLI15.34.1 selected Firestore emulator1.22.0; frozen1.19.8 was not
reused. Runtime: Node24.21.0, npm11.19.0, Java21.0.12.1; Playwright1.64.1 downloaded
Chromium156.0.8078.4. The CLI shut down all owned emulators after success/failure.

## Failures found and corrections

1. First emulator run started successfully but its child script could not resolve
   node under Windows PATH/Path casing. Normalize the child PATH and invoke the
   selected executable explicitly. The next emulator/browser run passed.
2. A later full rerun passed18 unit/component and4 integration tests but timed out
   in the ordinary development-entry test (3/4 browser tests passed). Restrict Vite
   dependency scanning to the selected HTML entry and bound denied-URL request
   timeouts. Direct diagnostic requests then returned root200 and all three expected
   proof URLs404; the final full run passed4/4 with no retries. These observations
   resolve the represented test; they do not prove an exhaustive root cause for all
   possible transient connection resets.
3. An initial direct diagnostic under restricted networking received loopback
   EACCES; it passed with the same network permissions used for full checks.

Original failed logs remain under ignored .local/validation; the checked-in final
log records the accepted final run. Failures are not counted as passing runs.

## Remaining limits

- This is a synthetic local proof, not product Task writes, compatibility gate,
  real identity linking, account initialization or the responsive product shell.
- Actual production Rules/schema/index coverage, billed quotas, real browser provider
  behavior and Safari/mobile-device acceptance remain unverified.
- The proof bundle triggers Vite's default large-chunk warning (~785KB minified,
  ~242KB gzip). The ordinary build is ~220KB minified/~69KB gzip. No agreed performance
  ceiling is claimed or warning suppressed; evaluate feature bundles in later slices.
- Known dependency findings remain, under the owner's narrow local-tooling conditions.
  Node/server use, external exposure and changed dependencies require reassessment.
- Boundary checks and finite teardown tests do not establish universal leak freedom
  or security of future features. A domain-specific production model is not created.
- GitHub push authentication remains a separate machine issue. No credentials or
  remote access were changed during Foundation work.

Next checkpoint: owner review of Foundation changes/evidence, then explicit commit
instruction. Slice2 compatibility work and all other features remain unstarted.

## Commit preparation

Git attributes now preserve the raw final log bytes so checkout/staging does not
normalize its recorded CRLF fingerprint. This post-validation packaging-only change
is listed separately in the evidence with both tested and packaged attribute-file
hashes. Original test/input hashes are retained; runtime/test source is unchanged.
No new runtime test result is claimed for this packaging adjustment.
