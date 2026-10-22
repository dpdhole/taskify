# Slice 1 — Foundation

Status: **implementation and validation complete; closure prepared for owner review**.
The owner accepted scope, stack, dependency conditions and all seven final
implementation boundaries. Foundation implementation is committed as `7ab542d`;
Hosting setup and deployment results are committed as `70fbe98` and `1e40c16`.
The separately authorized preview checkpoint passed. This closure preparation
does not authorize another commit, push, live promotion or Slice2 implementation. Authority: [slice plan](../implementation_plan.md),
[architecture](../architecture.md), [product specification](../product_spec.md).

The [readiness analysis](readiness-check.md) is part of this slice, not
optional background. Its [evidence summary](readiness-evidence.json)
records the original investigation. The subsequent dependency review records
accepted pins/conditions; final implementation evidence is recorded separately.

## Step-by-step checkpoints

| Step | Decision/work | Current status |
|---:|---|---|
| 1 | Agree narrow scope and acceptance boundaries | Accepted by owner |
| 2 | Agree framework/build/router/store/test stack | Accepted by owner; matrix below |
| 3 | Resolve/disposition dependency findings and choose exact pins | All five [dependency recommendations](01-foundation-dependencies.md) accepted; findings remain disclosed |
| 4 | Detail source boundaries, local configuration, scripts and tests | All seven recommendations accepted |
| 5 | Implement the agreed small architecture proof and tooling | Implemented and committed as `7ab542d` |
| 6 | Execute acceptance checks and review exact evidence | Final verify:all passed; [validation](01-foundation-validation.md); closure review prepared |

Decisions stay explicit. A later checkpoint does not silently approve an earlier
proposal. A commit/push or cloud action requires its applicable authorization.

## Step 1 — accepted scope

**Outcome:** one reproducible local static application with an executable proof
that UI, application/domain, state and persistence are separate and replaceable.
This enables later slices without implementing them.

| Included | Acceptance boundary |
|---|---|
| One application package | Fresh install from its own lockfile; no dependency on sibling experiment node_modules |
| TypeScript layer separation | Core compiles without browser/Node/Firebase types; enforce import boundaries |
| Minimal synthetic architecture proof | Typed port → application service → isolated store → small browser view; memory and emulator read adapters interchange without core changes |
| Local emulator configuration | Demo project/loopback only; validate config and ports; clean up owned processes; denied access/write test |
| Static build/browser proof | Build serves as static assets; route refresh/Back, narrow/wide viewport and basic keyboard smoke checks |
| Reproducible checks | Type, boundary, unit, browser and emulator checks; fast checks do not require Java |
| Git/config hygiene | Scoped ignores, portable runtime/cache discovery and frozen-evidence byte preservation |
| Developer guidance | Setup, commands, troubleshooting, rationale and limits; include readiness findings and their disposition |

Proof data is synthetic and read-only from the browser; fixture seeding is
test-only. It is not a production schema or a Task feature. Keep the proof out of
normal production navigation; determine its dev/test entry during detailed design.

**Explicitly excluded:** real provider sign-in/linking, full compatibility gate,
workspace/default/starter-Task provisioning, product navigation shell, Task CRUD
or lifecycle, complete query engine, user-manual publication, cloud setup/deploy,
CI service integration, server packages and future user backup/recovery.

Foundation supplies the hooks/boundaries for subsequent slices, not their business
behavior. Do not design every future entity, port or screen now. No performance
ceiling or coverage percentage is introduced by this scope.

## Step 2 — accepted stack

The owner accepted all 12 recommendations in the numbered stack review:

| # | Area | Accepted choice |
|---:|---|---|
| 1 | UI | React |
| 2 | Build/delivery | Vite, client-only static SPA; no SSR/server runtime |
| 3 | Routing | React Router, client-side data mode |
| 4 | Shared state | Zustand vanilla store factories with thin React bindings |
| 5 | Business layer | Plain TypeScript independent of React, Zustand and Firebase |
| 6 | Styling | CSS Modules and minimal design tokens; component suite deferred |
| 7 | Unit/component testing | Vitest and React Testing Library |
| 8 | Browser testing | Playwright |
| 9 | Packaging | One npm package, separated source folders and its own lockfile |
| 10 | Runtime | Node 24.21 / npm 11.19; preserve old experiment runtimes |
| 11 | Data access | Firebase behind application ports; no second query-cache library initially |
| 12 | Exact dependencies | Compatible exact pins after advisory disposition; no blind force fixes or major overrides |

The subsequent [dependency review](01-foundation-dependencies.md) records accepted
exact pins and bounded local-tooling exceptions. Audit findings remain disclosed;
there is no blanket production waiver. The stack is now implemented locally; historical investigation results alone do
not certify it.

## Step 4 — accepted final scope and implementation checks

The owner accepted all seven rows in this decision summary. It consolidates the scope
boundary with source/config/check choices so Foundation can proceed as one small
proof rather than a series of unrelated infrastructure projects.

