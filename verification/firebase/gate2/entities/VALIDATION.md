# Gate 2 local validation — entity authorization and integrity

**Verdict: PASS for the represented local Gate 2 contracts, with the owner-accepted client-only NFC/grapheme limitation.**

Final run: **147 tests passed, zero failed, zero skipped/cancelled**, exit code 0. The suite includes 101 carried-forward Gate 1/fixed-India date/display tests and 46 Gate 2 behavior tests. One Gate 2 test deliberately confirms the accepted client-policy bypass; test totals are not a claim that every behavior is adversarially server-enforced.

## Authority, scope and provenance

- dpdhole/taskify main HEAD remains `38a7fb7383ae99948f003d68fe7d77e8e4b20dfa`, clean before/after. Repository docs were read; §17–18 govern supersessions. docs/decisions.md is absent at this commit.
- User authorized proceeding to Gate 2, then explicitly accepted client-enforced NFC normalization and grapheme limits for PoC/beta. See ACCEPTED-NAME-POLICY.md.
- Isolated workspace: gate2/entities, outside the Git checkout. Prior Gate 1/date and Gate 2 failing-name artifacts remain unchanged. No authoritative specifications, legacy file or application code changed; no commit, push, provisioning or deployment.
- Emulator only: demo-taskify-gate2, Firestore 127.0.0.1:8080, UID authentication fixtures. No real Google sign-in/cloud database. No Functions, hosted API or paid runtime service.

## Execution record

| Run | Passed | Failed | Interpretation |
|---|---:|---:|---|
| Integrated carried-forward suite | 101 | 0 | Existing Task/event/date behavior with classification bootstrap. |
| Initial child-effect run | 120 | 6 | Valid scheduled-task implicit activity exceeded the 1,000-expression limit. |
| Expanded entity run | 137 | 0 | Date-check optimization plus classification/View tests. |
| Child-pointer/default/settings refinement | 144 | 0 | Version-bound effects prevent replay/piggyback writes. |
| Budget/reference extension before tooling repair | 146 | 1 hook failure | All 146 assertions passed; full coverage export exhausted emulator Java heap. The after hook failed and its stalled worker was stopped. |
| Final complete run | 147 | 0 | Bootstrap read-budget refinement, race-safe provisioning adapter, normal cleanup; full coverage export removed. |

Exact names/status: test-inventory.md. Final raw TAP/denial diagnostics: gate2-final.log. Intermediate failed logs are retained, including gate2-coverage-failure.log. No failed domain/security assertion was changed into a passing diagnostic except the separately and explicitly accepted name-policy limitation, documented before this continuation.

The final suite does not export the emulator's large per-value coverage trace. Earlier attempts produced hundreds of megabytes of trace data and eventually Java heap exhaustion. Functional/security assertions, actual rejection error codes and budget sweeps remain intact; no final comprehensive coverage percentage or exact per-request expression maximum is claimed.

## Candidate write model

The retained user-scoped Task and immutable Activity Event model adds categoryId, optional locationId, linkCount and lastEffect. Every audited child mutation uses a single client batch containing:

1. Child create/update/delete.
2. Task version increment, request-time updatedAt, version-bound lastEffect pointer, any lifecycle/Actual Start change, and link-count change where applicable.
3. New version-derived immutable event with exact pre/post Task snapshots. Todo/link events also contain validated pre/post child snapshots, preserving rename/closure history.

Rules require the child effect from the Task side and the matching Task mutation from the child side. The lastEffect pointer includes the new Task version; an old pointer cannot authorize a child edit by piggybacking on an unrelated Start event. One root effect cannot authorize an additional sibling write. Missing child/Task/event writes fail atomically.

This probe deliberately serializes child creates and Todo/link mutations through Task/event writes, even when lifecycle is unchanged. It is a feasibility contract, not final approved audit granularity or a production cost optimization. Discussion text edits/deletes use their edit window without another Task mutation. Reducing required writes later would need its own adversarial regression validation.

## Discussion and Todo evidence

