# Taskify — Project Status

> **Controlling revision (2026-10-19):** Owner-agreed major redesign is documented in **docs/product_spec.md §17**. Its three-state lifecycle, independent pause, unified All Tasks/Saved Views and Home Dashboard supersede contradictory earlier Issue 11–18 sections below. Earlier sections remain historical context. No revised code, deployment or beta/production migration is claimed; old environments will be abandoned. Implementation-design details deferred to vertical slices are enumerated in §17.10; the approved Reference and Global Search amendment is §17.8. **§18 records the Firebase Spark PoC/beta architectural baseline and corrected Task/Discussion/Todo/Activity Log ownership.** The legacy specification remains immutable.

## 2026-11-05 — Slice5 owner-accepted and closed; closure staged

- Owner verified the primary workflow on mobile/desktop, reviewed the closure
  summary and requested closing this slice. [Closure record](slices/05-workspace-provisioning-closure.md)
  closes Slice5; the corrected request does not close Slice6.
- App0.2.0, revision2/serverRelease2 and clean02458ff remain the dev deployment;
  no new tests, release, accounts or data changes occur in this documentation step.
- Next is Slice5A readiness review. Slice4 remains held; Slice6 remains accepted
  detailing only. Live promotion and later implementation need explicit instruction.
- Closure changes are staged for review. Existingad576c1/20c1d96 documentation
  commits are already local and await push; no new commit/push is created here.

## 2026-11-05 — Slice5 primary workflow owner-verified

- Owner reports sign-in → Workspace ready → refresh → Logout passed on mobile
  and desktop, after deleting previous Firebase Auth identities in the console.
- [Acceptance record](slices/05-workspace-provisioning-acceptance.md) distinguishes
  owner-reported checks from automated evidence. Provider/account types and exact
  browser build were not independently captured; Auth-only removal does not prove
  Firestore cleanup or the future Slice5A deletion flow.
- Primary hosted workflow verified; Slice5 stays open for closure review. Slice4
  stays held; Slice5A remains next after closure. No new test run, deletion,
  deployment or promotion is performed by this documentation update.

## 2026-11-05 — Slice5 dev publication recorded

- Published4 November from clean pushed02458ff: app0.2.0, build
  02458ffb68d1-6a446b9f4ba6aaed, Hosting40e35b075db747cb; dev expiry4 December20:44 IST.
- Owner selected the shared minimum0.2.0. Initialization Rules, contract revision2/
  serverRelease2 and exact dev artifact were published in coordinated order.
- [Deployment report/evidence](slices/05-workspace-provisioning-preview.md) records
  hosted390/1280px checks, exact hashes, enabled sign-in controls and gate recovery.
  Real-provider/first-use acceptance remains pending; Slice5 is open, Slice4 held.
- qc/uat/live Hosting, billing, database protection, Auth configuration and key
  metadata unchanged. Test emulators stopped; local5173 preserved. Deployment
  documentation is recorded in a subsequent documentation commit, not another publication.

## 2026-11-04 — Slice5 workspace runtime implemented locally

- [Runtime checkpoint](slices/05-workspace-provisioning-implementation.md): guarded
 24-stage transaction adapter, concurrent/uncertain-result reconciliation, shared
 runtime, session-bound controller, cleanup/fences and Loading/recovery/ready UI.
- Explicit timezone/profile recovery preserves first committed values. Completed
 accounts do not reseed removed ordinary defaults.22 approved icon keys resolve to
 pinned self-hosted Rounded assets; two legacy keys retain documented aliases.
- Local verification and limits are recorded in the checkpoint's evidence files.
 Slice5 stays open; Slice4 stays held. No cloud, staging, commit or push.
- Actual version/revision/release bounds and coordinated Rules/contract/client
 publication remain release gates. Current cloud policy blocks the expanded Auth
 build, as intended; this is not ready for isolated Hosting deployment.

## 2026-11-04 — Slice5 initialization Rules finalized for source commit

- [Rules checkpoint](slices/05-workspace-provisioning-rules.md): generated production
  initialization policy and explicit deploy config,597 shared timezone IDs/aliases,
  optional byte-bounded profile fields, environment/schema checks and read/write
  fencing. Existing deployed policy/config, contract and client capability are unchanged.
- 72 focused unit/51 integration tests pass, including all timezone IDs and conflicting
  initial values. Types,41-file boundaries, full lint/format and generation drift pass.
  Compile/preparation failures are recorded; no cloud production acceptance claimed.
- Owner requested commit before continuing: commit includes preceding uncommitted
  Slice5 codecs, probe, tests and evidence. Adapter/controller/UI remain pending.
  No push or deployment; Slice4 stays held and preview5173 is preserved.

## 2026-11-04 — Slice5 record codecs and stage-integrity probe

- [Second checkpoint](slices/05-workspace-provisioning-stages.md): strict persisted
  record codecs and confirmed, UID-path-checked SDK snapshot translation, preserving
  nanoseconds.66 focused unit cases pass; actual stored family snapshots decode.
- New reproducible local command test:provisioning-stage passes18 integration tests.
  Immutable predecessor receipts enforce24 bounded stages/finalization with paired
  name guards and existence-based fence checks. Initial expression-limit candidates
  failed; optimized lookup plus single Locations passed without dropping checks.
- Candidate uses fixture UTC/empty profile and atomic batches, not production
  policy/transaction retry logic. All types,40-file boundaries and targeted style
  checks passed. No UI/controller/shared-runtime writes or cloud configuration.
- Next: production policy, admitted adapter/controller and recovery presentation.
  Unstaged; no commit/push/deploy. Slice4 remains held; local5173 preserved.

## 2026-11-04 — Slice5 implementation begun: pure query and seed checkpoint

- [First checkpoint](slices/05-workspace-provisioning-domain.md): strict query
  decoding,34 new unit cases, exact12/10/7 fresh seed plans, numeric ranks,
  client name validation and explicit timezone recovery validation implemented.
- Final41 focused tests (34 domain+7 readiness), types,38-file boundaries and
  targeted lint/format passed. Type/test-table issues corrected before final pass.
- No persistence/Rules/runtime/UI wiring yet; receipts/finalization/fence integrity
  remain unverified. Earlier81/7/4 readiness is historical, not feature acceptance.
- Incoming known main504de97 Slice7 docs reviewed, not merged. No cloud operations,
  staging, commit, push or deployment. Slice4 remains held; preview preserved.

## 2026-11-04 — Readiness evidence audited; pending gaps reconciled

- Linked report, machine evidence and execution log from the implementation plan,
  architecture and Slice5. All recorded source/runner hashes match. Corrected
  execution-log newline/checksum mismatch; no results changed or tests rerun.
- Replaced stale decision-register entries: path/query/uniqueness/stage/fence
  policies are agreed. Remaining work is concrete codec bounds/precision, Rules
  stage/finalization proof, runtime/fence integration and Slice5-specific validation.
- Ready to begin implementation, not provisioning acceptance/cloud publication.
  Actual release identifiers/app bounds and rollout remain to select before release.
  Slice4 remains held. Documentation/evidence only; unstaged, no commit or push.

## 2026-11-04 — Local readiness baseline verified

- Owner authorized applicable local emulator/headless checks. [Readiness report](slices/05-workspace-provisioning-readiness.md)
  records81 focused unit (including7 new family-map cases),7 existing emulator
  integration and4 compatibility browser passes; types/targeted lint/format and
  ordinary/compatibility builds passed. Runner prerequisite failures are recorded.
- Important rollout finding: new contract families alone do not retire old clients;
  appropriate minimum app version is needed. Synthetic0.2.0 is not a release choice.
- Production Slice5 code is still unimplemented: receipts/transactions/fence Rules
  and concurrency remain unverified. This is baseline readiness, not slice closure.
  No real provider, full regression or cloud action; Slice4 remains open/on hold.
- Local5173 preview preserved; owned emulators stopped. Changes unstaged; no commit,
  push or deployment.

## 2026-11-04 — Shared deletion fence agreed

- Owner directed proceeding with accountDeletion/{uid}: existence fences setup
  and workspace writes; failed control reads block. Initial schema/request fields
  and browser-create/read versus trusted-progress/retirement boundaries agreed.
- Nine families now include accountDeletion and nameReservation. Provisioning
  needs readable fence capability; request writing belongs to implemented Slice5A.
  Finalizer fields/proof/token-safety remain pending; no deletion executed.
- Next: client/contract schema capability and rollout plan. Documentation only;
  no code, tests, staging, commit, push, deployment or cloud change.

## 2026-11-04 — Initialization stage/recovery approach accepted

