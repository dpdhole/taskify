# Foundation readiness check — analysis complete

**Readiness analysis is complete; Foundation slice will begin next.** This is
the pre-implementation assessment, not completed Foundation implementation or
unconditional acceptance of its candidate dependencies. Scope/stack agreement
and dependency disposition remain the next steps.

Statements about a clean/unchanged repository describe the baseline inspection,
before this report was added. Local evidence filenames refer to the original
sibling analysis directory, not missing application files. The
[versioned evidence summary](readiness-evidence.json) preserves candidate versions,
audit findings and hashes of those original artifacts. See the
[implementation plan](../implementation_plan.md) for the next checkpoint.

22 October 2026. Analysis only; not an accepted stack selection or implementation.
Repository: `C:/DD/Projects/TaskifyIt/taskify`, main at `7561306`.
The original analysis and dependency experiments were performed outside the
repository to preserve its clean working tree. This report and evidence summary
are now included in the repository; no application packages, code or configuration
have been changed.

## Conclusion

The agreed architecture is sufficiently defined to detail Foundation. The current
repository is not an application skeleton: it has documentation and frozen
verification experiments. Foundation must establish a small, executable boundary
proof and reproducible toolchain, not implement authentication, compatibility,
Task models or the later responsive shell.

Recommended stack: React + Vite + React Router + a per-session Zustand vanilla
store, TypeScript, CSS Modules, Vitest and Playwright. Use one root npm package,
not a monorepo or speculative server package. This recommendation still requires
owner agreement. Exact dependency pins are not ready for unconditional adoption:
strict resolution succeeded, but the candidate audit has known transitive findings
that require disposition and browser/build exposure verification.

## Verified workspace and machine facts

| Check | Result |
|---|---|
| Working tree/index/untracked files | Clean; nothing to discard or delete |
| HEAD | `7561306 docs: plan feature-focused slices and starter tasks` |
| Remote freshness | `git fetch origin` succeeded during this analysis |
| Divergence | HEAD ahead 2, behind 0; architecture commit `6551859` also local |
| Push state | Prior attempt failed 403 as professionalbays; authentication remains an operational issue, not a local coding blocker; no new push attempted |
| Effective identity | DD <dpdhole@gmail.com> |
| Repository instructions | No repository AGENTS.md found |
| App/package/config source | No root package.json, src, .gitignore or tracked .gitattributes |
| System tools | Node 24.21.0, npm 11.19.0, Git 2.55.0.windows.5 |
| OS | Windows build 26200 (Windows 11 generation) |
| Java | Copied Temurin runtime 21.0.12.1 executes successfully; not on normal PATH |
| Frozen runtime | Node 22.16.0 retained in sibling gate1; use only for recorded experiments |
| Known test/development ports | No listeners found on 5000, 5173, 8080, 9099, 4400, 4500 at inspection; availability is transient |
| Playwright browsers | No standard local ms-playwright browser cache found; installation unverified |
| Manifest working files | All 256 SHA256 entries match |
| Manifest committed blobs | All 256 HEAD file hashes also match; not merely a worktree-only check |
| Regression preflight | 30 historical + 18 combined inputs verified; zero security tests executed by preflight |
| Previous relocation run | Recorded 247 passed, zero failures/skips/cancellations, exit 0; not rerun for this analysis |
| Junctions | None found inside repo; outside relocation-check node_modules points to gate1/taskify-gate1/node_modules |

The copied gate1–4, sources and relocation-check directories contain supporting
tools and evidence. They are intentionally preserved. No recursive cleanup or
junction-target traversal/deletion is needed to make the repository clean.

## Toolchain investigation

Read official npm registry metadata, selected exact candidate versions, then ran
an isolated `npm install --package-lock-only --ignore-scripts --engine-strict
--no-audit --no-fund` with its own cache. It completed successfully in 34 seconds.
No node_modules install, lifecycle scripts, app scaffolding or browser downloads
were performed. The generated lock has 967 package entries including its root.
Resolution success is not compilation, runtime or security acceptance.

