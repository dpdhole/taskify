# Category backend implementation and local evidence

Status: Implemented. Owner authorized implementation choices, specification updates and local verification, separately approved post-commit authoritative snapshot responses, and explicitly approved commit/push on 2026-10-07. Formal Verified status and deployment remain held.

## Scope and baseline

- Repository: `dpdhole/taskify`, `main`, based on preserved specification commit `add989fe065841aa73d3ff0ff71cf6fed2ddeeab`. The owner released publication of the implementation and this prior specification commit after verification. No reset or checkout replacement was performed.
- Approved behavior: DEC-074–DEC-077. Approved implementation choices/response observation: DEC-078–DEC-082.
- Implemented operations under `apps/api/src/categories`: createCategory, renameCategory, setCategoryArchived, resetCategoryOrder and completeRegistration. Thin callable adapters live under `src/functions/categories.ts` and are exported through `src/index.ts`.
- Updated public contracts replace ResetCategoriesToDefaultsRequest with ResetCategoryOrderRequest/Response, add registration request/response and generic DUPLICATE_ARGUMENT. Its callable transport code is already-exists with the domain code in details.
- Category identity and complete canonical schema are preserved. Guards reserve active/archived names; private owner metadata coordinates collection additions and idempotent default provisioning. No user profile/schema or Rules permission change was introduced.
- Firestore server timestamp transforms are used for all new Category writes. Category tokens/responses encode seconds/nanoseconds losslessly with nine fractional digits. Non-Category timestamp behavior is unchanged.
- Native Intl.Segmenter counts grapheme clusters; sorting compares Unicode code points. Native Node crypto computes private metadata IDs. No dependency/manifests/package-manager/runtime change or cloud migration was introduced.

## Execution environment

- Portable Node 22.23.3 (ICU 78.3 / Unicode 17.0), pnpm 10.34.6 selected through the root packageManager/Corepack, portable JDK 21.0.12.1. Process PATH points at sibling verification-tools; system runtimes were not changed.
- Existing resolved dependencies: TypeScript 5.9.3, Node typings 22.20.5, Vitest 5.0.3, Firebase CLI 15.32.1, firebase-admin 13.10.0 and firebase-functions 6.6.0. Existing standalone artifact dependencies installed from cache with its preserved lock; no new dependency was adopted.
- Admin integration/Rules/query tests use taskify-local and guarded local Firestore 127.0.0.1:8080. Callable tests use demo-taskify and guarded local Auth 9099, Functions 5001 and Firestore 8080. Emulator sessions run sequentially and stop before another suite starts.
- The sandbox could not access Corepack lastKnownGood.json; the build/test command was rerun with the required escalation. This changed execution permissions, not project tooling.

## Executed results — 2026-10-07

All final suites passed: **420 tests total**, including 128 additional cases over the recorded 292-test baseline. Earlier successful checkpoints were superseded by the final results below. Production contract/API TypeScript builds and standalone packaging passed on the final source; the emulator loaded all six exports. All emulator sessions shut down successfully.

| Final check | Result | Duration |
|---|---|---|
| API unit | 116 passed; 4 files; exit 0 | 2.42 seconds |
| API Firestore integration | 63 passed; 2 files; exit 0 | 42.44 seconds |
| Security Rules | 174 passed; 1 file; exit 0 | 15.92 seconds |
| Preset query / Explain tooling | 39 passed; 1 file; exit 0 | 5.80 seconds |
| Callable HTTP / final artifact | 28 passed; 1 file; exit 0 | 44.37 seconds |

Final artifact install reused all 240 cached production packages and preserved the independent lockfile. SHA-256 remained `CA07F4ED813382E48C70FE18DBAE8FEA24950AAF03237A80566307A7692508A0`. Repository `git diff --check` (using its configured line-ending rules) and new-file whitespace checks passed. At the verification checkpoint, HEAD was the preserved specification commit and the tested source changes were uncommitted; subsequent owner-approved publication includes that tested implementation plus documentation-only publication/continuity updates.

Reproduction commands (Node 22/pnpm 10.34.6/JDK 21 on process PATH):

```sh
pnpm run build:api
pnpm --filter @taskify/api test --exclude '**/*.integration.test.ts'
pnpm run test:api:integration
pnpm run test:firestore:rules
pnpm run test:firestore:queries
pnpm run test:api:callable
```

The callable command invokes package:api, which rebuilds contracts/API, checks erased contract runtime imports, prepares the standalone artifact and installs its isolated production dependencies before emulator startup.

## Meaningful coverage