- Owner explicitly accepted admission, atomic base setup, bounded Category and
  Location seed/reservation stages, View seeding, verified finalization and resume.
  Concurrent clients retain first committed profile/settings; unknown results are
  reconciled before retry and submitted writes are never described as rolled back.
- Two named records per stage is a candidate maximum pending Rules-budget checks.
  Exact stage IDs, receipt/finalization enforcement and fence schema remain to
  detail; no acceptance evidence or stronger batch-size claim is implied.
- Next owner contract: Slice5A deletion fence shared with provisioning. Documentation
  only; no code, tests, staging, commit, push or cloud changes; holds continue.

## 2026-11-04 — Name-reservation contract accepted

- Owner directed proceeding with per-UID/per-kind Category/Location reservations,
  atomic create/rename and retained claims while archived. Add nameReservation
  schema 1: eight families total, with compatibility and deletion inventory updated
  during implementation. No Unicode/server boundary is newly relaxed.
- Next: bounded initialization stages, receipt/finalization integrity and safe
  reconciliation. Exact stage sizes remain conditional on Rules-budget evidence.
- Updated Slice5, architecture and Slice5A inventory. Documentation only; no code,
  tests, staging, commit, push or cloud changes. Existing holds remain in effect.

## 2026-11-04 — Persistence paths agreed; name-reservation proposal

- Owner explicitly accepted the UID-owned path structure; stable IDs survive
  rename, with no separate root/order document introduced.
- Recovered existing owner acceptance of client-only NFC/grapheme validation for
  PoC/beta. This supersedes the original failed-probe policy gate; literal-key
  atomic uniqueness and ownership still require Rules enforcement.
- Proposed a separate nameReservation family for Category/Location keys, hashed
  paths and atomic entity/guard create/rename with archive retention. Family,
  fields and lifecycle remain for agreement; no extra family silently approved.
- No code/test execution, staging, commit, push or cloud changes. Slice4 and
  broader testing remain held.

## 2026-11-04 — Query validation policy accepted

- Owner directed continuing after the v1 validation proposal: allowlists, unique
  selections, structural ID validation, strict date values, same-kind Between
  bounds, AND intersections and structural-contradiction rejection are accepted.
- Due filters are calendar-day based in v1; instant operands on Due are deferred.
  Mixed absolute/relative conditions can become empty without invalidating a View.
- Next is concrete persistence/uniqueness design; exhaustive codec tokens and
  resource bounds remain engineering detailing. Documentation only; all prior
  implementation/testing holds remain; no staging, commit or cloud action.

## 2026-11-04 — Query JSON representation approved

- Owner explicitly approved camelCase query tokens, selection/date operators,
  tagged Location/date operands, AND date-condition arrays and the Completed
  example. Name/order/Home inclusion remain outside the query payload.
- Query design decisions are recorded in Slice5. Exhaustive field/enumeration
  allowlists, bounds and mixed date-operand/precision validation still need a
  complete executable contract. Schema paths/uniqueness/stages/fence are next.
- Documentation only; implementation and tests have not started. Slice4 and
  broader testing remain held; no stage, commit, push or cloud changes.

## 2026-11-04 — Query filter/date-sort semantics agreed

- Owner accepted selection/empty-filter semantics, explicit Unspecified Location,
  five date operators, half-open ranges and relative calendar-day evaluation.
- One captured now/timezone anchors each evaluation. Date-only Due uses the
  selected calendar day, not next-midnight expiry; Task precision encoding remains
  for the concrete storage contract. Missing sort values are last; date groups
  remain chronological independently of task sort direction.
- Exact JSON operands are next for review. Documentation only; no code, tests,
  staging, commit, push or cloud changes; broader-test and Slice4 holds continue.

## 2026-11-04 — Slice5 documentation reconciliation and gap review

- Consolidated accepted ownership/versioning, core fields, inline numeric ranks,
  query envelope, all-field group/filter coexistence and eight date buckets.
