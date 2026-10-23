# Slice2 compatibility validation

23 October 2026. **Implementation, local validation and the explicitly approved
Firestore checkpoint passed. Slice closure awaits review, commit and clean-source
Hosting preview verification.** At the validation checkpoint, implementation changes were unstaged/uncommitted.
The owner subsequently authorized staging for review; no new commit or push has occurred. No cloud Hosting publication or live promotion occurred.

See the [accepted specification](02-compatibility-gate.md),
[implementation record](02-compatibility-implementation.md),
[executed log](02-compatibility-validation.log) and
[exact inputs/cloud evidence](02-compatibility-validation-evidence.json).

## Executed checks

| Check | Result |
|---|---|
| Portable core, browser and tooling types | Passed |
| Layer/cycle boundaries | 19 source files passed; forbidden dependencies rejected |
| Lint / scoped formatting | Passed; repeated after the final Hosting-check refinement |
| Unit/component | 61 passed; no failures |
| Emulator Rules / integration | 7 passed; no failures |
| Chromium | 8 passed; no failures or retries; 390px and 1280px |
| Build/module isolation | Three builds passed; ordinary artifact excludes synthetic controls; no Admin/CLI/Node provider code |
| Real Firestore | Missing singleton blocks; revision 1 bootstrap observed by existing listener; offline revokes; reconnect verifies and restores |
| Cloud public access | Singleton GET200; list403, unrelated GET403, attempted write403 |
| Hosting policy locally | Hashes, cache/security headers, fallback, exclusions and matching compiled/release identity passed; real gate reaches ready under CSP at both widths |
| Cloud inventory | Correct project/number; billing disabled; fresh Standard/Native database asia-south1, free tier and deletion protection; no active keys/Web Apps/custom domains/live releases |
| Frozen inputs | No changes against HEAD in verification, immutable legacy spec or original Foundation/readiness evidence |
| Dependency audit | Unchanged12 findings: 8high, 4moderate, 0critical; no dependency pin changes |

The full npm run verify:all attempt passed fast verification, then exited2 when
the sandbox loopback hub did not start within60seconds. A free-port checked
node tools/run-emulators.mjs outside the sandbox then completed with exit0,
including7 integration and8 browser tests. This is a split successful validation,
not a claim that the last combined command exited0. Final type/lint/format checks
also exited0 after the Hosting validation flag was added.

## Behavior and limits

Domain cases cover canonical numeric versions, inclusive boundaries, malformed/
missing/unsupported contracts, environment and required-family mismatches,
unreadable retained schemas, prohibited writers and atomic publication conflicts.
Gate cases cover cached/unverified snapshots, server failures/deadlines, stale
reads/listeners/generations, revocation, reused/regressing revisions, resume/
reconnect and cleanup. Synthetic consumers reject closed admission, discard stale
loads, preserve input and reconcile unknown submitted outcomes before another
explicit command. These controls are excluded from ordinary builds.

Emulator tests separately bypass the client gate to verify Rules. Cloud Rules
allow only exact singleton get and deny client lists/writes/other documents.
The independent emulator write fixture checks allowed schema, ownership and
invariants; it is not deployed and does not establish real Task authorization.
Request/listener instrumentation is not a measurement of billed Firestore reads.

The cloud client used explicit VITE_TASKIFY_PROJECT_ID with no API key or Web App
registration. Existing CLI credentials authorized operator actions only; they are
not part of the browser artifact. The first headless client observed the absent
singleton, then the transactionally bootstrapped revision1 without a page reload.
Offline/reconnect checks used Playwright network control and browser lifecycle
events. Real device radio changes, Safari and provider authentication are untested.

Only revision1 was published. Automatic approval review rejected a proposed
revision2 mutation because approval covered bootstrap revision1; it was removed
and never executed. Incompatible-policy updates, revision changes and stale
publisher cases are local/emulator evidence, not real-cloud observations.
DNS failures before database submission were resolved and absence independently
rechecked; database creation then completed once. Unknown outcomes must always
be reconciled before retry. An earlier strict optional-property typing failure
and UI implicit status collision were corrected before passing checks.

The configured ordinary bundle is698.87KB /213.91KB gzip; the unconfigured build
is634.20KB /194.90KB gzip. Proof/harness bundles also retain Vite's size warning.
No size-performance acceptance threshold or platform-wide feasibility acceptance
is inferred. The existing Foundation dependency conditions remain bounded to
local/PoC checks; these results are not a blanket production security approval.

## Release position

The cloud-check artifact records sourceDirty:true and publishable:false. Its
identity/hash evidence describes the tested working tree, not an immutable
release commit. Review and an owner-authorized commit must precede preparing a
fresh artifact for the accepted compatibility-smoke Hosting preview checkpoint.
That preview is pending. Existing Foundation preview evidence remains historical.

No visible windows or interactive logins were used. Owned test ports were checked
first; runners shut down their services without stopping unrelated processes.
Live promotion remains deferred until development matures and needs explicit
owner approval. Product sign-in, provisioning, Tasks and user backup/recovery
remain outside this slice; backup/recovery is FUTURE.