- Unit: trim/NFC/casing/accents/internal whitespace/punctuation; 15-grapheme limits including combining marks/family emoji; malformed names/IDs/tokens; fixed Unicode code-point ordering; exact timestamp round-trips, range/negative values and within-millisecond distinctions; all five adapters' authentication, canonical identity, response passthrough, stable errors and private-error protection.
- Admin integration: complete creation schema; active/archived duplicate names including older Categories without guards; owner isolation; concurrent same-name creation and competing renames; concurrent custom append; guard release on key-changing rename and guard retention on casing-only changes/archive; default protection, no-op preservation and stale matching-state conflicts; exact timestamp precision; Task reference/creation metadata preservation.
- Registration: exact 13-name catalogue/order/guards; concurrent completion returns winning IDs; completed retries preserve state and timestamps; collision fails atomically; completed registration never repairs deleted defaults; real commit-time failure rolls back Categories/guards/marker; injected retry retains IDs and increments membership only once; floating-point order exhaustion fails without partial writes.
- Reset: empty/nonprovisioning behavior; gapped no-op order; defaults/custom/archived together; changed-only timestamps; foreign-owner isolation; ID tie-breakers/code-point order; real commit-time rollback; injected ABORTED retry rereads changed membership and counts only final-attempt writes; concurrent create (including empty-set case), rename/archive and direct reorder batch produce serial outcomes or stale-token conflicts; post-commit response query reflects an intervening rename in one snapshot.
- Callable HTTP: authenticated Category creation then Task creation; duplicate active/archived-name errors; rename/archive/no-op/conflict behavior; real client serverTimestamp reorder followed by precise-token round-trip; idempotent registration/default protection; Reset wire shape/order/timestamp agreement and archived/reference preservation; unauthenticated/malformed/missing/foreign denial; direct protected Category edits and private metadata reads/writes denied by unchanged Rules.

## Intermediate failures and corrections

- First production build found an inferred any[] for registration guards; explicitly typed it as DocumentReference[]. This was new implementation code, not a baseline production defect.
- First integration run passed 50/51; real concurrent creation exceeded the default five-second Vitest test timeout. Increased integration test timeout to 20 seconds and hook timeout to 30 seconds. The next run passed all 51.
- Expanded integration run passed 59/61. Two injected retry tests recursively wrapped Transaction.create because the SDK reuses its Transaction object across attempts. Restored the spy after each callback; production retry logic was not changed to address that instrumentation failure.
- Implementation review added an atomic failure check when thirteen default positions exceed floating-point precision and removed a spread-based maximum computation. These changes remain within the approved Category implementation scope; no existing production slice was changed.
- Final Unicode review replaced normalized-name equality queries for guardless-record reconciliation with full-value comparisons from an owner snapshot; create/provisioning reuse their existing snapshot. This avoids relying on a normalized-name index for long combining-mark graphemes and removes repeated provisioning queries. Added long-grapheme and real client emoji-reorder cases before the final integration/callable rerun.

## Limits and compatibility

- This is executed local evidence, not formal Verified status or deployed verification. Production signatures, real providers/email delivery, cloud IAM/regions/runtime/scaling, client registration/readiness UX, browser/mobile behavior and deployed Rules/Functions remain unverified. Auth emulator tokens are unsigned and the provider fixture is mocked.
- Registration readiness is an approved client contract; no frontend enforcement is implemented. Auth creation can succeed while Taskify initialization remains pending. Existing records are not silently promoted or repaired; a default-name collision before completion requires owner-directed reconciliation. No data migration was executed.
- Category request/response timestamps use nine fractional digits. Client adapters must preserve full Firestore seconds/nanoseconds; a Date-based formatter is unsuitable for Category concurrency. Test production builds exclude test sources; passing Vitest does not establish full repository/test-source type checking.
- Responses describe post-commit authoritative state. Reset changed_count belongs to its transaction while the returned list may include later membership, rename, archive or reorder changes. A post-commit read/transport failure cannot undo a committed mutation; create has no idempotency key and retry can report a duplicate. Registration is explicitly idempotent.
- Reset remains one transaction. Category membership additions coordinate through private metadata; direct reorder contends through Category documents. Finite contention scenarios were exercised; high-volume production contention and large-collection transaction capacity were not benchmarked. Firestore request/document/time limits can prevent completion; no partial batches, cap or synthetic public collection timestamp is introduced.
- A 15-grapheme limit does not bound UTF-8 bytes or combining-mark count independently; Firestore document limits remain applicable. Numeric order exhaustion fails without writes. Runtime ICU changes can affect grapheme segmentation and require regression review.
- Ordinary client permissions remain display_order plus server-time updated_at. New metadata paths rely on existing unmatched-path denial. Admin transaction tests do not verify Rules; client HTTP tests and the separate Rules regression provide the recorded Rules evidence.
- The CLI warns about existing ADC and the firebase-functions baseline being older than latest. Tests use guarded local/demo services; no dependency upgrade, deployment, billing/IAM change, cloud fixture write or cloud resource alteration occurred.
