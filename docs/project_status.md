# Taskify — Project Status

> **Controlling revision (2026-10-19):** Owner-agreed major redesign is documented in **docs/product_spec.md §17**. Its three-state lifecycle, independent pause, unified All Tasks/Saved Views and Home Dashboard supersede contradictory earlier Issue 11–18 sections below. Earlier sections remain historical context. No revised code, deployment or beta/production migration is claimed; old environments will be abandoned. Implementation-design details deferred to vertical slices are enumerated in §17.10; the approved Reference and Global Search amendment is §17.8. **§18 records the Firebase Spark PoC/beta architectural baseline and corrected Task/Discussion/Todo/Activity Log ownership.** The legacy specification remains immutable.

## 2026-10-22 — Foundation closure prepared for staging and owner review

- No implementation work remains in the agreed Foundation scope. The [closure review](slices/01-foundation.md#closure-review) consolidates accepted deliverables, original local validation, committed implementation/setup/results and the completed Hosting preview checkpoint.
- Final recorded local checks: 18 unit/component, 4 integration and 4 Chromium tests passed. Separately recorded actual HTTPS/mobile/desktop/update/restoration checks passed. Original validation logs/evidence and frozen experiments remain unchanged.
- Implementation/setup/results commits: `7ab542d`, `70fbe98`, `1e40c16`. This closure preparation updates documentation only; no closure commit, push or live promotion is performed.
- Live promotion is deferred until development matures and requires explicit owner approval. It does not block closure. GitHub push authentication/publication and continued advisory reassessment are separate follow-ups; the 12 findings remain disclosed.
- Next planned slice: Slice2 — Compatibility gate; not started or implicitly authorized by closure preparation. Overall platform feasibility remains INCONCLUSIVE; product/provider/schema/Rules/index validation remains later-slice work.

## 2026-10-22 — Owner defers live promotion

- Live promotion is deferred until development matures and requires explicit owner approval before any live deployment. Preview validation, slice completion and continued development do not authorize it. This deferral does not block Foundation closure or later slices.
- Hosting deployment results/evidence were committed as `1e40c16`; no push or live promotion occurred. See the [deployment policy](hosting_deployment_plan.md).

## 2026-10-22 — Foundation Hosting preview verified and original artifact restored

- [Preview](https://taskify-dev-dpdhole--foundation-smoke-jpbwhoel.web.app) expires 29 October 2026 at 15:25:04 UTC. Clean local source commit `70fbe98`; no push or live promotion performed.
- [Deployment results](slices/hosting-deployment.md) and [execution evidence](slices/hosting-deployment-evidence.json) record successful initial HTTPS/browser checks, rehearsal update, cached/fresh 390/1280px verification, exact first-artifact restoration and final checks after generated-key cleanup.
- An initial rehearsal navigation timed out before mutation; the explicit rerun passed. Post-deployment comparison detected an auto-created Firebase browser key; the unused key was deleted and actual preview checks passed again.
- Final cloud assertions: project ACTIVE, billing disabled/no linked account, empty database/Rules/apps/bucket/domain/key lists, Auth unconfigured, Functions API disabled, live timestamp/releases unchanged and no enabled-API changes.
- Overall platform feasibility remains INCONCLUSIVE; product Auth/Firestore/index/compatibility validation remains open. Deployment results were subsequently committed as `1e40c16`; no push was performed. Live promotion is deferred under the owner decision above.

## 2026-10-22 — Earlier checkpoint: clean start completed; Hosting publication pending

- Owner designates project `taskify-dev-dpdhole` (number `243252492098`) for planned PoC/testing reuse. Project ID/number are independently verified; see [preflight results](slices/hosting-preflight.md) for resource metadata and inspection limits.
- [Hosting plan](hosting_deployment_plan.md) sequences authentication/identity checks, read-only inventory, explicit site/preview targeting, deployment-tool advisory reassessment, separate Hosting-only config, artifact checks, preview publication/verification and prior-artifact restoration.
- Owner subsequently instructed "Do not preserve legacy resources. Perform clean start." The legacy Firestore database/data/indexes, Rules release/ruleset, custom-domain binding and browser API key are removed and independently verified absent from active lists. See [clean-start evidence](slices/firebase-clean-start.md). The project and empty default Hosting container remain; external DNS is unchanged.
- Owner authorized step-by-step implementation. Signed in as `dpdhole@gmail.com`; initial GET-only inventory recorded the old resources; post-reset lists now confirm an empty application baseline with billing still disabled. Separate Hosting-only config and artifact/local-validation tools are prepared. Local HTTP and 390/1280px Chromium checks pass. Cloud cleanup is complete. The owner requested commit preparation; the Hosting configuration, three tools and related documentation/evidence are prepared for staging. Lint, formatting, validated-input fingerprints and reset-evidence checks pass. No commit, push or Hosting publication has occurred. Publication awaits a reviewed clean commit and identified artifact. Hosting success would not establish Auth/Firestore connectivity or platform acceptance.

## 2026-10-22 — Foundation commit preparation

- Foundation source, pinned toolchain/configuration, meaningful tests, developer guidance and slice/readiness/dependency/validation documentation are prepared for staging. Generated dependencies/builds/caches/reports remain excluded.
- Runtime/test inputs still match the validated fingerprints. A packaging-only Git-attribute rule preserves raw validation-log bytes; evidence records this separately without overwriting original tested hashes. Frozen verification/legacy content remains unchanged.
- No runtime source change required repeating the passed checks. Commit/push are not performed by this preparation.

## 2026-10-22 — Foundation implemented and locally validated; review pending

- Owner accepted all seven final implementation boundaries after stack/pin/advisory decisions. Slice1 now has the React/Vite static skeleton, isolated read-only memory/Firebase proof, portable core/ports, per-instance store, strict types/import boundaries and reproducible local checks.
- [Validation](slices/01-foundation-validation.md): clean npm ci and final verify:all exit0; 18 unit/component, 4 emulator integration and 4 Chromium tests passed. Normal/proof build isolation and reviewed Node/tooling exclusions passed. All256 frozen fingerprints and immutable legacy bytes remain unchanged.
- The first local runner failed Windows Node lookup; a later browser run timed out in the dev-entry test. Corrections/diagnostics and the final no-retry pass are recorded, not hidden. Known12 dependency findings (8high/4moderate) remain under the accepted Foundation-only conditions; proof bundle size warning remains visible.
- [Developer setup](development.md), [detailing](slices/01-foundation.md), readiness, dependency review and exact source/log evidence accompany the slice. Generated dependencies/builds/emulator logs/browser reports are ignored; historical experiments are untouched.
- This is Foundation-only local evidence, not product authentication/compatibility/Task implementation or overall platform acceptance. Slice2 remains unstarted; overall feasibility remains INCONCLUSIVE. Owner review is next; no staging, commit, push, cloud setup or deployment was performed.

## 2026-10-22 — Foundation dependency recommendations accepted

- Owner accepted all five [dependency review](slices/01-foundation-dependencies.md) recommendations: compatible exact pins, browser-only Firebase imports with actual bundle verification, disclosed Foundation-only local-tooling advisory treatment, no blind overrides/downgrades and reassessment on dependency/exposure changes.
- Findings remain reported, not patched or waived for production/server use. The isolated browser-graph proof is not Foundation runtime acceptance evidence.
- [Foundation detailing](slices/01-foundation.md) now proposes the final narrow scope, source boundaries, proof isolation, local configuration, checks, browser evidence and preservation/documentation decisions. No app scaffold, application dependency installation, commit or deployment has started.

## 2026-10-22 — Foundation stack accepted; dependency review next

- Owner accepted the 12 stack recommendations: React/Vite static SPA, React Router data mode, Zustand vanilla store factories, plain TypeScript business code, CSS Modules/tokens, Vitest/Testing Library/Playwright, one package, Node24.21/npm11.19 and Firebase adapter isolation without a second query cache.
- Exact versions require compatible pins and advisory disposition; tool acceptance does not silently accept unresolved dependency risk. [Foundation detailing](slices/01-foundation.md) records the matrix; readiness evidence remains unchanged as the historical candidate snapshot.
- Dependency investigation is next. No app scaffold, installation, runtime code, commit/push or deployment is claimed by this update.

## 2026-10-22 — Readiness check complete; Foundation slice next

- [Readiness check](slices/readiness-check.md) and [evidence summary](slices/readiness-evidence.json) record the completed pre-implementation analysis, including strict dependency resolution, audit findings, machine checks and frozen-input verification.
- Foundation slice will begin next with scope/stack agreement and dependency disposition. Readiness analysis completion does not imply that candidate dependencies are approved or the Foundation proof is implemented.
- No app scaffold, application dependency installation, production schema, compatibility gate or authentication implementation has started. User backup/recovery remains FUTURE. The Foundation detailing draft is excluded from this readiness commit as requested.

## 2026-10-22 — Small feature-focused slice order and starter Tasks agreed

- [Implementation plan](implementation_plan.md) records 30 planned slices: foundation/compatibility/identity, initial Task journey and starter Tasks, complete queries/persistence, lifecycle/work content, Dashboard/settings and cleanup/release integration. Rows split further if detailed scope becomes broad; no slice has started.
- Product specification §23 records Learn usage (full description/checklist), Explore settings (medium description/no Todos), and Find Documentation (short description/links), provisioned once as ordinary Tasks with safe retries. Templates evolve for new provisioning without rewriting existing user content or recreating deleted examples.
- User documentation and applicable provisioning-template updates accompany every feature slice. Slice 9 introduces descriptions/manual pages; slices 18/20 add checklists/dedicated links. Guidance describes available features, not unfinished roadmap items.
- Small end-to-end slices are the core theme; audited events and ownership/deletion integrity accompany each feature, not final cleanup/viewer work. Full-query persistence precedes richer content/charts. User backup/recovery remains FUTURE.
- Owner authorized preparing/staging this plan for review only. Next is slice 1 detailing and scope agreement; no product implementation, commit/push, cloud provisioning or deployment is implied. Overall feasibility remains INCONCLUSIVE.

## 2026-10-22 — Architecture documentation reconciled for staging

- Product specification §22 consolidates the owner-agreed high-level architecture policies; [architecture](architecture.md) details the accepted stack/boundaries, topology, compatibility, schemas, release/rollback and deferred work. README and feasibility summaries link the current baseline.
- User backup/recovery is FUTURE, not a PoC/beta prerequisite. Slice design and unverified platform/browser/provider behavior remain explicitly open; overall feasibility remains INCONCLUSIVE.
- Documentation only. The owner authorized staging for commit preparation, not committing/pushing or beginning a new implementation slice. Historical test evidence and the immutable legacy specification remain unchanged.

## 2026-10-22 — Validation policy agreed; high-level architecture review checkpoint

- Owner agrees independent domain tests, adapter/adversarial Rules checks, critical browser/compatibility/conflict/recovery validation, coordinated release matrix/rollback checks and diagnostics without Task content or credentials/tokens. Start with reproducible local checks; exact tools/checks and CI remain slice details.
- Emulator results alone do not establish release readiness; browser and separately authorized live identity/index evidence remain distinct.
- [Architecture](architecture.md) records reviewed high-level policy gaps as resolved, with remaining slice design, unverified feasibility/integration and deployment-specific decisions explicitly separated. User backup/recovery remains FUTURE and is not a PoC/beta prerequisite.
- This is a design/documentation checkpoint, not completed architecture implementation or platform acceptance. Overall feasibility remains INCONCLUSIVE; no new implementation slice, commit, push, cloud setup or deployment is authorized.

## 2026-10-22 — Reusable business-layer boundaries agreed

- Owner accepts plain TypeScript domain/application code separated from UI and provider SDKs, explicit persistence/identity/clock/ID boundaries, runtime input validation and atomic whole-operation contracts.
- Possible future server reuse follows the same business code plus server adapters/API transport. A server tier would require separate authorization and independent authentication, authorization, integrity and direct-write policy; reuse does not imply zero-change migration.
- Recorded in [architecture](architecture.md). Exact modules/ports remain slice details; no speculative server package, product implementation or deployment is introduced.

## 2026-10-22 — TypeScript and stack-selection baseline agreed

- Owner agrees TypeScript for UI, application/domain services and persistence adapters, static responsive browser delivery and provider-specific SDK isolation behind adapters. UI uses application services.
- Select UI framework/build tool/state library together in the first implementation slice; pin application dependencies separately from frozen experiment tools. Recorded in [architecture](architecture.md); no server tier, new dependency, runtime code or deployment is introduced.

## 2026-10-22 — Quota and performance policy reaffirmed

- Owner retains benchmark-informed slice detailing, evidence-based limits, loading optimizations and clear failure/retry behavior; no speculative account cap.
- Test retained Task volume including Trash and unfinished accumulation. The 500-Task fixture and Closed retention are not capacity ceilings. Thresholds/optimizations remain slice work; production indexes and actual quota usage remain unverified.
- Recorded in [architecture](architecture.md). Documentation only; no new limits, runtime changes, benchmarks or cloud actions.

## 2026-10-22 — User backup/recovery deferred to FUTURE

- Owner records the need for user-driven backup/export/recovery mechanics but explicitly defers implementation to FUTURE. PoC/beta may operate without user backup/recovery; it is not a prerequisite or acceptance blocker.
- Selected-Task recovery is the discussed scope direction; trusted-owner exceptional manual recovery remains an operational approach, without routine backup, full account/project-loss recovery, schedule/retention or recovery guarantees.
- Product specification §18.5, [architecture](architecture.md) and [accepted decisions](feasibility/firebase-validation-decisions.md) record this amendment. Earlier entries describing unresolved backup-method scope/prerequisites are superseded. Ordinary write recovery, integrity and interrupted-purge safety remain required. Documentation only; no implementation or new verification.

## 2026-10-22 — Mutation acknowledgement and recovery policy agreed

- Owner agrees pending feedback/duplicate-submit prevention, known-offline rejection without queuing while preserving input, and success only after cloud acknowledgement or authoritative reconciliation.
- Lost acknowledgement means unknown outcome; reconcile before retry or conflict reapplication. Retry only when operation-specific checks make it safe; permanent rejection explains failure and preserves recoverable input without automatic loops.
- Recorded in [architecture](architecture.md). Identifiers, bounded retries and reconciliation mechanics remain slice details; no universal exactly-once guarantee, runtime implementation or new passing tests are claimed.

## 2026-10-22 — Version-conflict user choices agreed

- Owner agrees Reload latest, Apply my changes where safe, or Cancel/keep editing. Explain concurrent changes, warn before discarding input and preserve input on cancellation.
- Overwrite never supersedes integrity/consistency. Reapplication uses latest state and fresh version checks, preserves unrelated concurrent changes and obeys Rules, lifecycle and atomic/event invariants. A new conflict may occur; invalid actions remain unavailable rather than forcing stale state.
- Recorded in [architecture](architecture.md). The subsequent entry above resolves the remaining acknowledgement/lost-ack/retry policy. No runtime implementation or tests occurred.

## 2026-10-22 — Metadata loading and cache policy agreed

- Owner agrees one eligible metadata store for Search/Views/Dashboard, completeness only after required metadata and labels load/validate, and cache/partial results never presented as authoritative. Scope expansion loads missing data before complete results; detail payloads remain on demand.
- Cloud-acknowledged changes update shared membership/order/counts together; reconnect reconciles before current/complete status. Logout/account switching clears or isolates user state.
- Completeness does not require full refetch on every navigation. Cache/listener/pagination choices remain benchmark-informed slice details; separate collection listeners do not imply transactional read consistency. Recorded in [architecture](architecture.md); documentation only, with no new implementation or tests.

## 2026-10-22 — Identity and account linking policy agreed

- Owner agrees stable authenticated-ID ownership rather than email ownership, authenticated proof of both identities for linking, and verified matching email as a resolution hint rather than merge authorization. Different/private email uses explicit linking from an authenticated account.
- Google/Apple intent remains subject to feasibility validation. No automatic merge of existing duplicate accounts or their Tasks/data is approved; recovery requires a separately defined process.
- Provisioning must be idempotent/retryable without duplicate defaults. Provider configuration, linking/re-authentication screens and recovery mechanics remain slice details. Recorded in [architecture](architecture.md); no runtime implementation, cloud configuration or new verification occurred.

## 2026-10-22 — Schema and upgrade policy agreed

- Owner agrees independent versions for independently evolving record families, separate from concurrency counters; explicit legacy decoders and safe rejection of unknown/malformed records; writes use a schema permitted by the active contract.
- Only deliberately invoked, implemented/tested, meaning-preserving upgrades are allowed. Reads do not implicitly write. Upgrades are transactional/idempotent and preserve concurrent edits or report conflicts; immutable Activity Events are decoded rather than rewritten for schema modernization.
- Prefer lazy upgrades where safe and planned migrations for cross-record invariants. Exact families, triggers and migration mechanics remain slice details. Recorded in [architecture](architecture.md); no runtime changes, migration or new verification occurred.

## 2026-10-22 — Deployment and rollback policy agreed

- Owner agrees coordinated release records linking client build, Rules/indexes, contract and schema support; compatible policy/index expansion precedes client publication and support advertisement after prerequisite verification.
- New-schema writes require readable support in all supported clients; retirement depends on retained data and client support. Prefer additive changes/readers before new writers; breaking transitions need an explicit plan, without automatic destructive conversion.
- Rollback floor is the oldest build compatible with current data schemas and policy. Otherwise use a forward fix or separately approved recovery; Hosting rollback alone does not undo data.
- Recorded in [architecture](architecture.md). The later schema entry above resolves upgrade policy; exact commands, automation and release checks remain slice details. Documentation only; no deployment, runtime implementation or new verification occurred.

## 2026-10-22 — Compatibility lifecycle policy agreed

- Owner agrees authoritative boot checks before workspace loading/provisioning/mutations, suspended new operations during resume/reconnect checks, and observation of contract changes while open with readiness revocation on incompatibility.
- Unavailable/incompatible checks block new operations, preserve unsaved input and offer retry/update guidance. Submitted writes require cloud-outcome reconciliation, not assumed cancellation or blind retry. No network compatibility fetch before every write is required; operations honor the shared gate and Rules retain integrity enforcement.
- High-level policy resolved in [architecture](architecture.md). The later deployment entry above resolves ordering and rollback; listener mechanisms, timing, recovery screens and implementation/testing remain slice work. Documentation only, with no new runtime guarantees claimed.

## 2026-10-22 — Compatibility contract checks agreed

- Owner agrees inclusive minimum/maximum app releases, understood contract format, matching environment, readable retained schema population and permitted write schemas. Server release is deployment traceability; no separate client-maintained server-release range is required.
- An early new client may temporarily show release-unavailable/retry; avoid repeated automatic reloads. Rules independently enforce integrity against modified clients.
- High-level contract decision resolved in [architecture](architecture.md); the later entries above resolve lifecycle, rollout and schema-upgrade policy. Detailed mechanics remain slice work. Upper app-bound enforcement is still unimplemented/untested; no new runtime verification is claimed.

## 2026-10-22 — High-level architecture and compatibility strategy documented

- [Architecture overview](architecture.md) consolidates the accepted layers, Firebase Spark stack, runtime/deployment topology and logical ownership; framework/build/store choices remain open. Google/Apple intent follows §21.5, with feasibility/linking unverified.
- Proposed release strategy separates app/server releases, contract format/revision, record/query schemas and concurrency counters. It describes explicit upper/lower client bounds, server support, schema-family compatibility, revocable lifecycle checks, coordinated publication and data-aware rollback.
- These mechanics were recorded as design proposals; the subsequent agreement above resolves the contract-check subset. The frozen helper still lacks client-ahead enforcement and application-wide browser integration. High-level gaps and slice responsibilities are recorded; overall feasibility remains INCONCLUSIVE.
- Documentation only: no experiment source, historical evidence, product/legacy specification, production configuration or runtime code changed. No commit, push, provisioning or deployment authorized by this update.

## 2026-10-21 — Responsive screen UX consolidation committed

- **Controlling UX addition:** `docs/product_spec.md` §21 consolidates owner-agreed high-level Dashboard, Task Views, Create, Settings, authentication and Task Detail behavior. This is documentation only.
- **Dashboard supersession:** full-width burn-rate and always-expanded responsive 1/2/3-column Saved View chart grid replace §17.6's collapsible Home chart sections and expansion-session behavior. Pie/legend drill-down still opens the unchanged View and expands/scrolls to its target group.
- **Task Views:** grouped responsive table, with stacked label:value rows on narrow screens; normal View entry has all groups collapsed. Task Detail Back restores expansion, scroll, search and origin context.
- **Create and Settings:** mobile Quick Create sheet → full-screen Advanced; desktop centered Quick modal → large centered Advanced. Views/Categories/Locations use sortable list/table management with explicit Save Order; Preferences, Cleanup and My Account use responsive forms. Cleanup requires processing feedback and retry/recovery design.
- **Identity:** Google and Apple sign-in with shared hero, persistent device auth, provisioning/loading feedback and secure same-verified-email account resolution intent. Email OTP is only a candidate. Firebase Spark provider feasibility and linking contracts require validation.
- **Task Detail:** mobile ordered sections and desktop two-column composition. External-link Attachments aggregate Discussion-owned and independent Task-associated links; independent-link ownership/data model remains for slice design. Binary uploads are outside PoC/beta.
- **Status:** UX direction documented, **not implemented, tested, deployed or migrated**. Remaining slice work: forms/actions, breakpoints, accessibility, data integrity, identity linking and cleanup recovery.

## 2026-10-21 — Larger-screen and desktop shell UX recorded

- **Owner-agreed responsive shell:** `docs/product_spec.md` §20 governs desktop/tablet adaptations to §19: top-of-navigation Create (no FAB), collapsed icon rail with icons in natural expanded-layout positions, hover-triggered temporary overlay preview (mouse-out closes), and burger-controlled persistent expansion that pushes/resizes main content. Explicit Close returns to rail, especially on touch/tablet.
- **Desktop navigation:** Task Views and Settings sections remain open, navigation scrolls independently, global View ordering and protected All Tasks semantics are unchanged. Persistent expansion survives page navigation and the current browser session; a new session defaults to collapsed rail.
- **Desktop headers:** Standard header contains burger, branding, contextual title and single-line explicit-submit Search. Task Detail retains Back action bar with more visible actions before overflow, with title/context below; Settings uses Back, title and overflow only.
- **Status:** owner-agreed design direction documented, **not implemented/tested**. Breakpoints, accessibility, animations, action sets and touch/pointer coexistence deferred to slices.

## 2026-10-21 — Mobile-first application shell UX recorded

- **Owner-agreed mobile shell direction:** Standard Home/Task View header uses burger, left-aligned contextual title and header Search; Task Detail/Settings use Back-only icon action header with title/context below, variable primary actions and overflow.
- **Drawer:** left overlay, Home always visible, mutually exclusive Task Views/Settings inline sections, default expansion derived from active task-versus-settings context. Views follow the same global user order as Dashboard, with protected All Tasks last by default and reorderable. Settings includes Views, Categories, Locations, Preferences, Cleanup and My Account; Task Views also offers a Manage Views link.
- **Search/Create:** expandable header Search retaining §17.8 semantics; right-anchored adaptive Create FAB on Home/Task Views only, extending with label when idle, collapsing to fixed-position icon on scroll, fading to approximately 20% on rapid/sustained scroll without disabling interaction. Quick Create bottom sheet has Title, defaulted Category and Location, and More expands to full-screen.
- **Authority:** Details in `docs/product_spec.md` §19. These are agreed UX specifications, **not implemented or verified**. Desktop shell design, exact task action lists, styling, thresholds and other slice mechanics remain open. §19 supersedes §18.1's older mobile bottom Search/Create and top-right Settings placement, without changing §17 functional contracts.

## 2026-10-21 — Integrity policy retained; quota handling deferred to slice validation

- Further server-constraint relaxation is abandoned. Accepted client-side Saved View semantic validation remains; existing server integrity protections stay in place.
- Detail quota-related limits and useful blocking/recovery behavior within implementation slices, based on benchmarking during slice testing/validation. No speculative usage cap or new blocking policy is introduced now.
- Web client only for PoC/beta; mobile/public API remain future scope. Version provisioning and safe compatibility are release responsibilities. Explicit client-ahead-of-server blocking remains an unimplemented/untested compatibility detail; the existing 247/247 result does not prove it.
- Latest evidence remains **247/247 passing**, including 192 inherited security regressions. Overall platform feasibility remains INCONCLUSIVE. Latest findings are prepared for staging; await commit.

## 2026-10-20 — Accepted client query validation and compatibility experiment

- Owner accepts detailed Saved View semantic checking in supported client code for PoC/beta, with high-level server integrity checks. Full-query persistence remains required; Task security remains server-enforced.
- Maintain server compatibility contract, app and schema versions; prefer backward compatibility and safe upgrades, block incompatible clients at boot and recheck on resume/reconnect.
- New local verification passed **247/247**, zero failures/skips/cancellations, exit 0: [client query and compatibility report](../verification/firebase/client-query-compatibility/VALIDATION.md). Full-query persistence, Save As, malformed-definition rejection in the client, compatibility blocking and safe/concurrent legacy upgrades passed; all 192 inherited security cases passed. Earlier failing candidate remains preserved. No production/cloud change or new commit occurred. Overall platform feasibility remains INCONCLUSIVE.

## 2026-10-20 — Full-query persistence priority and findings checkpoint

- Owner confirms full-query persistence is a core feature and intended differentiator over other Todo/Task managers. Complete supported View definitions must remain saveable/reloadable; the current candidate failure remains unresolved.
- Prepare the local findings and accepted decisions for commit. De-scoping analysis is deferred until after commit; no reduced query scope or changed validation boundary is approved.
- Trash may retain expired Closed Tasks longer; no Trash duration/cap is agreed. Three-month Closed retention does not bound total retained metadata.

## 2026-10-20 — Complete local query/workload assessment: one blocking candidate failure

- [Assessment for owner decision](feasibility/firebase-verification-assessment.md): latest extended candidate ran **237 tests, 236 passed, one failed, zero skipped**. All 192 inherited cases passed. A valid full-date-filter Saved View definition exceeds the 1,000-expression Rules ceiling; full query persistence is not approved. This is a candidate-design failure, not proof that every Spark representation is infeasible.
- Local load: 12 users × 500 retained Tasks × six cold loads delivered 36,504 server-backed metadata documents without child payloads in list loading. The confirmed 4–6 opens/one device and active-Task Discussion assumptions fit normal read models conditionally; reconnects, cleanup and retained history can exceed quotas. Estimates are not billing measurements.
- Next decision: clarify Saved View validation depth before redesign. Retain all filters; choose strict Rules validation with a smaller representation, or Rules ownership/protected-definition/version/envelope checks plus fail-closed client filter semantics. Neither is accepted; Task authorization remains independent of View definitions. Real Google/session/index testing needs cloud authorization. Complete account recovery is not added as a PoC requirement.
- Known-good combined candidate/historical sources remain unchanged. No commit, push, cloud operation or product/legacy specification edit occurred. Current local source/report: [query-workload](../verification/firebase/query-workload/VALIDATION.md).

## 2026-10-20 — Decisions recorded; combined security regressions passed

- [Accepted decisions and scope correction](feasibility/firebase-validation-decisions.md): irreversible deletion starts at the first physical child deletion; exceptional development/admin recovery is a manual service-owner operation; minimal content-free purge tombstones may remain; Closed retention is three calendar months with manual cleanup; unfinished Tasks do not expire automatically. Beta workload inputs are recorded, not capacity-validated.
- Complete account/project-loss recovery was an assistant scope expansion and is not an approved mandatory PoC blocker. The explicit manual backup/export/recovery requirement still needs its scope agreed. Clarify before expanding scope or acceptance criteria.
- Source/findings were committed as `ea6280e`. Following the owner's “Proceed,” the [combined security regressions](../verification/firebase/regression/combined/VALIDATION.md) passed **192 tests, zero failures/skips**, against the unchanged inventory-enabled Rules. All 147 carried-forward Gate 2 cases, 20 original Gate 3 cases, seven new cross-gate cases and 18 Gate 4 cases are represented. Sweeps accepted 1–3 independent aggregates and rejected 4 or more with full inventory rollback. No new commit, cloud action or production change occurred.

## 2026-10-20 — Local Firebase Gates 1–4 executed; overall feasibility INCONCLUSIVE

- **Current evidence:** [consolidated findings](feasibility/firebase-validation-results.md) and [isolated experiment source/evidence](../verification/firebase/README.md), executed against baseline `38a7fb7383ae99948f003d68fe7d77e8e4b20dfa`. The dated entries below retain historical status; statements that no experiment has run describe their original date.
- **Gate 1:** 101 tests passed after the fixed-India planned-date correction; PASS for represented Task/event/date contracts. General timezones/DST, final creation-event policy and global command deduplication are not established.
- **Gate 2:** 147 tests passed, including 101 carried forward; PASS for represented entity contracts with the owner's accepted client-only NFC/grapheme policy. Malicious-client Unicode normalization/grapheme enforcement remains a known limitation.
- **Gate 3:** original 20 tests passed; tested resumable deletion works, including a 505-child fixture. The subsequent combined run retained those cases and added seven cross-gate cases. Overall INCONCLUSIVE: manual recovery method scope/evidence remains open. Owner decisions resolve the Restore boundary, operator approach and tombstone policy; complete account/project recovery is not an approved PoC prerequisite.
- **Gate 4:** 18 tests passed for local ownership, metadata/Search/reactivity, mock Auth and static Hosting. Overall INCONCLUSIVE: real Google/session restoration, complete queries/offline-write handling, production indexes and a bounded Spark workload remain unvalidated.
- **Evidence limits:** overlapping counts must not be summed. Represented combined regression coverage is now recorded, but production deployment, complete schema/query coverage and full platform acceptance are not claimed. The old 420-test callable suite is not evidence for these contracts.
- **Authority:** owner authorized local experiments, the naming compromise, and preparation/staging of experiment findings. No commit, push, cloud provisioning/deployment, paid service, production architecture change or specification amendment is implied. Product specification and immutable legacy file remain unchanged.
- **Next checkpoint:** review the combined results, clarify the remaining manual recovery scope and workload inputs, then complete remaining authorized local validation. Real-Google/Spark testing needs separate authorization. See the findings document for the verdict process.

## 2026-10-19 — Legacy Firebase validation review and handoff

- **Historical evidence reviewed:** Commit `46108abcdff3a60ec812170ebd63a8bb3830b7f5` records a local 420-test verification set (116 API unit, 63 Admin Firestore integration, 174 Security Rules, 39 query/index, 28 callable HTTP). Results are **historical local evidence** and were not rerun against the simplified client-direct Firebase architecture.
- **Critical architectural gap:** The old design trusted a callable backend for Task lifecycle and Activity Log writes and denied equivalent direct-client writes. The current Firebase Spark client adapter needs revised Security Rules to secure Task/event atomicity, event immutability, ownership and concurrency; historical Rules do not certify those guarantees.
- **Handoff:** See [`docs/feasibility/firebase-validation-gap-analysis.md`](feasibility/firebase-validation-gap-analysis.md) for source references, reused/retired coverage, four proposed gates and pass/fail criteria. **Gate 1** is the next proposed feasibility activity, requiring separate implementation approval: direct-client Task mutation + mandatory Activity event pairing under adversarial Rules tests.
- **Execution status:** Documentation and validation planning only. No new PoC, Rules, tests, Firebase provisioning, deployment, or verification executed. All current product/domain decisions remain governed by `docs/product_spec.md` §§17–18.

## 2026-10-19 — Firebase Spark high-level architecture and data model

- **Owner-approved PoC/beta platform:** Firebase Spark free-only Authentication (Google sign-in), Firestore, static Firebase Hosting. No paid services, no custom hosted API, no Cloud Functions or server-managed sessions. This supersedes the earlier proposed dedicated TypeScript API/direct Google OAuth/MongoDB-first delivery architecture.
- **Client architecture:** layered UI → application/domain services and shared Task state → provider-independent ports → Firebase adapter. Cloud authoritative; Firestore Security Rules are the actual authorization boundary, not client-side domain mutators.
- **Corrected domain ownership:** Only Discussion supports user comments and external-link attachments; Todo is a Task-owned checklist record with no Entries or attachments; Activity Log is append-only structured system-event Entries extending the Discussion Entry concept. Binary file uploads/storage are deferred beyond PoC/beta.
- **Logical/physical model:** Task-centric aggregate, independent user-owned Saved Views/Categories/Locations/Settings; tentative user-scoped Firestore tasks, todos, discussionEntries and activityEvents collections. Exact layout remains a design proposal pending validation (§18).
- **Atomic integrity requirement:** Task lifecycle/other audited mutation and its required Activity Log event succeed or fail together. Conflict protection and adversarial Firestore Security Rules tests are mandatory feasibility gates; client batch atomicity alone is insufficient.
- **Permanent deletion blocker:** Firestore subcollections do not cascade. Before cleanup implementation, validate safe partial-failure/recovery behavior for multi-step permanent deletion; do not claim arbitrary hierarchy deletion can be one atomic batch.
- **High-level navigation direction:** Gmail-inspired Dashboard, shared Saved Views, Task Detail; Profile/Settings top-right, bottom Create/Search control with scroll hiding. Further UI specifics deferred to slices.
- **State:** Architectural direction and logical ownership approved; Firestore collection layout and rule correctness proposed/unverified; no Firebase resources provisioned, code implemented, or deployment performed. See controlling specification §18.

## 2026-10-19 — Lifecycle, schedule, saved views and Home redesign

- **Lifecycle:** Draft, In Progress, Closed; Pause independently definite/indefinite, with fixed reasons, per-pause-episode comment, Edit Pause and Resume; separate closure outcomes Done vs five failure reasons, direct Reopen; Start/Resume conflict resolution.
- **Scheduling:** Start as quick action, Schedule from Draft with optional Pause Until Start and system-generated "Waiting to start" comment; Reschedule tertiary. Actual Start independent of scheduling.
- **Views:** Home Dashboard, shared All Tasks workspace with mandatory Group By, Save/Save As/Reset, navigation discard warning and cross-device Settings → Views ordering. Six editable Saved Views are automatically provisioned (Focus, Scheduled, Priority, Local, Completed, Deleted). Protected system All Tasks is the seventh View, last by default, always visible on Home and immutable as a saved definition; global ordering is user-adjustable.
- **Dashboard:** global nondeleted distinct-Task New/Closed clustered burn-rate and per-Saved-View collapsible pie/legend sections with drill-down.
- **Scope:** Remove DOW/TOD Task preferences and HERE/NOW proximity; keep TOD date-entry shortcuts resolved as timestamps; Location remains classification with coordinates latent only.
- **Lifecycle reconciliation closed (2026-10-19):** Draft + Paused activity does not change Draft or set Actual Start; Reopen preserves an empty Actual Start; Start remains available to In Progress Tasks when Actual Start is empty. See §17.2–17.3.
- **Views provisioning/grouping closed (2026-10-19):** All seven Views initially appear on Home. The six ordinary Saved Views are editable/deletable; All Tasks is protected and always visible. Group By partitions Tasks exclusively, with missing dates in Unspecified last. Provisioned default groupings and within-group sorts appear in §17.5. UI design details remain deferred.
- **Filtering and cleanup resolved (2026-10-19):** All Views support Closure Reason as multi-select Filter-only, available when Include Closed is on; disabled selections remain stored but inactive. Include Closed and Include Deleted are independent; Deleted Date presence is the sole deletion indicator and allows the Deleted preset to isolate its population. Account-wide, manual cleanup now resides in Settings → Cleanup, with independent retained N Days/Months thresholds, strictly older-than cutoff, confirmations and partial-failure safeguards. See §17.5 and §17.9.
- **Date and Dashboard default reconciliation (2026-10-19):** §17.1 now governs N Days/Weeks calendar offsets, N Months same-day/clamp-to-month-end semantics, local clock-time preservation, deterministic DST handling, Planned Start/Paused Until start boundaries, Due end boundaries, and midnight TOD rollover. Rescheduling Planned Start never modifies Paused Until automatically (§17.4). Dashboard defaults to Last 7 Days, then remembers the user's choice (§17.6). These decisions supersede old Paused Until end-of-slot rules.
- **Dashboard interaction resolved (2026-10-19):** Zero-count groups and empty Saved Views retain Open View access. Chart segment/legend navigation opens the unchanged Saved View and scrolls/expands the target group; no temporary query restriction. Counts include all matching Tasks independent of expansion (§17.6).
- **Reactive View contract resolved (2026-10-19):** Successful Task mutations update shared store/state and reconcile row membership, grouping and counts locally; this supersedes §7.4's stationary-edited-row/manual-Refresh contract (§17.7). Implementation mechanisms are deferred by slice.
- **Major-changes discussion CLOSED (2026-10-19):** Functional redesign and cross-spec supersession audit recorded in §17.10. Historical sections remain for traceability, not parallel authority. Next phase: design-first vertical implementation slices, with detailed UI, infrastructure, state-management and backend decisions deferred. No implementation or deployment claimed.
- **Post-closure Reference and Global Search amendment approved (2026-10-19):** One optional Task Reference (free text, max 255, no uniqueness); header Search is an explicit-submit, temporary, client-side single-phrase text filter across Title, Category, Location and Reference within the currently open Task View, defaulting to All Tasks only for a nonempty submission with no open View. Preserve grouping/sorting/zero groups; Search is never saved and clears on navigation except Task Detail → Back. Full eligible result population required. Earlier §9.5 deep/standalone Search is superseded (§17.8).
- **Status:** major redesign and post-closure Search/Reference amendment approved and documented; implementation and backend feasibility unresolved. Legacy file unchanged.


> **Historical status (2026-10-13): Issues 15–17 closed at their then-current logical level; MongoDB Atlas Free was the next candidate at that time. This has been superseded by the 2026-10-19 Firebase Spark selection and revised ownership model in §18.** The redesigned product behavior is consolidated in `docs/product_spec.md`; unresolved details remain open and implementation is not claimed. The previous Firebase baseline remains available in Git history. No revised implementation or deployment is claimed.

## Authority and governance

This file is the canonical project entry point. The project owner makes all material product, architecture, repository and operational decisions. Explicitly distinguish **current discussion agreement**, **approved repository baseline**, **proposal**, **open issue**, **implemented**, and **verified**. Do not treat legacy implementation as evidence for the redesigned architecture.

## Legacy specification preservation policy

- `docs/product_spec_legacy.md` is a **read-only historical reference**, not a working specification or editable source of requirements.
- **Never create, edit, overwrite, reformat, synchronize, or otherwise modify** `docs/product_spec_legacy.md` during subsequent specification revisions, implementation, or documentation cleanup.
- Use it only to understand historical intent or compare previous behavior with the revised specification. Conflicts are resolved through current owner-approved decisions and `docs/product_spec.md`, **not** by treating legacy content as current authority.
- **Retain the file until the project owner explicitly authorizes its deletion.** Do not infer deletion approval from cleanup requests, migration progress, obsolete content, or a future release.
- Changes to current product behavior belong in `docs/product_spec.md`, with project status updated here. Deleting the legacy file is a separate owner-controlled action.

## Repository and historical baseline

- Repository: https://github.com/dpdhole/taskify
- Historical approved baseline: `main` through DEC-082 before the simplification branch. The older decisions, Firebase backend, rules, tests and verification evidence are recoverable from Git history.
- Cleanup preparation branch: `docs/simplification-revision-intent-2026-10-12`; source head before cleanup: `c0a4751aae50edf6e95a2c57490bbf392f5590c0`.
- `docs/product_spec.md` is the **working simplified product specification**, recording discussion decisions and explicitly unresolved requirements. `docs/product_spec_legacy.md` preserves the older product specification as a **legacy reference only**.
- Historical discussion reconciliation proposal: `docs/proposals/taskify-simplification.md` at commit `92b15eb80ee85dae9802e43d6ec9de1dc2c897b2`. That proposal is preserved in Git history after cleanup.
- Replacing or deleting files from the working tree does not invalidate Git history or approve revised business rules.

## Current development state

The previous Firebase Category backend, tests, indexes and task/API slice were implemented and verified within recorded historical scope. They are **not** a working Appwrite application. The simplified client, persistence, authorization and deployment have not been implemented or verified. Repo cleanup does not delete cloud resources or migrate production data.

## Simplified product direction — agreed in discussion

### Scope and identity

- Single-user, mobile-first/responsive task management; no collaboration accounts, role-based task participation, or delegation.
- Cloud-authoritative online writes, optional offline read cache, no offline write synchronization.
- Backend selection is open under Issue 18. **Appwrite Cloud Auth + DocumentsDB was the earlier preferred proposal but is not feasible for PoC/beta under the owner's ongoing-cost constraints**; MongoDB Atlas Free is the next candidate for evaluation. Google social sign-in remains the preferred sign-in UX, subject to provider/security validation. Taskify-owned data-access adapter remains the architectural direction.
- Client-side last-modified conflict warning is **best effort**; atomic concurrency guarantees are not assumed.

### Task and category model

- Lifecycle and fixed grouping order: **Draft → Planned → In Progress → Waiting → Blocked → On Hold → Done → Cancelled → Unable to Complete**.
- Creation defaults Draft; Draft → Planned is explicit. Qualifying user activity promotes Draft/Planned to In Progress. Interrupted tasks require explicit Resume; closing and reopening follow lifecycle contracts.
- Each Task has permanent Notes & Comments and System threads; optional Todo Threads replace independent subtasks. Significant system events are immutable; persistence/atomicity remains to be specified.
- Every Task belongs to a Category; permanent protected Uncategorized; other Categories globally reordered, renamed, icon-adjusted, or archived without breaking task references.
- Remove task-level Priority. Keep Important, Urgent, DOW and TOD as user preferences.

### Dates and paused attention (Issue 11 closed)

- Planned Start and Due are user-managed; Actual Start and Actual End are lifecycle-managed.
- Planned dates support date-only, symbolic TOD slots and exact times, with visible precision. Date-only Due becomes overdue on the next calendar day in the user's configured timezone.
- Planned Start calendar date must be ≤ Due calendar date when both present. Scheduling can optionally shift the other planned date by the same number of calendar days; synchronization defaults off.
- Overdue derives from Due, not Planned Start. Planned dates and pause expiry never automatically change lifecycle.
- Paused Until may be timed or indefinite; expired pause remains recorded until user action. Resume clears pause with transition atomically. Terminal closure retains pause for context but disables its operational effect; reopening clears pause.
- Pauses may suppress execution attention but not planning/scheduling visibility of overdue work. Reminder coupling and subtle cross-query behavior are deferred.

### Query-first information architecture (Issue 12 closed, revised in Issue 14)

- Current **six** Tasks views: Focus, Resolve, Plan, All Active, **Closed**, Trash. Issue 14 merged Recently Closed and Archive into Closed; no separate archive state/date/actions.
- Closed and Trash retrieve **all** eligible history by default, with independent remembered historical time buckets. All Active is nonterminal by default, with optional terminal expansion.
- Delete/Restore change deletion metadata only; Closed membership depends on terminal lifecycle. See `docs/product_spec.md` §§7 and 11 for authoritative current details.

## Issue 12 — Home decisions (agreed in discussion)

- **Home** is a contextual workspace with **HERE + NOW**, **HERE**, and **NOW** sections; not an eighth preset query.
- **HERE + NOW** matches BOTH location and NOW preferences; **HERE** matches location independently; **NOW** matches DOW/TOD independently. Tasks may appear in multiple sections.
- NOW eligibility: DOW+TOD both match; TOD matches with DOW absent; or DOW matches on its own. DOW mismatch excludes; no DOW/TOD preference excludes. NOW sorts by **DOW+TOD → TOD-only → DOW-only → Title**.
- HERE sorts **Distance → Title**. HERE + NOW sorts **Distance → NOW match class → Title**. No arbitrary top-3–5 cap or inferred relevance scores.
- Initial Home scope is WIP (In Progress, Waiting, Blocked, On Hold), not executable-only. User-selectable lifecycle, Category and date filters; explicit **Remember / Reset**.
- HERE and HERE + NOW share selectable current/saved/manual location and configurable radius, with coarse proximity resolution. Missing location shows an empty/prompted HERE and HERE + NOW; NOW stays available.
- All Home sections remain visible with counts, including empty ones. When opening the workspace or changing filters, expand **only the first nonempty section**, in fixed section order; others collapsed. The same accordion defaults/count/empty-group visibility apply to query grouping. Sort-change expansion behavior remains deferred.
- While Home is visible, refresh manually; returning to Home refreshes automatically. Show location and last-updated time separately, without movement distance.
- Retain **header Global Search**, **global Task Create**, and **temporary title-only Quick Search** within a query. **Events are removed**.

## Issue 12 — Navigation and Task Detail (agreed in discussion)

- **Remove Calendar and Nearby as separate workspaces.** Retain date/location on Tasks and Home. Search map presentation is a **possible future enhancement**, not a current feature.
- **Responsive navigation:** Gmail-inspired collapsible desktop sidebar and mobile drawer using the same Home/Tasks hierarchy; global header Search and independent Task Create. Settings separate.
- **Workspace session:** Open Task → Back/Close restores the full origin query, filters, sorting, grouping, scroll and accordion expansion. Explicit application navigation always re-enters a workspace from Remember-saved settings or defaults; do not restore temporary context across workspace visits or clients.
- **Direct-linked Task:** normal browser history and app navigation, no fabricated prior workspace.
- **Task Detail:** mobile full-page; desktop side panel by default, expandable to full page with optional Collapse. Back/Close from either display returns directly to the originating workspace. Workspace is context, not a concurrent editing surface.
- **Unsaved changes:** Stay/Discard warning before navigation or switching tasks; no automatic saving.
- **Working UX hypothesis (validate with use):** users mostly work from workspace through the side panel; desktop full-page is less frequent.
- **Query group accordions:** visible counts and empty groups, only first nonempty expands on entry or filter changes, manual expansion allowed; Back from Task Detail restores exact existing expansion. Sorting-change rule deferred.
- No next/previous Task navigation or Task-to-Task links in current scope without a demonstrated need.

## Issue 12 — Final decisions and closure (2026-10-13)

**Status:** Product-level IA decisions complete and recorded in `docs/product_spec.md` §§7–10. This does not imply implementation, design verification, or approval of backend mechanics.

- **At Issue 12 closure, all seven names were retained; Issue 14 later revised this to six.** Focus excludes future/indefinite pauses but ignores expired pauses; Planned Start never filters Focus. Resolve still includes interrupted tasks and any recorded pause.
- **At Issue 12 closure:** active views loaded all eligible Tasks, historical views had 15-day defaults. **Issue 14 supersedes historical restrictions:** Closed and Trash now show all eligible Tasks.
- **Shared Group By/Filter/Sort** interaction across applicable query and Global Search dimensions; one global sort via table column headers, category/state/time grouping where applicable. Sorting preserves accordion expansion. Grouping by Paused Until orders **Expired → upcoming → Indefinite → Unspecified**; other missing dates go last. Near/Medium/Far thresholds remain per-query and explicitly Remember-saved.
- **Task rows:** shared structure, omit the Group By column; title opens Task Detail. Visible hybrid context/state-dependent primary action (Edit fallback); overflow contains up to two other valid lifecycle actions, then standard actions, with no duplication.
- **Resolve Extend** supports later pause or Indefinite. Standard overflow includes Add Comment and Attach File, both as unsaved-work-protected popovers targeting Notes & Comments.
- **Edits:** keep the edited row stationary and highlighted until next edit/refresh. If it becomes ineligible, animate its removal and update counts. Otherwise counts/ordering/group membership wait for explicit Refresh; show distinct-edited-task counter with **Refresh view** link.
- **Global Search:** text-only; at least three characters; user explicitly clicks Search. Cumulative depth Title (default) → Description → All Content. Active default scope with expansion for terminal/archived; filter-icon popover with Apply/Clear/Cancel. Tabular columns Title, Category, Status, Planned Start, Due, Match; sortable headers; optional Category grouping; 10 results per batch with explicit Load More; shared responsive row style.
- **Map Search is future-only**. Home HERE still supports proximity. 
- **Issue 14 supersession:** Closed bulk Move to Trash older than N; Trash bulk Purge older than N; individual Delete, Restore and Permanent Delete. All deletion actions require confirmation.

**Next work after Issue 15:** Detailed domain/architecture/security reconciliation, not further Issue 12 product-level IA debate.

## Issues 13–14 — Decisions recorded (2026-10-13)

- **TOD:** fixed nonconfigurable half-open periods Late Night 00–05, Morning 05–08, Mid Morning 08–12, Afternoon 12–16, Evening 16–20, Night 20–00, interpreted in configured timezone. Reminders and recurrence deferred.
- **Scope:** WYSIWYG descriptions/comments; files and external links in Notes & Comments and Todo Thread **headers**, never System. Terminal/deleted Tasks and closed Todo Threads remain read-only.
- **Attachment limits:** 5 MB/file, 25 MB combined uploaded files and 10 items across Task, one-file uploads; renaming without confirmation, replacement/removal with confirmation. Task-title flat ZIP Download All includes files, description and external links, not comments.
- **Lifecycle:** Close automatically enters Closed, no archive metadata. Terminal closure clears Paused Until, retains Planned/Due/Actual Start; Reopen goes to In Progress, clears latest Actual End, keeps Todo Thread states; history preserves prior outcomes. Done with open Todo Threads always warns with count/names but does not block.
- **Trash:** soft Delete/Restore affect deletion metadata only, each requires confirmation. Individual/bulk permanent deletion only in Trash, irreversible confirmation, storage files before DB. Bulk partial success permitted, failed items retried manually.
- **Bulk views:** Closed cleanup and Trash purge remain in the relevant view, remember independent day/month thresholds, ignore view filters, show count and confirmation; no automatic cleanup. Closed/Trash historical buckets independently Remember-saved and all records visible by default.
- **Deferred:** recurrence mechanics, notifications/reminders, related Tasks, optional Eisenhower and Map Search. **Removed:** Events, Calendar/Nearby workspaces, collaboration, independent subtasks, Priority and View Builder.
- **Next:** Issue 15 Task Detail hierarchy is now closed; domain/storage/security reconciliation follows. No implementation or deployment claimed.

## Issue 15 — Task Detail UX closed (2026-10-13)

- **Hierarchy:** Title → clickable Status/Dates → clickable Classification/Preferences → state-dependent Task Action Bar → two-line Description preview (expand to formatted display) → Notes & Comments → Todos → + Add Todo → low-prominence Activity Log.
- **Actions:** Ready (Draft → Planned), Start, Pause, Resume and Reopen are state-dependent primaries; Close is secondary for nonterminal tasks; More contains only secondary Task-level actions and duplicates neither badges nor primary controls. Ready is a user-facing action, not a new status; assigning planned dates alone does not change lifecycle.
- **Pause:** Managed together with Waiting, Blocked and On Hold; interrupted Tasks retain visible Resume, and current status/Paused Until are editable via contextual badges.
- **Editing:** Contextual overlays for most substantive edits including WYSIWYG description; title inline; simple preferences may toggle directly. Existing Save/Cancel and unsaved-change protection apply.
- **Work sections:** Notes & Comments expanded by default; Todos displayed in creation order with independently collapsed contents, with Add Todo title overlay; files/links in thread headers via + Attach overlay; Activity Log collapsed and read-only.
- **Supersession:** Comments are **plain text**, compact inline entries with no hard length limit, explicitly superseding Issue 14's WYSIWYG comment rule. WYSIWYG Task descriptions remain. User-facing Todo means Todo Thread, and Activity Log means immutable System Changes.
- **Responsive:** Existing desktop side panel/full-page expansion and mobile full-page rules retained; same hierarchy/actions with wrapping badges and prominent controls, **subject to usage verification**.
- **Status:** Product-level UX decisions recorded, not implemented or validated. See `docs/product_spec.md` §12.

## Issue 16 — Domain business rules in progress (2026-10-13)

- **Interruption semantics:** Waiting = external time dependency, Blocked = obstacle/conflict/unavailability, On Hold = user choice not to proceed. Direct transitions permitted; Paused Until optional and independently editable.
- **Lifecycle explanations:** Natural Draft → Planned → In Progress → Done actions and Resume require no comment; interruptions, switching interruption reasons, non-Done closure, direct Draft/Planned → Done and all Reopen actions require explanations in the immutable transition Activity Log entry. Implicit content-driven promotions do not require an additional explanation.
- **Scheduling:** Relative-date shortcuts and conventional picker for Planned Start, Due, Paused Until; date/pause changes log old/new values and have optional comments. Planned dates never imply Planned lifecycle.
- **Classification:** Category required with Uncategorized default; Location optionally Unspecified. Important/Urgent tri-state Yes/No/Unset, either Unset implies Eisenhower Unclassified. DOW/TOD support multiple values, OR within dimension, empty means no preference. Home/query matching needs reconciliation.
- **Audit scope:** Task title/description, Category/Location/preferences and ordinary comment activity are not logged. Todo rename/state/delete, attachment changes, Task Delete/Restore and lifecycle/schedule changes are logged. Todo creation needs no log entry. Permanent deletion removes Task/history.
- **Status superseded by Issue 16 closure below:** Earlier agreed rules recorded in `docs/product_spec.md` §13; see the closure section for the finalized NOW matching, five-class grouping and product-level closure. No implementation claimed.

## Issue 16 — Product/domain rules closed (2026-10-13)

- **Autonomy:** Single-user knowledge/activity repository, not compliance auditing; logical constraints with minimal friction. Required lifecycle deviation explanations retained as useful context.
- **Dates:** Actual Start and End remain system-managed and not directly editable; Actual Start records first entry into In Progress including later Reopen, Actual End records latest closure and clears on Reopen. Planned Start/Due remain intentions and do not gate lifecycle. Paused Until may be later than Due with nonblocking warning.
- **Todos:** Parent Task closes only at user's choice; Todo completion does not auto-close parent. Closing a Todo or adding comments/attachments still promotes Draft/Planned to In Progress. Todo creation never promotes; existing read-only and nonempty-Todo deletion restrictions retained.
- **NOW matching supersession:** DOW and TOD allow multiple values, OR within each dimension, **AND across dimensions** when both configured; either dimension alone can match; neither excludes. Remove the prior DOW-only fallback for TOD mismatches. Preserve NOW match-class sort.
- **Important/Urgent:** Combined five-class Group By and multi-select Filter in **all six Task views**, in fixed order **Do First, Schedule, Delegate, Eliminate, Unclassified**. Unclassified means either tri-state value is Unset. Same shared grouping/filter/Remember semantics; no change to default view grouping. Delegate/Eliminate are labels only.
- **Architecture direction:** Configuration-driven shared query-view implementation is favored for assessment, without collapsing view-specific domain rules or claiming code exists.
- **Status:** Issue 16 **closed at business-rule specification level**. Remaining transition-contract details, storage/security/concurrency, time/DST, query implementation and UX verification belong to subsequent architecture/design work. See `docs/product_spec.md` §§8.3, 13.

## Issue 17 — Logical data model closed (2026-10-13)

- Task primary document; typed Discussion, Todo and Activity Log Threads conceptually embedded in Task, with Thread-owned attachment metadata; file bytes in object storage.
- Separate shared Entries for plain-text comments and immutable Activity Log events (optional structured system payload), referencing stable Task and Thread identities.
- Personal Task preferences stored on Task; independent user-owned Categories and saved Locations referenced by ID; Category global ordering and protected Uncategorized retained. Locations have optional coordinates and centrally propagate changes to referencing Tasks.
- User Profile/Settings and one Remember-saved View Configuration document per user/workspace (six Task queries, Home, Global Search); ephemeral state not persisted as view configuration.
- Composition for Task-owned Threads/Entries/attachments and permanent deletion; references for Category/Location; single-user ownership boundary.
- Preferred progressive reads: Task document for core detail/Thread headers, Entry content and file bytes on demand. Global Search All Content requires Entry search. Physical DocumentsDB behavior **unverified**.
- Client-store/query discussions separated for a later architecture issue, with application-scoped normalized cache, shared selectors/mutators and demand-driven loading as agreed direction.
- **Next:** Issue 18 vendor-neutral physical feasibility, beginning with MongoDB Atlas Free. See `docs/product_spec.md` §15.

## Issue 18 — Backend feasibility and cost decision (2026-10-13)

**Approved owner decision:** Mark **Appwrite Cloud with DocumentsDB as not feasible for the Taskify PoC/beta under the current ongoing-cost constraints**, rather than upgrading the existing project. DocumentsDB was unavailable for provisioning on the current free plan; selecting a paid offering would introduce recurring costs. This is a *project cost/scope decision*, not a claim that Appwrite's document model is technically incapable of meeting Taskify's requirements. Do not interpret it as deleting the existing Appwrite PoC project or forbidding future reassessment if costs change.

**Next evaluation candidate:** **MongoDB Atlas Free** for PoC and beta. This is approval to evaluate, **not** a final backend or production architecture selection. Validate the free-tier limits, nested Thread operations, multi-value DOW/TOD queries, Global Search across separate Entries, atomic mutations, authorization, backup/restore and deployment requirements. Atlas alone does not supply client-facing authentication or a secure Taskify API; trusted backend and operating costs remain open.

**Repository organization approved for feasibility work:** `poc/` rather than `experiments/`, with `poc/appwrite/` originally proposed; adapt PoC implementation to `poc/mongodb-atlas/` if used. Put reproducible findings in `docs/feasibility/` and approved design conclusions in a future `docs/architecture.md`. No feasibility code or tests have been created, run or committed yet. Repository/PoC implementation and provisioning remain controlled, explicit actions.

**Attachment release-scope discussion:** Link/metadata-only initial support and deferral of binary file storage have been discussed as a *proposal*, not yet recorded as an approved supersession of the file-attachment product requirements. Do not silently remove or rewrite the existing attachment specification.

## Deferred / unresolved

- Recurrence, reminders/notifications and other deferred enhancements.
- Task Detail accessibility, responsive breakpoints and usability verification; rich-text/attachment technical details (high-level Issue 15 UX closed).
- Implementation-level domain transition contracts, fixed TOD timezone/DST details, query implementation and selected-backend data/security/concurrency, file deletion consistency, migrations and operational design.

## Planned specification migration

1. Use this file as the canonical **project status** entry point, `docs/product_spec.md` as the working simplified product baseline, and `docs/product_spec_legacy.md` only as a historical reference.
2. Issues 12–17 product/domain/logical data decisions are documented with explicit supersessions; Issue 18 evaluates MongoDB Atlas Free following the Appwrite Cloud cost decision.
3. Approve replacement product rules and document supersessions explicitly; then design coherent data, security and architecture contracts.
4. Reconcile and approve the working `docs/product_spec.md` alongside future data, architecture and security specifications, rather than silently reviving obsolete documents or treating historical DEC entries as erased.
5. Require separate approval for commits, merges, implementation, data migration and deployment.

**Repository cleanup scope:** Prepared active tree contains `README.md`, `docs/project_status.md`, `docs/product_spec.md`, and the protected read-only `docs/product_spec_legacy.md`. Source removals are not cloud-resource deletions.
