# Slice 5 — Workspace runtime implementation

4 November 2026. Implementation continues from committed Rules checkpoint
`0c8db30`. Slice 5 remains open for release coordination and hosted acceptance;
Slice 4 remains on hold. This checkpoint does not authorize publication.

## Subsequent release preparation

The owner requested a dev deployment and explicitly selected app0.2.0 with older
clients blocked. [Release preparation](05-workspace-provisioning-release.md)
assigns revision2/serverRelease2 and records the coordinated rollout/rollback
floor. Earlier0.1.0/pending-version statements below describe the prior checkpoint;
cloud publication and acceptance are recorded separately in deployment evidence.

## Implemented behavior

- The Auth entry declares the nine workspace schema families. Account deletion is
  read-only. Auth, compatibility reads and provisioning share one Firebase runtime
  and database; provider-status checks and linking are not provisioning prerequisites.
- A guarded transaction adapter executes the accepted 24-stage receipt chain and
  final completion transaction against the finalized initialization Rules.
  Existing receipts preserve the first committed profile/timezone. Resume validates
  committed records and name guards; completed accounts validate required records
  without restoring intentionally removed ordinary defaults.
- Concurrent clients reconcile committed receipts after conflicts/uncertain results.
  Initialization never resets an inconsistent workspace or replaces another
  client's committed proposal. Transactions use bounded SDK retries.
- The controller binds work to UID, session generation and admission. Gate loss,
  Logout, account changes, disposal and deletion fences retire late results and
  stop new writes. A submitted SDK call may still commit; subsequent admission
  checks authoritative state before resuming. Cancellation does not undo a commit.
- Each operation has a 20-second UI deadline. An unsettled SDK call stays serialized;
  retries remain disabled until it settles. There is no automatic error retry loop.
  Unknown write acknowledgement requires explicit server-state checking.
- Loading/progress, ready, unavailable/inconsistent/uncertain recovery, explicit
  timezone selection, explicit omission of invalid optional profile fields and
  deletion-fence presentation are wired into the signed-in view. Persisted profile
  data replaces provider-display data. Logout remains available; sign-in-method
  controls appear after workspace readiness. No Tasks or navigation are simulated.
- All 22 starter icon keys have pinned, self-hosted SVG assets and an Apache license.
  The manifest records byte hashes and upstream commit. Style is Rounded,
  unfilled, weight400, grade0, optical24. Stored legacy semantic keys
  `local_grocery_store` and `business` resolve respectively to Rounded
  `shopping_cart` and `apartment`; schema/seed values are unchanged. Future
  classification presentation can use `/icons/material-symbols-rounded/{key}.svg`.
  No remote font or runtime icon request is required. See the
  [official repository](https://github.com/google/material-design-icons/tree/10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7).

## Verification and practical limits

The accompanying [machine evidence](05-workspace-provisioning-implementation-evidence.json)
and [execution log](05-workspace-provisioning-implementation.log) record the final
local run and source hashes. Production initialization Rules are exercised locally;
this does not establish deployed Rules or real-provider acceptance.

- 364 unit/component tests passed; two occupied-preview preflight cases excluded.
- 70 distinct integration cases passed:58 unchanged cases in the combined run,
  plus12 adapter cases in the final focused run. This includes production Rules,
  exact seeds, all597 timezone IDs, concurrent setup, finalization/inspection,
  resumption, first-write preservation, acknowledgement recovery and fencing.
- 49 distinct headless browser cases passed across the regression run's40 affected
  session/shared-runtime/redirect cases and the corrected workspace rerun's9 cases.
  The initial combined run had two fixture failures, not an all-green result.
- Types,47-file source boundaries, Rules generation drift, icon integrity, full
  lint/format, all four builds and browser-bundle isolation passed. Vite retains
  its500kB chunk advisory for the Firebase-containing build; no size-budget
  acceptance or code-splitting improvement is claimed here.

Verification corrected a missing Hosting-emulator dependency in the expanded
runner, a concurrent-stage observation race and a finalization/inspection race.
Real SDK fixture failures were resolved by matching the Auth emulator's project
audience, then applying the established network policy. No Rules safeguards were
weakened. Failed attempts and final focused reruns remain visible in the log.

The workspace browser fixture uses synthetic identities, plus real Firebase Auth
SDK Google/Microsoft flows against the local Auth emulator. It never authenticates
with external providers. The SDK's static `apis.google.com` iframe script is allowed;
the corrected workspace tests block unrelated external fonts/UI assets and keep
Auth/data on loopback. This is not a fully network-disconnected browser test.
Responsive checks cover 390px and1280px. Existing session,
shared Auth/Firestore and redirect-startup checks are included to assess affected
boundaries; this does not accept the held Slice4 linking feature.

Two preflight unit cases are excluded while the owner's preview5173 is running:
they intentionally invoke broad service preflight and would conflict with that
occupied port. The workspace runner independently checks its own loopback ports,
starts/stops only its services, and leaves5173 untouched.

## Remaining release gates

1. Assign the actual application version, contract revision/server release and
   client bounds/rollback floor. The source remains0.1.0; no synthetic test version
   is a release assignment. Rules cannot attest browser-code versions.
2. Review a coordinated release of client capabilities, initialization Rules and
   the database compatibility contract. The current cloud contract lacks workspace
   families, so this Auth build deliberately fails closed against it. Do not deploy
   this build alone and expect provisioning to work.
3. Explicitly authorize target-channel/cloud publication, then verify real hosted
   first-use/reload/recovery and provider paths. No cloud record, Rules, contract,
   channel or account was changed by this implementation checkpoint.
4. Owner acceptance and Slice5 closure remain pending. Slice5A deletion proof,
   operator cleanup and token retirement remain separate; clients still cannot
   create/update/delete deletion fences. Task/query execution, management CRUD,
   reorder UI and navigation belong to later slices. Due precision execution is a
   later Task/query contract, not an initialization blocker.

No staging, commit, push or deployment is included in this checkpoint.

## Main merge and staging review — 4 November 2026

The owner requested updating from main, merging and staging before further action.
Fetched main at `3dcafe25fc75f6a83d5e2244cfccfa5d8b23294d` adds accepted Slices7,
8,8A and9 documentation. The merge retains local committed Rules/readiness work
and the uncommitted runtime/manual-preview implementation. Conflicting status and
Slice5 text was reconciled without dropping either history or accepted amendments.
The four incoming slice documents match main exactly;53 restored non-document
implementation/config/asset files match the pre-merge recovery snapshot.

Slice9's future blocking onboarding stages remain required for newly enrolled
plans when that slice is implemented. They do not add Tasks to Slice5 or backfill
previously completed accounts. Runtime release gates above remain unchanged.
See also the [manual emulator preview addendum](05-workspace-provisioning-local-preview.md).
Historical implementation evidence describes its earlier source snapshot, not a
claim that every later preview/merge file has the same hash.

Post-merge types,47-file boundaries, Rules generation,22-icon integrity, lint and
format checks and364 unit/component tests pass. The two preflight cases remain
excluded while preview5173 is active;
no emulator, real-provider or cloud tests are started for this documentation merge.
All resulting changes are prepared for staged review; the merge commit, push and
dev deployment remain pending. Earlier no-staging wording describes prior checkpoints.