- Owner-only child reads/writes; missing parent, foreign/anonymous access, forged owner/Task references and protected timestamps denied.
- Comment/link creation and Todo completion correctly handle unpaused Draft, paused Draft, scheduled InProgress with empty Actual Start, and paused InProgress. Paused Draft stays Draft with no Actual Start. Paused InProgress can acquire Actual Start without clearing Pause. Todo creation/reorder/rename do not start work.
- Valid child mutations require all three writes. Missing/mismatched components leave Task, child and event unchanged. Competing same-version child requests commit one effect. Stale writes are denied.
- Closed/Deleted Task content is read-only. Todo rename/reorder/delete require an open Todo; Close sets request-time closedAt, Reopen clears it. Reopen preserves the Task's original Actual Start. Repeated Close is denied.
- Todo supports no comment/attachment/entry fields or nested collections. Activity Event attachments and arbitrary user posts remain denied. Discussion links live separately from comment text; only HTTP(S) strings are allowed.
- Link counter is protected, starts at zero, changes with the referenced create/delete and is bounded at ten. Eleven-link attempt and forged counters fail. Link edit/remove requires the paired audit operation.
- Comments can be edited/deleted within the server-time window. Fresh edit/delete succeeds; a 31-minute-old fixture is rejected. Original creation time, owner/Task reference and task-version marker are immutable. The rule uses a strict `< createdAt + 30 minutes` cutoff; exact equality was not experimentally injected.
- Comment text is a plain string with no prototype character cap; a 12,000-character text body is stored. The test demonstrates data representation, not browser rendering/XSS safety. Normal frontend text escaping remains implementation work.
- Rules-disabled access is used only to age one comment fixture for expiry testing. All tested mutations use client SDK Rules evaluation; no production Admin bypass is introduced.

## Classifications and name reservations

- Supported adapter normalizes NFC/trim, checks 1–30 grapheme clusters and creates a lowercased key. Rules enforce the trim/lower relationship, ownership, field shape, timestamps/version and SHA-256 reservation-ID correspondence. They do not enforce NFC/graphemes, as accepted by the owner.
- Entity creation requires its name reservation and append to a versioned order registry. Rename atomically creates a new reservation and releases the old one. Missing/forged guards, wrong hashes and independent guard deletion fail.
- Literal/case-only duplicate and competing same-name claims yield one entity/reservation/order entry. Archived names remain reserved. Category/Location deletion is denied; archive and global ordering preserve existing Task references.
- Uncategorized uses a stable experimental id and fixed label/icon (`uncategorized`, `Uncategorized`, `label`), cannot be renamed/re-iconed/archived/deleted, and its name cannot be assigned to an alias record. Category/location order accepts permutations, rejects duplicates/phantoms and checks versions.
- New Task references require active same-user classifications and the permanent default Category. Changed assignments use getAfter(): selecting a classification that is archived by the same batch fails and rolls back both writes. Existing archived references remain editable; optional Location can be cleared.
- No Location starter list is required. The test schema does not model optional latent coordinates or a production icon catalogue; those remain slice design.

## Saved Views, ordering and settings

- Initial bootstrap is one nine-document request: six ordinary presets, All Tasks, a versioned global View order and an immutable provisioning marker. Marker Rules verify exact initial names/query definitions, default Home inclusion and order. Missing/forged presets, missing marker/order and partial provisioning are denied with no residual Views.
- All seven initial Views appear on Home. All Tasks name/query/Home inclusion/update/delete are protected. Its position in global ordering is movable.
- Ordinary presets and custom Views can be renamed/reconfigured/hidden/deleted. New custom Views append to the registry with Home enabled. Deletes remove their order entry atomically and do not change Tasks.
- Group By is required; None/Closure Reason grouping are not accepted. Query flags/types, closure-reason values and sort fields/directions are checked. Inactive Closure Reason selections can remain stored when Include Closed is false. Search/task-ID membership cannot be persisted as extra definition fields.
- Query model is a minimal persisted-definition probe: grouping, sorting, Include Closed/Deleted, closure reasons and Deleted Date presence. It is not the full filter engine, all date buckets or complete eligible-population query plan; those remain Gate 4/slice implementation.
- Foreign/anonymous access, stale View edits, duplicate order IDs, phantom membership and removal of All Tasks are denied.
- Racing bootstrap leaves one complete set. The supported ensureViews helper checks the server marker, handles a competing completed bootstrap, and never resets renamed/deleted/reconfigured ordinary presets on retry.
- Owner preference fixture (view-discard warning) uses an independently versioned settings record. Cross-user reads/writes, stale updates and using preferences to override the fixed app timezone are denied. A complete production Settings schema is not claimed.