| Candidate | Version | Assessment |
|---|---|---|
| Node / npm | 24.21.0 / 11.19.0 | Already installed; recommend exact local reproduction baseline |
| React / React DOM | 19.3.1 | Matching pair resolved |
| Vite / React plugin | 8.3.5 / 6.1.2 | Compatible majors resolved |
| React Router | 8.5.0 | Node >=22.22.0; installed Node 24 works, copied Node 22.16 does not |
| Zustand | 5.0.16 | Vanilla store supports framework-independent state container; keep domain code independent of it |
| TypeScript | 6.0.3 | Deliberate compatible candidate rather than latest major 7.0.2 |
| typescript-eslint / ESLint | 8.72.0 / 10.13.0 | Lint peer support is TypeScript >=4.8.4 <6.1.0; latest TS7 is outside it |
| Node types | 24.19.2 | Match the selected runtime major, not latest Node26 declarations |
| Vitest | 5.0.5 | Vite8/Node24 satisfy metadata; actually running tests remains necessary |
| Playwright | 1.64.1 | Browser install and execution remain necessary |
| Firebase SDK | 13.1.0 | Separate from frozen SDK11 experiments; adapter behavior must be revalidated |
| Firebase CLI | 15.34.1 | New isolated toolchain; do not silently force the frozen emulator binary onto it |
| Rules unit testing | 6.0.0 | Node >=24.12.0 and Firebase ^13; installed Node works, copied Node does not |

Additional exact test/lint/formatting pins are in the sibling package.json.
Do not copy this analysis manifest into the repo without review. Use npm ci from
the eventual committed lockfile; avoid floating npx latest commands in reproducible
runners. No machine-global tool upgrade is needed merely because npm offers one.

### Candidate audit and dependency risks

`npm audit --package-lock-only --ignore-scripts --json` reported **12 affected
packages: 8 high, 4 moderate, 0 critical**. These are package counts, not twelve
independent remotely exploitable vulnerabilities. Raw report: dependency-audit.json.

| Route / finding | Current evidence | Required disposition |
|---|---|---|
| Firebase → Firestore → grpc-js | Firestore 4.19.0 requires ~1.9.0 and resolves grpc-js 1.9.16; advisory patched boundary 1.13.6 | Firebase metadata separates Node/browser entry points. Browser exclusion is plausible, not proven: inspect actual Vite bundle and test Node integration path before determining exposure |
| CLI → chokidar → braces | Dev dependency braces 3.0.3; nested-pattern stack-exhaustion advisory | Assess trusted local input route and compatible upstream remedy; do not expose development services publicly |
| CLI → Pub/Sub → OpenTelemetry core | Dev dependency core 1.30.1; baggage propagation advisory | Determine whether CLI local-emulator path invokes vulnerable behavior; document remedy/disposition |
| CLI → gaxios → uuid | Dev dependency uuid 9.0.1; buffer-bound advisory for particular functions | Trace usage before disposition; a blind cross-major override is not a verified fix |

Other audit entries propagate these chains to parent packages. npm's suggested
fixes include major downgrades (for example Firebase9) and are not automatically
appropriate. Do not run audit fix --force or blanket override majors. Version
resolution and an audit report are not substitutes for testing a remediation.

This is an unresolved dependency-selection/acceptance item, not evidence that the
Firebase architecture is infeasible. Foundation can be scoped now, but do not call
the candidate secure or adopt its final pins without documenting their treatment.

## Recommended decisions and alternatives

| Decision | Recommendation and reason | Challenge / alternative |
|---|---|---|
| UI/build | React + Vite static SPA | React itself cautions that scratch apps own routing/data integration; explicitly choose those pieces rather than grow an ad hoc framework |
| Router | React Router data mode, client-only, minimal proof routes | No SSR/server handlers. Framework SPA mode is viable but adds conventions unnecessary for this first proof |
| Shared state | Zustand vanilla store factory and thin React binding | Context/reducer is possible; Redux Toolkit is viable but more structure than the proof needs. Never put business rules inside React hooks/store actions merely for convenience |
| Data ownership | One application metadata store later; no second query-library cache by default | Do not add TanStack Query/RTK Query just because common templates include them; avoid duplicate authority beside Firestore listeners |
| Styling | CSS Modules and a minimal token file | Defer a large component kit, charts, rich-text editor, drag/drop and icon system until features justify selection |
| Validation | Strict TS plus small runtime decoders for config/probe data | Do not design all Task/schema validation now; select a validation library only if actual complexity warrants it |
| Project shape | One npm package with clear src boundaries | Future server reuse needs portable business code, not packages/workspaces or an empty server project today |
| Test layers | Vitest for unit/component tests; Playwright for browser/static/emulator smoke | Do not treat DOM simulation as a real-browser test or combine Node-only SDK imports into browser tests |

## Proposed source and configuration layout