- [Decision register](slices/05-workspace-provisioning.md#remaining-gaps-and-decision-register--4-november-2026)
  separates remaining owner-visible semantics from engineering/verification work.
  Query operands/date-only Due interpretation, uniqueness guards, stage/receipt
  integrity, deletion fence and compatible release preparation remain open.
- Implementation is not started. Slice4 remains held; required broader tests are
  still held. Documentation/whitespace checks only; no code, tests, stage, commit,
  push, deployment or cloud changes.

## 2026-11-04 — Group/filter coexistence and date windows agreed

- Owner allows filtering every supported grouped field; grouping changes do not
  clear valid filters. This supersedes the historical dimension-exclusion rule,
  resolving Deleted Date grouping plus Is Set without a special exception.
- Yesterday/Tomorrow groups are removed; previous/next 1–7-day windows include
  them. Other buckets are past 8–30 days/Older, Today, next 8–30 days/Later and
  Unspecified last, evaluated in workspace timezone.
- Updated active product specification and Slice5 detailing; filter operators and
  operand serialization remain proposals. Documentation only; no tests or code.

## 2026-11-04 — Slice5 document fields and numeric ordering agreed

- Owner approved the proposed document fields and selected per-record integer
  `order` with initial steps of 1000 for Categories, Locations and Views. This
  replaces separate ordering documents/family: seven record families remain.
- Intermediate integer ranks support later insertions; stable IDs break ties.
  Protected/synthetic last positions and movable All Tasks remain intact. Exact
  atomic renumbering/Rules mechanics belong to later ordering implementation.
- Updated Slice5, architecture and Slice5A inventory references. Query codec,
  stage layout and deletion fence are still pending. Documentation only; no
  implementation, tests, staging, commit, push or cloud changes.

## 2026-11-04 — Slice5 ownership and versioning agreed

- Owner accepted Step 1: UID-path ownership, initially eight independently versioned record
  families (subsequently seven after inline ordering), schema/edit/query/template version separation, immutable stage receipts,
  compatibility declarations and explicit safe upgrades. See the
  [agreed contract](slices/05-workspace-provisioning.md#agreed-ownership-and-versioning--4-november-2026).
- Exact document fields/validation are next for agreement. Stage layout, query
  codec, deletion fence and Rules feasibility remain unresolved before dependent
  implementation. Slice4 remains open/on hold and the testing hold continues.
- Documentation only; no code, tests, staging, commit, push or cloud changes.

## 2026-11-04 — Slice9 final review and staging

- Owner requested final checking and staging preparation. Seven documentation files are staged for review, including [Slice9 final checkpoint](slices/09-onboarding-tasks-manual.md#final-review-and-staging-checkpoint--4-november-2026).
- Confirmed accepted design consistency and corrected acceptance wording: ordinary Task access is blocked between provisioning stages; ordinary ownership actions apply after readiness. Documentation links/anchors and whitespace checked.
- No application tests/builds, implementation, commit, push or cloud action. Exact engineering proof remains pending; Slice4 hold is unchanged. Earlier entries below are historical checkpoints superseded by the accepted design and this staging record.

## 2026-11-04 — Slice9 revised G1–G8 accepted; design closure

- Owner accepted every revised G1–G8 recommendation. [Slice9 design closure](slices/09-onboarding-tasks-manual.md#design-closure--4-november-2026) records blocking provisioning, verified ready transition, reserved seed identities, independent completion retention, scoped initializer admission, public manual delivery, safe new-target links and pinned-bundle recovery/rollback.
- All identified design decisions are resolved. Exact persistence/Rules/cleanup/compatibility/manual-build contracts and passing validation remain implementation work; proposed starter prose must match the released feature set.
- Documentation only; no implementation/tests/builds, staging, commit, push or cloud actions. Slice4 remains open/on hold; overall platform feasibility remains INCONCLUSIVE.

## 2026-11-04 — Slice9 N1–N8 accepted; gaps re-examined

- Owner accepted N1–N8 with blocking onboarding/provisioning progress until complete. Manual-route restrictions apply only to relative links; permitted absolute links remain allowed. All permitted links request a new target tab/window.
- [Revised G1–G8](slices/09-onboarding-tasks-manual.md#gap-review--4-november-2026) preserve no-backfill, atomic seed completion and independent markers. Require final readiness checks and narrowly scoped initializer admission; unsupported/pinned-bundle recovery stays blocking. Revised gaps remain recommendations for review.
- Updated controlling detailing/specification and dependency amendments. Documentation only; no code/tests, staging, commit, push or cloud actions. Slice4 hold remains unchanged.

## 2026-11-04 — Slice9 gap review prepared

- [Slice9 gap review](slices/09-onboarding-tasks-manual.md#gap-review--4-november-2026) adds G1–G8 recommendations: precise enrollment boundary, reserved seed identities, independent completion retention, honest template-integrity boundary, manual routing, cross-release links, bounded recovery and pinned-bundle rollback.
- N1–N8 and G1–G8 remain proposals; no owner acceptance inferred from continuation. Current Hosting catch-all is an implementation integration gap, not an existing manual route.
- Documentation only; no tests, executable changes, staging, commit, push or cloud action. Slice4 hold remains unchanged.

## 2026-11-04 — Slice9 detailing proposal prepared

- [Three onboarding Tasks and initial manual](slices/09-onboarding-tasks-manual.md) is prepared for owner review against clean fetched main cf77bc4. Established scope is unchanged; N1–N8 concrete recommendations remain proposals.
- Covers new-workspace eligibility, pinned bundles, atomic per-Task completion, no overwrite/backfill/resurrection, starter copy and required acceptance evidence. Same-origin public manual routes and a narrow relative-Markdown-link exception require owner agreement.
- Documentation only; no implementation/tests, staging, commit, push or cloud actions. Slice4 hold remains unchanged.

## 2026-11-04 — Slice8A all gap resolutions agreed

- Owner explicitly agreed all remaining [A1–A10 recommendations](slices/08A-advanced-create.md#accepted-gap-resolutions--a1a10) after A3. All design gaps are resolved; engineering proof remains required.
- More Details may open despite invalid/empty Title (not during pending/unknown creation), preserves input/errors, focuses Reference and announces expansion. One-way mode and dismissal guards remain; Create depends on validity, not optional-field changes.
- Complete root/detail/receipt correlation, changed-intent handling only after outcome resolution, minimal-ID reload recovery and actual Rules/dependency/test authority are agreed. No draft restoration, partial creation or held-test bypass is implied.
- Documentation review only: no code/tests, staging, commit, push or cloud actions. Implementation acceptance remains pending.

## 2026-11-04 — Slice8A A3 creation receipt agreed

- Owner agreed [A3](slices/08A-advanced-create.md#a3-accepted--atomic-creation-completion-receipt): Task root, required description and immutable minimal creation receipt commit atomically; receipt proves original completion despite later edits/lost acknowledgement.
- Reuse operation receipts with type create; no copied Markdown, credentials, Activity Event or history UI. Rules atomicity, repeated-request reconciliation and trusted cleanup require implementation proof.
- Remaining A1–A2/A4–A10 recommendations are documented for review, not inferred approved. Documentation only; no code/tests, staging, commit, push or cloud actions.

## 2026-11-04 — Slice8A Advanced Create detailing accepted and documented

- Owner proceeded after amending the action to More Details and prohibiting Less/return to compact form. [Slice8A detailing](slices/08A-advanced-create.md) records one-way same-draft mobile full-screen/desktop large-modal expansion with retained fields/state.
- No additional required fields without defaults: Title remains the only required user input; Reference/description empty, Important/Urgent Unset, Category/Location defaults unchanged. All preference/metadata values commit together in one Create, not separately.
- Task2 root and any nonempty description1 child commit atomically with complete recovery correlation; no live Markdown preview, scheduling/lifecycle controls, partial Task patching or creation Activity Event. Update Rules, trusted cleanup and applicable validation evidence during implementation.
- Documentation only; no code, tests, staging, commit, push or cloud actions. Existing Slice4 hold remains unchanged; overall platform feasibility remains INCONCLUSIVE.

## 2026-11-04 — Slice8 D12 agreed; all design gaps resolved

- Owner proceeded with [D12](slices/08-task-detail-metadata.md#d12-accepted--dependencies-and-validation-authority): actual dependency contracts, focused/adversarial/browser validation, schema/rollback/deletion evidence, unchanged Slice4 hold and separate cloud authority.
- All D1–D12 design decisions are now resolved. Controlling baseline uses plain-text GFM, approved safe rendering and source-byte bound, coherent detail/root/receipt writes, lazy compatible schemas, valid-change Save, Refresh/Stay conflicts, per-Task serialization and account-safe recovery/navigation/read-only access.
- Exact engineering contracts, pinned dependency checks and passing implementation evidence remain required; no feature acceptance or test-hold release is claimed. Seven docs restaged after consistency/whitespace/link review. No code, tests/builds, commit, push or cloud actions.

## 2026-11-04 — Slice8 D11 read-only boundaries approved

- Owner approved [D11](slices/08-task-detail-metadata.md#d11-accepted--closeddeleted-read-only-boundaries): authorized Closed/deleted Task Detail is read-only with clear indicators, All Tasks scope unchanged and no early Reopen/Restore/Permanent Delete.
- Remote editability loss blocks Save and Rules enforce it at commit. Metadata cannot mutate lifecycle/pause/outcome/system dates; missing/access-denied records do not disclose cached content or create replacements. Account deletion fences still apply.
- Documentation restaged; no executable changes, tests, commit, push or cloud actions. D12 dependency/validation/test-authority is the final gap.

## 2026-11-04 — Slice8 D10 navigation restoration approved

- Owner approved [D10](slices/08-task-detail-metadata.md#d10-accepted--originating-list-restoration): capture real View/groups/anchor; restore still-valid context while confirmed edits immediately update membership/position. Use nearest surviving scroll position, not stale rows or forced Task jumps.
- Deleted origin Views show guidance and an All Tasks choice; direct links use actual history. Panel/full-page/resize preserve identity/input/origin; Search restoration waits for its feature. Dirty/pending guards remain in force.
- Documentation restaged; no code/tests, commit, push or cloud actions. D11 read-only Closed/deleted boundaries are next.

## 2026-11-04 — Slice8 D9 input/account isolation accepted

- Owner accepted [D9](slices/08-task-detail-metadata.md#d9-accepted--unsaved-input-and-account-isolation): temporary readiness failures preserve authorized input in memory; Save stays blocked. Same-account conflicts retain Refresh/Stay semantics.
- Closed/deleted copying is allowed only while access remains authorized. Confirmed access loss, Logout or account switch clears/hides Task/editor content and invalidates callbacks. Minimal D8 recovery IDs may persist for authorized status checks, never draft-content restoration.
- Documentation restaged; no code/tests, commit, push or cloud actions. D10 origin/list restoration is next.

## 2026-11-04 — Slice8 D8 Save receipts approved

- Owner approved [D8 outcome recovery](slices/08-task-detail-metadata.md#d8-accepted--immutable-save-completion-receipts): stable operation identity, atomic immutable minimal receipt and authoritative Check save status after timeout/reload.
- Receipts identify original success despite later edits. Absent receipt does not prove cancellation; same-ID/original-version retry rechecks receipt on conflict. Missing Tasks are not recreated. Retain receipts with Task initially and include in permanent Task/account cleanup; no Activity Events or copied form content.
- Documentation restaged; no code/tests, dependencies, commit, push or cloud actions. D9 input/account isolation is next.

## 2026-11-04 — Slice8 D7 overlapping-edit behavior agreed

- Owner agreed [D7 serialization](slices/08-task-detail-metadata.md#d7-accepted--one-editmutation-per-task): one dirty editor/mutation per Task, Stay/Discard on dirty switches, unchanged direct switches and no competing writes while pending/unknown.
- Unknown outcome offers Check save status; preferences distinguish confirmed failure/conflict/unknown. Leaving retains tracking, Logout stays available and previously committed changes are never discarded.
- Documentation restaged; no executable changes, tests, commit, push or cloud actions. D8 lost-acknowledgement recovery is next.

## 2026-11-04 — Slice8 D6 simplified conflicts and Save gating

- Owner removed the proposed conflict reapplication workflow for this single-user product and required Save only for valid actual changes. Case-only changes to user-defined text are valid; dirty detection cannot use lowercase search/sort keys.
- [D6 contract](slices/08-task-detail-metadata.md#d6-accepted--valid-change-save-and-simple-conflict-recovery): reject stale Save, explain a fresh version exists and offer Refresh (discard/restart) or Stay (preserve authorized input without saving/rebasing). No Apply my changes, merge, overwrite or unchanged write/version/schema upgrade.
- Unknown acknowledgement remains operation-recovery work, not a conflict shortcut. Earlier reapplication/no-op proposals below are superseded for Slice8 metadata/description. Documentation restaged; no code/tests, commit, push or cloud actions.

## 2026-11-04 — Slice8 D5 schema evolution approved

- Owner approved [D5 compatible evolution](slices/08-task-detail-metadata.md#d5-accepted--compatible-schema-evolution): explicit retained Task1/2 readers, lazy transactional upgrade to2 on deliberate edit and independent description1/GFM format.
- Missing legacy fields/description decode as empty without read rewrites. Enable schema2 creation/writers only after compatible readers/Rules, retire unproven older writers and establish a data-aware rollback floor. Unknown/malformed records are not reset or downgraded.
- Design recorded/restaged; no migration, code, tests, commit, push or cloud publication. D6 conflict/reapplication/no-op behavior is next.

## 2026-11-04 — Slice8 D4 storage/concurrency agreed

- Owner agreed root Task metadata with a separate detail/description document, on-demand detail loading and shared root concurrency counter. Description Save atomically writes detail plus root version; metadata Save leaves detail untouched.
- [D4 contract](slices/08-task-detail-metadata.md#d4-accepted--separate-description-and-aggregate-concurrency) uses a transactional root/detail editing baseline. No claim that independent listeners are atomic or that unchanged detail must be rewritten on metadata edits.
- Schema-aware empty legacy descriptions, adversarial Rules/atomicity evidence and explicit trusted cleanup coverage remain required. D5 compatible schema rollout is next. Documentation restaged; no code/tests, commit, push or cloud actions.

## 2026-11-04 — Slice8 D3 safe GFM policy approved

- Owner approved safe rendering and added tel: to https/http/mailto. [D3 contract](slices/08-task-detail-metadata.md#d3-accepted--safe-gfm-rendering) selects react-markdown/remark-gfm, no raw HTML or image fetch, relative labels without navigation, inert task lists, escaped code and contained tables.
- HTTP(S) links use a new tab with noopener noreferrer; mailto/tel remain explicit browser/OS handlers. Renderer versions and adversarial/browser evidence remain implementation requirements. D4 storage/coherent versioning is next.
- Related docs restaged; no dependencies installed, code/tests, commit, push or cloud actions.

## 2026-11-04 — Slice8 D2 byte contract approved

- Owner approved [D2 source contract](slices/08-task-detail-metadata.md#d2-accepted--markdown-source-byte-contract): 65,536 UTF-8 bytes inclusive, CRLF/CR normalized to LF, other content preserved without trim/Unicode normalization, empty string for empty description and malformed-surrogate rejection before encoding.
- Client validates size and Rules directly enforce string UTF-8 byte size; no client-reported count is trusted. Boundary/adversarial direct-write evidence remains pending implementation. D3 safe GFM rendering/URI/image policy is next.
- Documentation restaged for review; no executable changes, tests, commit, push or cloud operations.

## 2026-11-04 — Slice8 replaces WYSIWYG with plain-text GFM

- Owner removed WYSIWYG; [Slice8 detailing](slices/08-task-detail-metadata.md) now uses plain-text Markdown authoring and rendered GFM in Task Detail. No rich-text editor, visual authoring toolbar or live preview. Tiptap was suggested, never approved or installed.
- Persist Markdown source/format version; existing 64 KiB bound applies to UTF-8 source. D1 closes by scope reduction. Source-byte enforcement and safe rendering/link/image handling remain D2/D3; other save/concurrency/navigation gates remain.
- GFM task-list checkboxes are noninteractive description notation, not Todos. Code does not execute; raw HTML is not interpreted. No remote image loading is authorized before resource policy closure.
- Earlier WYSIWYG/structured-rich-text agreement is superseded. Related documentation restaged for review under existing authority; no executable edits, dependency installation, tests, commit, push or cloud actions.

## 2026-11-04 — Slice8 gap review completed; documentation staged

- Owner requested pending-issue evaluation and preparation for stage. [Slice8 gap register](slices/08-task-detail-metadata.md#gap-evaluation--4-november-2026) lists twelve concrete implementation/security/integration gates without changing approved scope.
- Clarified confirmed-only editor/shared-state updates, canonical no-op/intended patches, per-Task pending/dirty serialization and preservation of local input only within an authorized same-account context. No cross-account or access-loss draft disclosure is permitted.
- Editor/node/link/paste policy, actual UTF-8/structure enforcement, metadata/detail versioning, schema rollout and operation-receipt/retention proof remain unresolved before coding/acceptance. No browser-only check or unchecked receipt is represented as server enforcement.
- Seven documentation files staged for review. Whitespace, conflict-marker and local-link checks only; no executable edits, tests/builds, commit, push, cloud checks or deployment. Held Slice4 test authority is unchanged.

## 2026-11-04 — Slice8 Task Detail/metadata detailing accepted and documented

- Owner accepted [Slice8 detailing](slices/08-task-detail-metadata.md) and all eighteen recommendations. Explicit editors and individually committed tri-state preferences preserve the existing non-audited metadata contract; Advanced Create remains Slice8A.
- Reference is optional single-line text up to 255 Unicode code points. WYSIWYG description uses allowlisted versioned structured content, maximum 64 KiB serialized UTF-8, with explicit Save/Cancel and no automatic rich-text merging.
- Conflicts preserve intended edits and offer Reload latest / Apply my changes / Cancel. Dirty navigation, remote editability changes, archived references, unknown acknowledgement and actual-origin mobile/desktop restoration are specified.
- Editor selection, rich-text schema/link/paste/size enforcement, metadata/detail storage, atomic versions/receipts and schema rollout remain implementation contracts requiring validation. Held Slice4 test scope is unchanged.
- Documentation only in taskify-slice-detailing: no executable edits, tests, staging, commit, push or cloud actions. Overall platform feasibility remains INCONCLUSIVE.

## 2026-11-04 — Slice7 documentation complete; staged for commit review

- Owner requested documentation completion and review for commit. Seven files cover accepted Slice7 scope, concrete gap resolutions, Slice8A placement and Slice5A inventory extension.
- Reconciled proposal-era wording, Task path/schema/null baseline and shared comparator references. Product scope is accepted; exact validation vectors, Rules/query proof, receipt/retention design, dependency implementations and held-test authority remain technical gates.
- Whitespace and local documentation links checked. No executable files, application tests/builds, commit, push or cloud actions. Staging prepares review only; no implementation readiness claim.

## 2026-11-04 — Slice7 concrete gap resolutions accepted

- Owner accepted all gap-resolution recommendations. [Slice7 detailing](slices/07-quick-create-basic-list.md#accepted-gap-resolutions--4-november-2026) now records them as the accepted design baseline; previous proposal entries below are historical.
- Approved deterministic NFC/lowercase Title ordering with original Title/ID ties, Task path and initial schema/concurrency version 1, explicit physical nulls for semantic absence, minimal persistent recovery IDs without durable form drafts, and commit-time/inventory safeguards.
- Advanced Create is approved as Slice8A after Task Detail/metadata editing and before onboarding; other slice numbers remain stable. More stays absent in Slice7.
- Exact validation/Rules/query/operation-receipt and retention proofs remain pending; acceptance of design does not establish implementation readiness or lift the Slice4 testing hold. Documentation only; no executable edits, tests, staging, commit, push or cloud actions.

## 2026-11-04 — Slice7 concrete gap-resolution proposals prepared

- Continued documentation review with [concrete proposals](slices/07-quick-create-basic-list.md#accepted-gap-resolutions--4-november-2026) for Title validation/collation, Task physical null representation and versions, eligible loading, minimal persistent recovery references and safe retry after reload.
- Proposed comparator uses NFC/lowercase Unicode code-point ordering with original Title/ID ties; no locale or accent stripping. Proposed recovery stores IDs only, not form content/credentials, and does not promise durable draft restoration.
- Proposed Advanced Create checkpoint is Slice8A after metadata editing; it is not an approved sequence change. Exact operation-receipt/retention, Rules enforcement and test-authority proofs remain open before implementation/acceptance.
- No new owner approval of these alternatives is claimed. Documentation only; no executable changes, tests, staging, commit, push or cloud actions.

## 2026-11-04 — Slice7 documentation gap review

- Owner requested documentation updates and gap review. [Slice7 gap register](slices/07-quick-create-basic-list.md#gap-review--4-november-2026) separates twelve technical/product integration items from accepted scope; no new approval of proposed alternatives is claimed.
- Clarified pending-write exclusion, acknowledgement/listener deduplication, archived-reference visibility, modal navigation state and stale Show Task behavior. Reload recovery must reacquire session admission; absent cloud reads never imply cancellation of a pending original create.
- Remaining design gates include exact text/Title enforcement, absent-field query representation, operation recovery retention/storage failure, commit-time classification/fence races and concrete schema/deletion/Rules dependencies. Advanced Create delivery needs an explicit later checkpoint; exact collation remains for review. FAB accessibility and held-test scope require validation/appropriate authority.
- Documentation only; no executable changes, tests, staging, commit, push or cloud actions. Implementation readiness is not claimed.

## 2026-11-04 — Slice7 Quick Create/basic list detailing accepted

- Owner approved [Slice7 detailing](slices/07-quick-create-basic-list.md) and all twelve recommendations: required trimmed single-line Title up to 255 Unicode code points, duplicate titles, explicit Category/Location defaults, Draft/unpaused/Unset state and no creation Activity Event.
- Responsive Quick Create omits More pending Advanced Create. Minimal All Tasks retains Category grouping, complete eligible metadata, collapsed groups, counts and deterministic Due/Title/ID ordering. Show Task expands its target Category; no fake Detail, Search, query engine or Saved View execution is added.
- Stable Task/operation recovery, classification revalidation, current admission and deletion-fence checks plus Rules/schema/deletion-inventory coverage are required. Concrete implementation contracts/validation remain pending; the Slice4 testing hold is unchanged.
- Documented in taskify-slice-detailing after confirming origin/main at 8320898. Documentation only: no executable changes, tests, staging, commit, push or cloud actions. Overall feasibility remains INCONCLUSIVE.

## 2026-11-02 — Slice5 integration amendment documented after main update

- Owner requested updating from main and assessing Slice5 impact, then authorized the documentation amendment. This checkout was fast-forwarded to d013515 without conflicts; no local source modifications were introduced.
- [Slice5 amendment](slices/05-workspace-provisioning.md#integration-amendment--main-baseline-d013515-2-november-2026) requires provisioning independent of provider status/linking, primary workspace/loading presentation, real account-state cleanup, optional initial-profile photo capture and reuse of the shared runtime.
- Define stage reconciliation under session/compatibility revocation and validate shared Auth boundaries rather than assume primary-flow isolation. Approved catalogues, icons, order, Views, timezone and no-backfill policy remain unchanged.
- Slice4 stays held and unaccepted. Integration acceptance requirements do not lift the existing held-test scope. Persistence/stage/query/Rules/deletion-fence contracts still require resolution before dependent implementation.
- Documentation only: no executable edits, tests, staging, commit, push, cloud action or deployment. Overall platform feasibility remains INCONCLUSIVE.

## 2026-11-02 — Owner puts Slice 4 on hold; Slice 5 is next

- **Slice 4 remains open, on hold and unaccepted.** Local linking repeatedly reports
  verification cancellation; root cause and real-provider acceptance are unresolved.
- Owner directs proceeding to Slice 5 workspace provisioning. A single-provider
  session is sufficient; linking is not a provisioning prerequisite. Primary-flow
  isolation is an architectural assessment, not a verified regression result.
- [Hold and handoff](slices/04-identity-linking-hold.md) records affected users,
  residual shared-Auth risk and resumption criteria. Full-slice/regression testing
  remains held. This supersedes the request to close and commit Slice 4.
- Documentation update only: no Slice 5 code, commit, push or deployment.

## 2026-11-02 — Slice4 linking implemented; unit-only validation

- Owner authorized linking implementation and explicitly held full-slice/regression
  testing until prompted. [Implementation checkpoint](slices/04-identity-linking-implementation.md)
  records the two-step proof/link flow, one-use SDK context and outcome recovery.
- Unlinked providers offer Link; fresh current-method proof precedes an explicit
  target-provider Continue. Server membership under the original UID confirms
  outcomes; conflicts preserve separate accounts, uncertain results offer read-only
  checking and cancellation cannot promise rollback after SDK invocation.
- Provider-only sign-in conflict hints survive deliberate redirect handoff without
  retaining credentials. No email discovery, merge, unlink or Taskify data write.
- Only targeted new unit tests and static checks are performed. Browser/emulator,
  integration, full regression and real-provider acceptance remain held. No builds
  were run. The browser fixture is wired but not run. Slice4 remains incomplete.
- No cloud configuration, stage, commit, push or deployment. Local preview remains
  available; earlier published dev and validation records are historical.

## 2026-11-02 — Signed-in action spacing locally verified

- Added 1.5rem vertical spacing between the Sign-in methods and Logout action rows,
  matching the existing spacing on the expanded Sign-in methods screen.
- Owner verified the spacing locally and requested staging for review. Formatting
  and whitespace checks passed; no new automated functional tests were needed for
  this CSS-only adjustment. This acceptance covers spacing, not provider workflows.
- CSS and this record are prepared for staged review. No commit, push or deployment;
  the local server remains running.

## 2026-11-02 — Slice4 recovery fixes prepared for staged review

- Staging scope: visibility/resume proof recovery, isolated memory-only metadata
  reads, bounded retries, shared lifecycle wiring and combined Auth/Firestore tests,
  with both correction reports and their historical/final evidence.
- Final source inputs still match the focused 201 unit/component, 7 integration,
  44 browser checks and four-build checkpoint. Two unchanged runner-preflight unit
  checks and four Foundation browser checks were excluded to preserve the manual
  preview on5173; a complete verify:all run is not claimed.
- Local preview remains running. Owner's Microsoft Linked/Google Not linked
  screenshot confirms settled status in that attempt; proof/linking acceptance
  remains pending. Provider linking is still disabled.
- Prepared for review only: no new commit, push, cloud change or deployment.

## 2026-11-02 — Slice4 repeated provider-status checking correction

- Owner reported repeated checking/status transitions on localhost. Primary Auth
  reload notifications can restart the shared Firestore compatibility listener;
  unrestricted automatic status recovery produced a feedback loop.
- [Checking correction](slices/04-identity-linking-checking.md) isolates metadata
  reload on an SDK-owned memory-only user copy, bounds recovery and ends stale
  ticket checks explicitly. A combined Auth/Firestore emulator regression is added.
- Local preview stays running for owner testing. No deployment or acceptance of
  this fix is claimed; earlier visibility-only evidence is historical.

## 2026-11-02 — Slice4 Google/Chrome dev verification recovery defect

- Owner reported successful Google sign-in on Chrome/dev, then blocked Step3
  verification. The screenshot's signed-in/ready header conflicted with stale
  compatibility-blocked provider status; no verification acceptance is recorded.
- [Visibility recovery correction](slices/04-identity-linking-visibility.md) keeps
  nonmutating proof pending across hidden/resume, reloads under fresh admission and
  restores status after readiness. Hard failures/identity changes still invalidate it.
- Production lifecycle handlers are shared with the regression fixture. Changes are
  local; dev remains at05adff6, linking stays disabled and owner retest is pending.

## 2026-11-02 — Slice4 checkpoint committed, pushed and published to dev

- Implementation commit `68a8e3b`; pushed merged source `05adff6` preserves upstream
  Slice5/5A/6 documentation. Executable inputs match the 185/7/41-test checkpoint.
- Clean Auth build `05adff63914f-c559a596a011da9f` published as Hosting version
  `eaf55fb912229e6e` to dev, expiring 2 December 2026 at 15:51 IST.
- [Preview evidence](slices/04-identity-linking-preview.md): local/HTTPS 390/1280px
  hash/header/build/gate/reload/offline checks passed. No provider interaction or
  real-device acceptance is claimed; linking remains disabled.
- QC/UAT/live and backend/billing/Auth/Web App/key metadata are unchanged.
  The local server remains stopped; publication documentation is a separate record.

## 2026-11-02 — Slice4 current-account verification prepared for staged review

- Staging scope: Sign-in methods status, Google/Microsoft popup verification,
  isolated redirect verification, tests, guidance and the three checkpoint records.
  Provider linking remains disabled; Slice4 is not complete.
- Validation inputs still match the redirect checkpoint: 185 unit/component,
  7 integration and 41 headless Chromium checks, plus four builds and static checks.
  No additional test execution or owner acceptance is implied by staging.
- The exact dev candidate passed local Hosting checks at 390/1280px. Publication
  remains pending a clean reviewed commit or explicit owner snapshot exception;
  the current dev channel is unchanged.
- Owner subsequently requested a local server; Auth-mode Vite remains running at
  http://localhost:5173/ for manual review. Interactive automation remains paused.
- No commit or push is included. Earlier action-state fields in checkpoint evidence
  describe their historical execution snapshots, before this staging request.

## 2026-11-02 — Slice4 isolated redirect proof implemented locally

- Public Firebase user-copy/redirect APIs run current-account proof in a temporary
  SDK-managed session context for the same UID. Primary Auth initialization and
  persistence stay unchanged; proof startup/cleanup cannot replace the primary user.
- Return admission checks UID, provider, operation, epoch and correlation validity;
  current provider reload plus session/compatibility checks precede presentation.
  Hosted touch devices use redirect; blocked desktop popups offer redirect recovery.
- [Redirect checkpoint](slices/04-identity-linking-redirect.md) records the tradeoff,
  evidence and limitations. Earlier popup-only status below is historical.
- Linking, collision feasibility and hosted real-provider acceptance remain pending.
  No deployment, cloud changes, staging, commit or push.

## 2026-11-02 — Slice4 popup current-account proof checkpoint

- Linked Google/Microsoft methods can freshly verify the original account using a
  popup. UID, session generation, compatibility and Logout guards reject stale proof;
  cancellation stays serialized until the SDK call settles. No linking is enabled.
- Owner accepted finishing popup proof first. Redirect proof fails closed before SDK
  invocation; resolving safe redirect startup is next and remains required for Slice4.
- [Proof checkpoint](slices/04-identity-linking-proof.md) records local validation and
  limitations. No interactive provider test, cloud change, deployment, stage or commit.
- Earlier status checkpoint below is historical; fresh popup proof is now implemented.

## 2026-11-02 — Slice4 implementation begun: read-only sign-in methods

- Owner authorized reviewing and beginning Slice4. Added authenticated Sign-in
  methods with server-refreshed Google/Microsoft status, session/gate admission,
  stale-result suppression, keyboard Back/focus and explicit recovery. No link
  mutation or reauthentication enabled yet. [Checkpoint](slices/04-identity-linking-status.md).
- 133 unit/component, 7 integration and 25 headless browser checks and all four builds
  passed. New SDK/emulator cases cover 390/1280px and existing sign-in regressions.
- Project config read returned signIn:{}; explicit duplicate-email value omitted.
  Documented platform automatic-resolution risk and the SDK's combined proof/link
  operation. The owner accepted fresh reauthentication, immediate pre-SDK admission and
  post-operation reconciliation as the SDK boundary. This explicit amendment is
  recorded; no linking operation is enabled by the read-only checkpoint.
- No interactive tests, cloud mutation, deployment, staging, commit or push.
  Slice4 remains in progress; fresh reauthentication is the next implementation step.

## 2026-11-02 — Slice6 responsive-navigation detailing accepted and documented

- Owner accepted Slice6 scope and all twelve recommendations, then authorized documentation updates. [Slice6 detailing](slices/06-responsive-navigation.md) records mobile overlay drawer, desktop rail/sidebar, contextual headers, routing/Back, focus/scroll behavior and acceptance.
- Accepted breakpoint is 960 CSS px; sidebar state is retained per tab/account across routes/reload with Logout/account-switch reset. Hover preview is transient and explicit keyboard/touch expansion remains available.
- Feature shells communicate availability: no fake counts/charts, no inert Search/Create and no actionable future management destinations. Navigation consumes persisted global View order and shared readiness/account/deletion boundaries.
- Slice5/5A implementation and relevant workspace integration remain pending locally. Documentation only: no executable edits, tests, staging, commit, push, cloud actions or deployment. Overall platform feasibility remains INCONCLUSIVE.

## 2026-11-02 — Slice5A selects Option 3 manual trusted finalizer

- Owner selected Option 3. [Slice5A detailing](slices/05A-delete-account.md) now specifies browser-confirmed intent and an explicitly invoked local operator script for verified data cleanup, Auth deletion last and safe temporary-fence retirement.
- Operator action is the normal completion path; the browser displays request/status rather than performing cleanup. Minimal UID/job/state/version/timestamp controls remain until verified finalization and stale-token safety checks; no permanent tombstone or hosted backend is selected.
- This supersedes the unresolved architecture alternatives in the earlier checkpoint below. Exact Rules/control schemas, token-safety interval, script concurrency and credentials still require implementation validation. Every destructive run needs explicit target authorization.
- Related docs are aligned and staged for review. No executable changes, account deletion, cloud actions, commit or push.

## 2026-11-02 — Slice5A documentation finalized and staged for review

- Owner approved Delete Account scope and conflict evaluation, then authorized complete documentation and staging for review. [Slice5A detailing](slices/05A-delete-account.md) records state/recovery contracts, enforcement responsibilities, acceptance and unresolved finalizer/retention alternatives after Slice5 and before Slice6.
- Approved flow: typed DELETE, fresh same-UID provider proof, persisted deletion intent, bounded owned-data cleanup, protected-record exception, Auth deletion last and interruption recovery. No external provider account is deleted.
- Final-marker/identity atomicity, stale authenticated clients, marker retention and enforceable proof/completeness remain unresolved under the browser-direct topology. No retained fence, backend or retention policy is approved by the scope agreement. Implementation is blocked on those concrete choices and Slice5 schema alignment.
- Documentation changes are staged for review. No executable changes, tests, commit, push, cloud actions or account deletion. Overall platform feasibility remains INCONCLUSIVE.

## 2026-11-02 — Slice5 provisioning detailing prepared for review

- Owner approved provisioning scope and safety recommendations, finalized twelve Categories (including protected Uncategorized) and ten Locations, and approved Material Symbols Rounded mappings. Categories/Locations start alphabetical, with Uncategorized and synthetic default Unspecified last respectively. Finance uses wallet, Household home_and_garden and Wellness heart_plus.
- [Slice5 detailing](slices/05-workspace-provisioning.md) records default Views, profile/settings initialization, blocking Loading/progress, duplicate-safe concurrency, recovery, schema/security boundaries and acceptance requirements. Physical persistence/stage/query-codec proposals still need concrete review/verification before implementation.
- No starter Tasks or automatic backfill. User-facing Delete Account is approved for early separate Slice5A after provisioning and before Slice6; existing slice numbers remain stable. No test accounts are deleted.
- Fast-forwarded this clean checkout to locally known origin/main at ca822f3 before preparing docs, preserving newer Slice3 presentation/acceptance evidence. This is documentation only: no executable edits, tests, staging, commit, push, cloud change or deployment. Overall feasibility remains INCONCLUSIVE.

## 2026-11-02 — Slice4 identity-linking detailing accepted and documented

- Owner accepted [Slice4 detailing](slices/04-identity-linking.md) and proceeded to documentation in `taskify-slice-detailing`.
- Google/Microsoft linking preserves UID and ownership, with fresh reauthentication for each attempt and authenticated proof of the additional identity. Matching email never authorizes linking; Apple remains deferred.
- Collision recovery restarts provider proof; existing-account conflicts do not merge accounts. Cancellation after submission requires outcome verification rather than presumed rollback or blind replay. Unlinking, profile editing and provisioning remain outside this slice.
- Implementation remains pending authorization. Synced this checkout to `origin/main` at `fe7a600`, including implemented and owner-accepted Slice3. Google/Microsoft personal-account checks are owner-reported; work/school testing remains deferred. Linking-specific feasibility and provider-configuration behavior remain unverified.
- Owner subsequently authorized documentation updates and staging for review in `C:\DD\Projects\TaskifyIt\taskify-slice-detailing`. The Slice4 document, README, architecture, implementation plan and this status update are prepared for staged review.
- Documentation only: no executable changes, tests, commit, push, cloud operations or deployment. Overall platform feasibility remains INCONCLUSIVE.

## 2026-11-02 — Slice3 accepted; closure prepared

- The owner accepted Slice3 and requested closure preparation. Google and Microsoft
  personal-account login workflows were verified by the owner on desktop and mobile
  at https://taskify-dev-dpdhole--dev-por3atkf.web.app/.
- Microsoft work/school-account testing is explicitly deferred until product/features
  mature and does not block this acceptance. Apple remains deferred separately.
- The current responsive login presentation is accepted for slice development;
  technical details/diagnostics remain visible at the owner's direction.
- [Acceptance and closure record](slices/03-provider-sign-in-closure.md) separates
  owner-reported checks from historical automated/deployment evidence. The tested
  hosted build was not independently identified in this acceptance update.
- No implementation work remains within the accepted Slice3 scope. Closure is
  prepared and staged for Git review at the owner's request; no new commit, push,
  deployment or cloud change is made.
  Slice4 identity linking is next for detailing, not implicitly authorized implementation.

> Earlier dated entries below are historical checkpoints. The 2 November acceptance
> and closure record supersede their pending Slice3 presentation/provider statements.

## 2026-10-23 — Current Auth build published to dev

- Owner requested dev deployment. Published clean commit `fb629e4`, build
  `fb629e482551-dc4f80bbb0fcdf29`, Hosting version `7664413ad02b4666`.
  Expiry **22 November 2026, 22:22 IST**. [Deployment record](slices/03-provider-sign-in-preview.md).
- Local Hosting and hosted HTTPS checks at 390/1280px passed: exact artifact hashes,
  security/cache headers, both provider controls, real Firestore readiness, reload
  and offline/reconnect. No interactive sign-in performed.
- qc/uat/live and backend/key metadata unchanged. Interactive automation remains
  paused; local manual preview preserved. Work/school and actual hosted mobile/
  provider acceptance remain pending. No staging, commit or push in this checkpoint.

## 2026-10-23 — Acceptance documentation staged for review

- Owner requested documentation updates and staging. Acceptance plan/evidence,
  current status, slice detailing, delivery plan, README and developer guidance
  reflect partial desktop verification without declaring Slice3 complete.
- Google results remain agent-observed; Microsoft personal sign-in, refresh and
  Logout remain owner-reported manual passes. Earlier cancelled-attempt history
  is preserved. Work/school, hosted mobile and operational checks remain open.
- Documentation-only review preparation; JSON, links, credential-pattern and
  whitespace checks passed. No new tests or app/browser actions. Interactive
  automation remains paused; no server lifecycle action, commit, push or deployment.
  [Review record](slices/03-provider-sign-in-acceptance.md#prepared-for-review--23-october-2026).

## 2026-10-23 — Microsoft personal manually verified by owner

- Owner explicitly confirmed Microsoft personal sign-in, refresh and Logout passed.
  Recorded as owner-reported manual verification, without agent re-observation or
  inferred browser/device coverage. [Acceptance evidence](slices/03-provider-sign-in-acceptance.md#owner-manual-verification--23-october-2026).
- Earlier cancelled/signed-out Microsoft observation remains historical; its cause
  is unconfirmed. No code/configuration changes were made to obtain this result.
- Work/school Microsoft, hosted mobile behavior, operational provider checks and
  Slice3 closure remain pending. Interactive automation remains paused; no staging,
  commit, push or deployment. Acceptance records are uncommitted.

## 2026-10-23 — Real-provider checks paused for owner manual testing

- Owner approved interactive desktop acceptance. Clean preview from `c765972`
  was started at localhost:5173. Chrome was unavailable to connected controls;
  app checks used a dedicated in-app browser tab with owner-controlled OAuth windows.
- Google sign-in/compatibility, refresh persistence, second-tab restoration,
  cross-tab Logout and signed-out refresh were directly observed. Taskify-side
  cancellation showed no Logout for either provider.
- Microsoft personal completion was reported by the owner, but Taskify remained
  cancelled/signed-out. At that point the case was not passed; cause is unconfirmed. The owner
  paused before a fresh retry and chose manual testing. Work/school Microsoft and
  actual mobile coverage remain pending. [Acceptance record](slices/03-provider-sign-in-acceptance.md).
- Interactive automation is paused and local preview remains running for manual
  testing. No code changes, staging, commit, push or deployment in this checkpoint.
  No credentials or account identifiers recorded; Slice3 remains open.

## 2026-10-23 — Presentation committed; real-provider acceptance prepared

- Owner requested Commit and proceed. Presentation committed as `c765972`;
  no push requested. A clean Auth artifact was prepared from that commit and
  client config plus read-only provider/domain metadata checks passed.
- [Real-provider acceptance plan](slices/03-provider-sign-in-acceptance.md) starts
  with desktop localhost popup checks, then separately authorized hosted mobile
  validation. Interactive approval is required by the owner's earlier instruction.
  Accounts/consent are owner-controlled; no secrets in evidence.
- No real sign-in attempted, server started, cloud changes or deployment during
  preparation. New acceptance records are uncommitted; Slice3 remains open.

## 2026-10-23 — Shared login presentation implemented locally

- Owner requested the next implementation step. Added the shared Taskify hero,
  centered stacked Google/Microsoft controls, touch targets, keyboard focus recovery
  and collapsed public diagnostics. Cancellation returns to a normal signed-out
  status. Auth/controller behavior and the cancellation fix remain unchanged.
  [Presentation checkpoint](slices/03-provider-sign-in-presentation.md).
- 121 unit/component tests, all four builds, 7 integration and 23 headless Chromium
  checks passed with no retries. Browser checks cover 320/390/768/1280px, centered
  controls, keyboard/native disclosure behavior and provider focus recovery.
  Inspected mobile/desktop screenshots. No real-provider/device validation claimed.
- Shared presentation is implemented locally; real Google/Microsoft acceptance,
  provider operational checks and Slice3 closure remain open. No cloud changes,
  Hosting publication, staging, commit or push. No preview server left running.

## 2026-10-23 — Cancellation button fix prepared for review

- Owner reported a transient Logout button after closing a Google/Microsoft popup
  and selecting Cancel sign-in. The controller now prevents a pending SDK promise
  alone from offering Logout once signed out. Six regressions cover both providers'
  cancellation display and observer-failure recovery. [Fix record](slices/03-provider-sign-in-cancellation-fix.md).
- Owner requested stopping the local preview and staging the correction. The owned
  server is stopped and port 5173 is free. Full verification now passes all 118 tests and
  four builds, including the preflight cases previously affected by that occupied
  port. No provider/backend or deployment changes, commit or push.
- Changes are staged for review; Slice3 acceptance and the existing dev release
  remain unchanged. Real-provider acceptance and final login presentation remain open.

## 2026-10-23 — Microsoft checkpoint prepared for review

- Owner requested documentation updates and staging. Microsoft implementation,
  shared provider operation, regression tests and checkpoint evidence are staged
  for review against baseline `41fe3f4`; no new commit or push.
- Local Auth preview was started at the owner's request on a checked-free port 5173;
  localhost returned HTTP 200. No real Google/Microsoft OAuth success is claimed.
- Validated source hashes remain unchanged: 112 unit/component, 7 integration,
  19 headless browser checks and four builds passed. Final login presentation,
  real-provider acceptance and Slice3 closure remain pending. Existing dev remains
  the earlier Google-only snapshot. [Review checkpoint](slices/03-provider-sign-in-microsoft.md#review-preparation--23-october-2026).

## 2026-10-23 — Slice3 Microsoft flow implemented locally

- Owner authorized the next implementation step after commit `41fe3f4`. Added
  Continue with Microsoft through a provider-aware shared Auth/session operation.
  Microsoft uses the common tenant and account selection for the agreed personal
  and work/school audience; no Graph scopes or application account linking added.
  [Microsoft checkpoint](slices/03-provider-sign-in-microsoft.md).
- Both providers share popup/redirect handling, pending-operation exclusion,
  compatibility readiness, persistence and Logout invalidation. New redirect
  metadata identifies its provider and still consumes earlier Google-only markers.
- 112 unit/component tests, four builds, 7 integration and19 headless Chromium
  checks passed. Browser tests cover each provider's popup/refresh, cancellation
  with late completion, blocked-popup redirect at390px and cross-tab Logout during
  an unfinished popup. These are Auth emulator checks, not real-provider consent.
- Final shared login presentation, real Google/Microsoft acceptance (including
  personal and work/school Microsoft accounts), secret-expiry verification and
  Slice3 closure remain pending. Existing dev remains the earlier Google-only
  snapshot. No cloud configuration, deployment, staging, commit or push in this step.

## 2026-10-23 — Slice3 Auth preview published to dev

- Owner requested dev deployment and explicitly allowed the uncommitted snapshot.
  Published Auth-mode build `adb902976e4c-6e922f6f8c40361a`, Hosting version
  `ed7c71c3d578e5de`; expiry22 November2026 at21:11 IST.
  [Deployment and evidence](slices/03-provider-sign-in-dev-preview.md).
- HTTPS hashes/headers/exclusions and headless390/1280px readiness, Google control,
  reload, offline/reconnect and layout checks passed. No interactive OAuth attempted.
- qc/uat/live and backend/key metadata unchanged. No staging, commit or push.
  Microsoft and complete Slice3 provider acceptance remain pending. Normal future
  release/promotion policy continues to require reviewed clean source commits.

## 2026-10-23 — Slice3 Google flow implemented locally

- Owner authorized the next step after Auth/session. Auth mode now provides Google
  popup sign-in, hosted touch-device redirect, explicit redirect fallback for a
  blocked popup, classified recovery and safe retry. UID remains the identity key;
  application account linking and provisioning remain later slices.
- Logout invalidates unfinished provider intent before SDK user commitment, with
  same-origin cross-tab coordination. Current compatibility remains required for
  protected readiness after provider completion. [Google checkpoint](slices/03-provider-sign-in-google.md).
- 102 unit/component checks, all four builds, 7 integration and15 headless Chromium
  checks passed. Emulator browser checks exercise Google popup, refresh persistence,
  popup cancellation/late result, blocked-popup redirect at390px and cross-tab Logout
  during an unfinished popup. Google's official iframe helper library is the only
  permitted external provider helper origin in those tests; auth exchanges use
  the local emulator. Real Google OAuth and mobile browser policy remain unverified.
- Microsoft flow and real-provider acceptance remain pending. No cloud configuration,
  hosting publication, staging, commit or push in this step. Earlier step reports
  remain historical checkpoints; their input hashes describe their original source.

## 2026-10-23 — Slice3 Auth/session step implemented locally

- Owner authorized Auth adapter/session controller after configuration. One stable
  Firebase app now composes persistent Auth and the compatibility reader in auth
  mode. Restoration/gate state are independent; session generations guard account
  transitions and Logout requires SDK plus observer confirmation. Failed Logout
  quarantines protected content with explicit retry. [Checkpoint](slices/03-provider-sign-in-session.md).
- 85 unit/component tests, four builds, 7 integration and11 headless Chromium
  checks passed without browser retries. Real SDK/emulator checks cover refresh
  persistence, rendered mobile/desktop session UI, UID switching and cross-tab
  Logout. No live OAuth was attempted and Slice3 is not complete.
- Google/Microsoft provider controls/flows are next. Microsoft account types and
  both callback lists are screenshot-verified; secret expiry, Google audience and
  actual provider completion remain unverified. No cloud configuration change,
  deployment, staging, commit or push in this step.

## 2026-10-23 — Slice3 configuration step implemented

- Session checkout: taskify-slice-implementation, baseline adb9029. Owner authorized
  step-by-step implementation beginning with configuration. Registered one Web App,
  added exact dev/qc/uat Firebase Auth domains, retained existing provider settings
  and disabled billing. Public SDK values are local/ignored; no secrets in evidence.
- Prepared strict browser config/stable app factory, same-origin host selection,
  CSP and HTML LF configuration. The factory is not yet wired into the ordinary
  app; session/controller composition follows in step2.
- Owner confirmed Microsoft personal and work/school audience. Google/Microsoft
  provider-console callback and Microsoft audience/secret-expiry checks remain
  initially unverified; owner subsequently supplied screenshots confirming both
  providers' callback entries and Google origins. Microsoft account-type/expiry
  and actual OAuth checks remain. [Configuration record](slices/03-provider-sign-in-configuration.md).
- 65 unit/component tests, all builds, static checks and local Hosting checks at
  mobile/desktop widths passed. No interactive sign-in, cloud Hosting deployment,
  staging, commit or push. Configuration changes are in the working tree.

## 2026-10-23 — Slice3 adds Microsoft; Apple authentication deferred

- Owner added Microsoft sign-in and deferred Apple authentication. Google and Microsoft are the active Slice 3 providers; Apple feasibility, implementation and live validation do not block acceptance.
- [Slice3 detailing](slices/03-provider-sign-in.md), the product identity section, architecture, plan and README reflect this amendment. Provider feasibility and live validation remain outstanding; linking stays in Slice 4.
- Implementation was authorized after documentation commit `c082a0f`. The committed Slice 2 dependency was integrated and pushed; the current session now uses the fresh `taskify-slice-detailing` checkout at baseline `34a38ad`. Earlier checkout/dependency statements below describe their historical checkpoints.
- This amendment changes documentation only; no provider configuration, executable changes, tests, staging, commit, push or deployment is performed.

## 2026-10-23 — Slice3 detailing accepted and documented

- Owner accepted [Slice3 provider sign-in detailing](slices/03-provider-sign-in.md) and authorized documenting it and updating project docs in the separate `taskify-slice3` checkout, based on `f264868`.
- Accepted scope: Google/Apple feasibility and sign-in, persistent device sessions, compatibility integration, minimal authenticated landing, Logout and account-state isolation. Proof-based linking remains Slice 4; workspace/profile provisioning remains Slice 5.
- Both provider feasibility and implementation remain pending. Popup/redirect selection follows current official-source feasibility discovery; real provider configuration/testing requires separate authorization. No automatic email-based merge or linking is permitted.
- This checkout does not include the sibling checkout's uncommitted compatibility implementation. Slice 3 depends on reviewed and validated Slice 2 behavior; those source files are not accepted by this documentation checkpoint.
- Documentation only: no executable changes, tests, cloud operations, staging, commit, push or deployment. Live promotion remains deferred and overall platform feasibility remains INCONCLUSIVE.

## 2026-10-23 — dev/QC/UAT channel policy applied

- Owner replaced the earlier channel proposal with exactly three preview channels:
  dev for development, qc for verification, uat for external/beta review. Every
  hosting/deployment instruction must name the destination; ask if unclear.
  No automatic hosting/renewal. UAT promotes to live only with explicit owner
  approval when ready. [Policy and current URL](hosting_channels.md).
- dev serves the exact verified Slice2 version; qc and uat are empty. Headless
  mobile/desktop checks passed. Old foundation-smoke/compatibility-smoke channels
  removed after verification. Live unchanged; previews have30-day expiry.
- Migration/docs are uncommitted; no push. Historical evidence is preserved.

## 2026-10-23 — Slice2 committed and preview verified

- Implementation committed as67e170e. Owner then authorized Hosting preview.
  [Preview results](slices/02-compatibility-preview.md) record the clean artifact,
  seven-day compatibility-smoke URL and successful hosted Firestore checks at
  mobile/desktop widths, including offline/reconnect recovery.
- Removed the unused API key automatically generated during publication, then
  reverified the preview. Live Hosting, billing, database identity and Rules are
  unchanged; active keys empty. No additional policy revision or push.
- Preview execution checkpoint is complete; owner closure review remains. Live
  promotion still requires explicit owner approval. Earlier entries are historical.

## 2026-10-23 — Slice2 implemented; Firestore checkpoint verified

- Compatibility decoder, generation gate, listener/recheck lifecycle, blocking UI,
  isolated synthetic consumers, minimal cloud Rules and transactional operator
  publication are implemented. [Validation](slices/02-compatibility-validation.md)
  records 61 unit/component, 7 integration and 8 Chromium checks and cloud evidence.
- Owner approved headless tests and the explicit real-cloud checkpoint. Fresh
  Standard/Native Firestore in asia-south1 has deletion protection enabled;
  revision 1/app 0.1.0 is published. Key-free public singleton reading, missing/
  ready/offline/reconnect behavior and access denials passed against real Firestore.
- No visible/interactive tests, product sign-in, real Task features or live
  publication. Implementation is staged for owner review, without a new commit. Preview publication
  waits for review and a clean source commit; live promotion still needs explicit
  owner approval. Slice2 closure is pending that preview checkpoint/review.
- Prior entries below are historical. Documentation commit f264868 exists locally;
  it has not been pushed. Original Foundation/frozen evidence is unchanged.

## 2026-10-23 — Slice2 documentation accepted; commit preparation authorized

- Owner accepted the [Slice2 specification](slices/02-compatibility-gate.md) and confirmed Firestore `runtime/compatibility` as the authoritative gate policy. Hosted policy remains optional for external/secondary use; a derived copy identifies its source revision and cannot override the database or authorize access when verification fails. No secondary Hosting-policy implementation is added to this slice.
- Documentation status, architecture and plan are aligned. The owner authorized staging/preparation and requested waiting for commit; no commit/push, executable changes, tests, cloud provisioning or deployment are performed by this preparation.
- Implementation remains pending explicit instruction. Live promotion remains deferred until development matures and requires explicit owner approval.

## 2026-10-22 — Slice2 compatibility detailing prepared; implementation pending

- The owner accepted the objectives/scope, contract/runtime direction, synthetic consumers, operator publication and acceptance approach, then authorized documentation. [Slice2 specification](slices/02-compatibility-gate.md) records the proposed concrete contract, states, lifecycle/races, Rules boundary, publication process and test matrix for review.
- Numeric major.minor.patch app comparison supersedes the earlier integer representation; contract access is public exact-document get before sign-in. Revisions remain monotonic. Client checks do not attest binaries or replace Rules. Synthetic command writes stay local/emulator-only; cloud has no public write probe.
- Foundation closure documentation was committed and pushed as `f2eaf82`; the earlier GitHub push failure is resolved for that push. Original validation/frozen evidence is unchanged.
- Slice2 documentation only: no executable source, Rules/config, dependencies, tests, cloud resources, staging, commit or push are changed by this detailing. Implementation and cloud checkpoints await their applicable instructions.
- Live promotion stays deferred until development matures and requires explicit owner approval. Overall platform feasibility remains INCONCLUSIVE.

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