## Rules access/expression limits

- Initial scheduled-child failures came from revalidating unchanged structured dates on every Task update. Final Rules revalidate planned-date maps and ordering only when plannedStart/due changes. Existing records start valid, and operation-specific changed-field whitelists prevent unrelated writes from altering those fields. All carried-forward date forgery tests still pass.
- Final log has no 1,000-expression-limit diagnostic. This is finite execution evidence, not a measured expression-headroom number for future code.
- Source-level conservative bound for represented Todo edit/close/reopen: at most nine document-access calls in the Task rule, three in the child rule and two in the event rule, before caching (14 total). Each operation is below ten; the single-aggregate request is below twenty.
- Initial provisioning uses seven View-side order reads, eight marker-side post-state reads, and one order-side marker read: **16 conservative lookups**, at most eight in one operation. Version-zero order state can exist only alongside the complete initial set; removing an ordinary seed increments order version, so it cannot be recreated through the bootstrap branch without normal append checks. The marker's exact-definition checks secure the initial branch. No assumption that different requests share a timestamp is used.
- Measured two-document Task/event sweep: 1–9 pairs accepted; 10–12 rejected with no partial writes (`budget-evidence.json`).
- Measured three-document Todo/Task/event sweep: **1–6 groups accepted; 7–8 rejected**, every rejected Task at version 0 with no child/event (`child-budget-evidence.json`). This is emulator/cache behavior, not a supported production bulk size. Use one Task aggregate per normal operation.
- Source size is approximately 25 KB, below the published source limit. Compiled production policy size and deployed performance have not been measured.
- Official mechanisms/limits: https://firebase.google.com/docs/reference/rules/rules.firestore and https://firebase.google.com/docs/firestore/security/rules-structure#security_rule_limits . Hash conversion API: https://firebase.google.com/docs/reference/rules/rules.hashing and https://firebase.google.com/docs/reference/rules/rules.Bytes .

## Remaining boundaries and next gate

Spark remains feasible for the demonstrated Gate 2 mechanism under the accepted name-policy limitation and existing fixed-India date scope. No trusted backend, Function or paid service was necessary. This is not a formal proof over all requests, production approval, Google Auth validation, full cross-device UI test or complete platform feasibility result.

Gate 1 boundaries remain: India-only timezone experiment, no general IANA/DST support, no global semantic exactly-once intent across distinct valid commands, full snapshot payload/document-size costs to assess, and creation-event policy not finalized. Relative date calculations, all metadata fields and final provider-independent adapter contracts remain implementation work.

Gate 3 permanent deletion/recovery has NOT started. Current Rules deny Task/classification hard deletion; subcollection cascade, idempotent purge, partial-failure recovery and no-cost export/restore remain unvalidated. Gate 4 real authentication, complete queries, Spark quotas/index costs and deployed behavior remain unvalidated.

The local experiment's schemas, additional child audit granularity, field/id choices and settings subset are proposals. Production changes, authoritative specification updates, commits and deployment still require separate authorization. The accepted Unicode limitation itself is already authorized and is not being asked again.

## Reproduction and artifacts

Final command: `./run.ps1` in this folder. It locates portable runtimes/emulator cache under gate1 and runs both test modules against demo-taskify-gate2. Expected final result: 147 passed, exit 0. No live Firebase project/login required. A dependency junction points at the existing test installation; binaries/node_modules are omitted from the ZIP.

On another machine use Node 22, Java 21, `npm ci`, then `npm test`; inspect runtime paths in run.ps1 if using it. Pinned runtime/tool versions: Node 22.16.0, Java 21.0.12.1, Firebase 11.10.0, Rules Unit Testing 4.0.1, CLI 14.27.0, CLI-selected emulator 1.19.8. Prior development-dependency audit findings were not remediated by this scoped experiment.

Source: firestore.rules, names.mjs, views.mjs, planned-dates.mjs and tests/. Evidence: gate2-final.log, exact test inventory, access-budget JSONs, transaction/travel evidence, file hashes and intermediate failure logs. Full final coverage export is intentionally absent because of the documented heap failure.
