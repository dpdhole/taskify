# Slice 5A — Domain, inventory and Rules admission checkpoint

5 November 2026. Owner instructed beginning implementation against
[DA1](contract.md), from committed baseline2edbcaf. This is the
first implementation checkpoint, not completed Delete Account or release acceptance.

## Implemented

- Provider-independent strict control codec preserves nanoseconds and rejects
  unsupported versions/states, unknown fields, malformed identifiers, inconsistent
  stages, missing verification evidence and shortened retirement deadlines.
- Trusted transition validation preserves admission fields, monotonic stages,
  record/lease generations, verification anchors and the original Auth-attempt latch.
  Recent proof uses the exact inclusive300-second boundary. Retirement remains
  explicitly disabled; checking whether a deadline is due grants no execution authority.
- Inventory1 validates exact UID-scoped paths, supported collections, actual non-seed
  IDs, reservation paths and existing workspace codecs. Unsupported descendants,
  invalid records and nonempty containers block. This is manifest validation, not
  the trusted recursive discovery/deletion implementation.
- Generated candidate production Rules admit only exact owner-created DA1 requests
  under revision>=3/serverRelease>=3, supported signed-provider/recent-auth claims,
  current policy/environment, server timestamps and immutable initial fields.
  Owner status is get-only; list/progress/update/delete remain denied.
- Provisioning/receipt/reservation writes also check post-write fence absence,
  rejecting a combined request/provisioning batch atomically. Ordinary protected
  defaults remain browser-undeletable. The local production Rules runner includes
  the new suite in both production and workspace regression modes.

## Verification

- New domain/inventory suites:96 passed.
- Local production Rules runner:95 passed across three suites (44 new deletion
  admission cases,33 existing workspace Rules,18 existing stage-integrity cases).
  Includes provider claims, missing email, rejected forged/missing fields,
  recent-auth boundaries, ownership, rollout gating, immutable intent, same-batch
  fences and distinct UID B initializing while A remains fenced.
- Full npm run verify passed:465 unit/component tests, typechecking,50-file source boundary
  check, Rules generation drift, icon integrity, lint/format, four build modes and
  browser bundle checks. Vite retains its existing large-chunk advisories.
- git diff --check passes. No new browser/provider/cloud execution evidence.

Initial sandboxed emulator startup failed to bind its hub. The authorized local
run outside sandbox restrictions started successfully. Its first compilation found
a generator replacement-string bug: the UUID regex's dollar/single-quote sequence
expanded JavaScript replacement syntax. Callback replacements fixed it. Initial
typechecking also caught an unknown-to-string narrowing issue and the test library's
narrow provider union; lint caught an unused fixture ID. All were corrected before
the passing runs above. These failures are not hidden as successful test evidence.
The runner shut down its own emulators; the existing preview5173 was preserved.

## Remaining implementation

Next build the isolated operator package and recursive discovery/transactional
cleanup, then deletion proof/token transfer, request adapter/controller and UI.
The state codec is not a concurrency lock or operator implementation. Durable Auth
reconciliation, real re-registration, T7 retirement safety and coordinated release
remain unimplemented/unverified. T1/T3/T4 have partial local evidence only; T1–T8
are not accepted as complete. Slice4 remains held.

App/package version and current compatibility configuration remain0.2.0/revision2;
no candidate0.3.0 publication has occurred. No real account deletion, credential
provisioning, cloud action, staging, commit, push or deployment is included.