```text
src/
  domain/                 plain TS values/rules; no DOM, React, Node or Firebase
  application/            use cases and domain-oriented ports
  infrastructure/
    firebase/             SDK/config translation and lifecycle cleanup
    memory/               deterministic adapter for proof/tests
  state/                  per-session vanilla store/projection; no domain authority
  ui/                     React views/components/hooks and minimal styling
  app/                    composition root, router and dependency wiring
tests/
  unit/  component/  integration/  e2e/
tools/                    Node-based checks and emulator orchestration
docs/                     existing docs plus developer setup/proof report
verification/firebase/    unchanged frozen evidence; not imported or formatted
```

Root files would include package/lock, pinned runtime/package-manager indication,
strict TS configs, Vite/Vitest/Playwright configs, lint/format configuration,
.gitignore/.gitattributes and local emulator configuration. Exact filenames are
implementation choices. No cloud project binding, deploy command, Functions or
Admin SDK enters the browser bundle.

### Enforce boundaries rather than just documenting folders

- Domain/application compile in a separate TS target without DOM libraries or
  Node/Firebase/React types; tests/tooling have separate configurations.
- Restrict direct and relative imports by layer; test a deliberately forbidden
  import so a convenient alias does not make the checker decorative. Prevent cycles.
- UI calls application services, not Firebase APIs. App composition wires adapters;
  domain/application depend on interfaces, not concrete infrastructure classes.
- Keep Firebase Timestamp, DocumentReference and snapshot metadata inside adapters.
  Do not choose the full production timestamp/schema representation in Foundation.
- Inject clock, identity, IDs and persistence as needed. Avoid a generic repository
  framework, transaction abstraction or versioned Task schema before real use cases.
- Store factories isolate instances; subscriptions dispose on unmount/session
  teardown and old callbacks cannot publish after disposal. Domain reuse does not
  require reusing UI state on a server.

## Minimal architecture proof — definition of scope

Use an explicitly labelled development/test Foundation probe, not a fake product
screen or prematurely implemented Task feature:

1. A narrow typed read/subscribe port emits a validated probe value/status.
2. A memory adapter drives a small application service and store projection.
3. React renders that projection and reacts to one controlled update; a second
   instance proves no shared-state leakage and disposal stops late updates.
4. Swap in a Firebase emulator adapter through composition without changing
   domain/application code. Test fixture setup seeds one synthetic probe record.
5. Deny writes by default; permit only the narrow local probe reads needed for
   the test. Test a denied access/write. Emulator fixture privilege stays in tests.
6. Browser tests exercise the built static output, direct route refresh/Back and
   narrow/wide viewports with keyboard access to the small proof controls.

Probe data must be obviously synthetic and local, and must not establish the
production schema. Do not publish production business writes through SDK default
queuing; the accepted online-write transport belongs to its implementing slices.
Authentication fixtures are not real Google/Apple evidence. The compatibility
gate itself belongs to slice2; until it exists, no actual workspace/provisioning
or business operations are exposed as usable product functionality.

## Configuration, Git hygiene and local orchestration

- Validate local configuration before constructing adapters. Require demo- project
  ID and loopback hosts; reject missing/malformed or real-project configuration
  rather than silently fall back to production. Bind development servers locally.
- Browser-exposed configuration is public. Never include operator credentials,
  service-account JSON or tokens in VITE_ values or examples.
- Use separate/new CLI/emulator cache selection for the new stack. Check Java,
  CLI version, expected emulator binary and ports first. Use process-local PATH/
  JAVA_HOME overrides with configurable discovery; no hardcoded old/new PC roots.
- Fail clearly if a port is owned elsewhere; do not terminate arbitrary Java/Node
  processes. Track and stop only processes this run starts; use finally cleanup.
- Run emulator-integrated suites sequentially with unique demo IDs or isolated
  fixtures. Do not clear someone else's running emulator instance.
- Add scoped ignores for node_modules, new build outputs, env-local files,
  emulator cache/logs and browser reports. Do not broadly hide evidence files or
  stop checking tracked manifests.
- Add tracked line-ending rules for new source plus explicit -text preservation
  of frozen verification bytes. Current effective attributes preserve frozen
  files, but no tracked .gitattributes exists; make fresh-checkout behavior
  reproducible without renormalizing historical files or the legacy spec.
- Format/lint only new application/tool sources, not archived verification. A
  successful new app install must not replace any candidate's frozen lockfile.

## Proposed acceptance matrix

These are recommendations for slice detailing, not extra approved product scope.