| # | Decision | Recommendation |
|---:|---|---|
| 1 | Scope | Only a reproducible static skeleton and synthetic read-only architecture proof; no auth, compatibility gate, Tasks, provisioning, product shell or deployment |
| 2 | Source boundaries | One package: domain, application/ports, infrastructure adapters, state, UI and composition root; enforce allowed imports and compile core without browser/Node/SDK types |
| 3 | Proof isolation | Memory/Firebase adapters drive the same application service and per-instance store; proof has a separate dev/test entry and built proof artifact, absent from normal production entry/navigation |
| 4 | Local configuration | Explicit demo project/loopback configuration; refuse invalid/live settings, port conflicts and missing prerequisites; use process-local runtime/cache discovery and stop only owned processes |
| 5 | Checks | Separate fast checks (types, boundaries, lint, unit/component, static build) from full emulator/browser checks; both run reproducibly from the committed lockfile |
| 6 | Browser evidence | Real Chromium tests against the built proof at narrow/wide viewports, direct-route refresh/Back, keyboard/focus and failure/cleanup behavior; no claim of Safari/mobile-device support from viewport emulation |
| 7 | Preservation/documentation | Scope formatting/ignores to new code/outputs, preserve legacy/frozen bytes, document setup and exact evidence including advisory exceptions; no commit/push without instruction |

Implementation details under this agreement:

- The core TS configuration excludes DOM and Node global types; UI and tooling
  have separate configs. The import checker covers aliases and relative imports,
  with a negative fixture proving it catches a forbidden dependency.
- Proof data is a minimal synthetic status/value, not a Task schema or preview
  compatibility contract. Reject malformed probe/config values at runtime.
- Adapter tests cover data delivery, error states, unsubscription, isolated stores
  and stale callbacks after disposal. UI does not make SDK calls directly.
- Tests seed synthetic records using local test privilege; browser writes remain
  denied. Verify permitted probe reads and denied writes/other access, without
  introducing real provider sessions or trusting the browser as a security boundary.
- Keep the ordinary build a minimal static entry. A dedicated proof build exercises
  the same source boundaries and browser Firebase exports; test evidence clearly
  identifies the artifact. Inspect actual module graphs for forbidden Node/admin/
  CLI dependencies and ensure the ordinary artifact excludes test harness code.
- Commands may be named dev, build, preview, typecheck, check:boundaries, lint,
  format:check, test:unit, test:integration, test:e2e, verify and verify:all. These
  names are conveniences, not a new command framework. No Java for fast checks.
- Full checks own their emulator/browser processes and finally cleanup; fail on
  occupied ports instead of terminating unrelated processes. No Functions/PubSub
  or live Firebase resources. Do not use a global firebase/npx latest executable.
- Commit exact dependency locks and runtime guidance. Do not reuse experiment
  node_modules, rewrite old manifests or scan frozen sources with new formatters.
- Record check counts/statuses, tool versions and remaining gaps; do not impose
  arbitrary coverage/performance budgets. No user-facing manual or onboarding
  content for features that do not exist yet; Foundation supplies developer docs.

Exit review requires the agreed proof/checks to pass, the actual bundle exclusions
to be verified, audit findings/conditions to remain documented and historical
fingerprints to remain unchanged. See the separate validation report for checks actually executed.

## Readiness follow-through

The [readiness check](readiness-check.md) and its original JSON remain historical
inputs. Their implementation follow-through is complete:

| Readiness item | Disposition |
|---|---|
| Supported runtime and compatible pins | Independent lockfile and selected Node24/TS6/lint stack installed and validated |
| Candidate dependency findings | Actual audit still 12 packages; accepted bounded conditions documented; Hosting-only reassessment recorded in [preflight](hosting-preflight.md) |
| Browser prerequisites | Isolated Chromium cache installed; local and actual hosted browser checks passed |
| Frozen-file attributes | Tracked preservation rules and unchanged historical fingerprints verified; original log/evidence retained |
| Separate package/tooling | Clean npm ci and reproducible checks passed without sibling node_modules |
| Git publication | Source/setup/results committed locally; GitHub push remains a separate follow-up |

## Closure review

| Agreed deliverable | Evidence / result |
|---|---|
| Reproducible application and developer guidance | Independent package, lockfile, setup/commands and readiness disposition complete |
| Layer separation and replaceable read adapters | Strict core types, boundary checks and isolated memory/Firebase proof passed |
| Proof isolation, lifecycle and denied access | Unit/component, emulator integration, teardown/error and bundle exclusions passed |
| Local acceptance checks | 18 unit/component, 4 integration and 4 Chromium tests passed in the recorded final run |
| Additional Hosting checkpoint | Actual HTTPS/header/fallback/hash/exclusion checks, 390/1280px smoke, update and exact original-artifact restoration passed; [results](hosting-deployment.md) |
| Known conditions | Advisory findings and proof-bundle warning retained; no claim of product/platform acceptance |

No implementation work remains within the agreed Foundation scope. Closure
updates are prepared for staging and owner review; no closure commit is created
by this preparation. Original validation logs, JSON/input hashes and frozen
experiments are not rewritten or recertified.

Live promotion is **deferred until development matures and requires explicit
owner approval before any live deployment**. It is not a Foundation closure
blocker. GitHub push authentication/publication is a separate follow-up; known
advisories require ongoing reassessment under their recorded conditions.

The next planned slice is **Slice2 — Compatibility gate**. Product Auth/Firestore
connectivity, compatibility enforcement, provisioning, Tasks, production schema/
Rules/index validation and device/provider acceptance remain later-slice work,
not unfinished Foundation requirements. User backup/recovery remains FUTURE.
Overall platform feasibility remains INCONCLUSIVE.