| Evidence | Pass condition |
|---|---|
| Clean installation | npm ci with supported Node/npm, committed exact lock, no dependency on sibling node_modules |
| Type/layer checks | Strict TS, core without browser/Node/SDK APIs, forbidden import test and no cross-layer cycle |
| Unit/component proof | Runtime decoder rejects malformed probe/config; adapter interchangeability, reactive update, store isolation and teardown proven |
| Emulator smoke | Auth/Firestore/Hosting tools start locally as needed, narrow probe read succeeds, denied access fails, all owned processes stop |
| Browser smoke | Dev and production-build startup, direct refresh/Back, narrow/wide layouts, basic keyboard/focus and failure/retry presentation |
| Bundle | Static assets; no Node built-ins, Admin SDK, test fixtures/credentials or accidental real endpoint defaults; examine Firebase browser conditional resolution |
| Reproducibility | Commands run from any cwd/paths with spaces; no absolute machine roots; missing Java/ports/config fail usefully |
| Dependency review | Candidate peer/engine checks and audit/exposure dispositions; no blanket force fixes |
| Preservation | 256 manifest entries and legacy spec unchanged; generated files ignored; no cloud or deployment changes |
| Documentation | Developer quickstart, dependency rationale, troubleshooting, proof limits and per-slice documentation/template impact (no new onboarding feature yet) |

Suggested commands: dev, build, preview, typecheck, lint, format:check, test:unit,
test:integration, test:e2e, verify, verify:all. Fast checks should not require Java;
full local checks explicitly start/stop emulators and browsers. Use local package
executables rather than installing tools globally. Exact names may be simplified.

No numerical performance budget, coverage percentage, Task cap or full beta browser
matrix is imposed by Foundation. Record observations and choose future thresholds
from relevant feature benchmarks. A mobile viewport smoke is not Safari/iOS proof.

## Implementation order within Foundation

1. Agree this narrow scope and stack, including dependency risk treatment.
2. Establish Git/runtime/package/config hygiene without touching historical files.
3. Add minimal static React/router build and type/layer tooling.
4. Add the memory-adapter application/store proof and meaningful unit tests.
5. Add current local-emulator tooling and read-only Firebase proof.
6. Exercise real browser/static-build paths, cleanup and negative config cases.
7. Finish developer instructions and an exact evidence report; review before commit.

Do not generate the 30-slice directory tree, mock the entire domain, design every
future port, implement the app shell, account init or starter Tasks now. Those
would violate the agreed small-slice theme. No user manual with unimplemented
feature instructions is needed yet; Foundation contributes developer setup docs.

## Checks executed versus still pending

Executed: Git cleanliness/fetch/divergence, local tool versions, port inspection,
working and committed manifest validation, regression input preflight, official
documentation/registry research, strict lock-only dependency resolution and
lock-only advisory audit. No full historical suite rerun, dependency installation,
application compilation, actual architecture proof, new emulator run or browser
test occurred. Those require the scoped implementation and its tooling.

Decisions to settle: proposed React/Vite/router/Zustand/test stack; one-package
layout and proof boundary; dependency advisory disposition before final pins.
No other high-level product decision must be silently invented for Foundation.
GitHub write authentication remains a separate operational issue before push.

## Sources

- [React: build from scratch](https://react.dev/learn/build-a-react-app-from-scratch)
- [Vite guide](https://vite.dev/guide/) and [static build](https://vite.dev/guide/static-deploy.html)
- [Vite environment handling](https://vite.dev/guide/env-and-mode)
- [React Router modes](https://reactrouter.com/start/modes)
- [Zustand vanilla store](https://github.com/pmndrs/zustand/blob/main/docs/reference/apis/create-store.md)
- [TypeScript configuration](https://www.typescriptlang.org/tsconfig/)
- [Vitest requirements](https://vitest.dev/guide/)
- [Playwright installation](https://playwright.dev/docs/intro)
- [Firebase emulator setup](https://firebase.google.com/docs/emulator-suite/install_and_configure)
- [Firestore emulator/demo projects](https://firebase.google.com/docs/emulator-suite/connect_firestore)
- [Firestore offline behavior](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [Official TypeScript ESLint metadata](https://registry.npmjs.org/typescript-eslint/8.72.0)
- [Official Rules test metadata](https://registry.npmjs.org/@firebase%2frules-unit-testing/6.0.0)
- [Official Firestore exports](https://registry.npmjs.org/@firebase%2ffirestore/4.19.0)
- [gRPC advisory](https://github.com/advisories/GHSA-m9gg-hp2v-232j)
- [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [uuid advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq)

Registry versions/advisories are a dated snapshot, not a promise about future
latest tags. The adjacent package/lock/audit files preserve the exact candidate
examined; they are analysis artifacts outside the repository, not approved app files.
