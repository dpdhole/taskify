# Slice 10 — Complete query engine

5 November 2026. Owner accepted Q1–Q10. Accepted prior semantics remain controlling;
[engineering resolution](10-query-engineering.md) supplies concrete implementation contracts. No
implementation, held-test release or publication is implied.

## Refreshed source baseline

Review began at5d560ea and first synced to02458ff. Final review integrated main
through8dbe29b, including Slice5 deployment, owner verification and closure.
Slice5 app0.2.0 is deployed to dev and owner-accepted/closed; see its
[closure record](05-workspace-provisioning-closure.md) and
[deployment evidence](05-workspace-provisioning-preview.md). No new deployment
or owner verification was performed by Slice10 detailing.

Foundation is complete; Slice2 owner closure review remains pending; Slice3 is
owner-accepted. Slice4 remains open/on hold. Slice5A and Slices6–9 (including8A)
have accepted detailing but remain unimplemented. Slice10 Q1–Q10 are owner-accepted
and E1–E6 contracts resolved. Overall feasibility remains INCONCLUSIVE.

Historical README and checkpoint text must not override later dated evidence.
See [status](../project_status.md), [plan](../implementation_plan.md),
[Slice5 runtime evidence](05-workspace-provisioning-implementation.md) and
[Slice9 design closure](09-onboarding-tasks-manual.md).

## Accepted scope

Implement the complete structured query evaluator over complete lightweight Task
metadata, with predicates, mandatory grouping, deterministic per-group sorting,
counts and calendar/timezone semantics. Keep domain evaluation independent of
React, Firebase and browser APIs; supply clock/timezone and validated inputs.
Establish integration with the shared metadata store and completeness/recovery
contract, rather than evaluating only currently rendered rows.

Slice11 owns query controls, counts presentation, collapsed groups and richer rows;
Slice12 owns Save/Save As/Reset persistence workflows; Slice13 owns Search UX;
Slice14 owns View management. Dashboard charts remain Slice22. Lifecycle writers
remain Slices15–17 and deletion workflows remain later slices. Query support for
those metadata states must be testable without exposing future actions. Slice10
must not silently absorb those interfaces or mutate Tasks while evaluating.

## Accepted baseline to carry forward

- Query schema1 is already decoded by `src/domain/workspace-query.ts` and seeded
  by `src/domain/workspace-seeds.ts`. Validation/storage is implemented; execution
  is not. Reuse the contract and explicitly review any required schema change.
- Include Closed and Include Deleted independently expand scope: neither means
  open/nondeleted; Closed only means all nondeleted; Deleted only means all open;
  both means all Tasks. Deleted state derives solely from Deleted Date.
- OR within a selected dimension; AND across dimensions and date conditions.
  Grouped fields remain filterable. Empty selections remove a filter; persisted
  empty or duplicate selections and unknown tokens are invalid.
- Closure outcome is filter-only, retained but inactive while Include Closed is
  off. Important/Urgent groups are Do First, Schedule, Delegate, Eliminate and
  Unclassified (either value Unset), in that order.
- All matching Tasks belong to exactly one group; group counts sum to total.
  Retain zero-count groups. Category/Location group order follows global ranks;
  synthetic Unspecified Location is last and is not a Location record.
- Date groups: Older, Previous8–30 days, Previous1–7 days, Today, Next1–7 days,
  Next8–30 days, Later, Unspecified. Use calendar days in workspace timezone,
  chronological group order independent of Task sort direction.
- Capture one now/timezone per evaluation. Relative operands remain relative.
  Before is exclusive, On or After inclusive, Between is half-open with same-kind
  boundaries. Separate absolute/relative conditions may form an empty intersection
  at runtime without invalidating or rewriting the definition.
- Due v1 filters are day-based for date-only and exact-time values. Date-only Due
  uses its selected calendar day rather than next-midnight expiry. Instant Due
  operands are unsupported. Missing sort values remain last in both directions.
- Structurally valid archived/missing IDs remain in queries. Invalid data is not
  silently coerced to Unspecified. Preserve all seven approved seed definitions.

Authority: [product specification §§17.5–17.8](../product_spec.md),
[Slice5 query contracts](05-workspace-provisioning.md#accepted-query-validation-policy--4-november-2026),
[Slice7](07-quick-create-basic-list.md) and [Slice8](08-task-detail-metadata.md).

## Engineering contract coverage

| Item | Required outcome before implementation acceptance |
|---|---|
| Input/output contract | Exact normalized Task metadata, supported Task versions, date precision/null handling, group identities, ordered Task IDs, counts and explicit completeness/error state |
| Complete population | UID/admission-scoped loading and listener strategy, snapshot authority, partial/offline/stale presentation, deletion/removal reconciliation and cleanup on access loss |
| Group catalogue | Lifecycle order; archived/missing classification labels and order; zero groups under filters; protected Uncategorized and synthetic Unspecified placement |
| Total sorting | Every supported field's comparator, tri-state/combined preference order, name versus global-rank sorting, Title tie-break reuse, date-only/exact-time comparison and stable ID ties |
| Date precision | Concrete Task precision codec, instant precision preservation, timezone changes, DST boundaries, skipped/repeated local times/days and supported-range overflow behavior |
| Reevaluation | Midnight, workspace-timezone changes, resume/reconnect, clock changes, metadata and catalogue/rank updates; one coherent result revision |
| Pause semantics | Use explicit pause state independently of Until expiry; pin indefinite pause and Paused Until absence behavior without inventing auto-resume |
| Validation/recovery | Query resource bounds, unsupported versions, malformed Task/catalogue data and unresolved references; distinguish invalid definition, incomplete input and legitimate zero results |
| Cost/performance | Representative retained populations, reads/listeners/retries, memory and evaluation latency; measured targets without an invented account cap |
| Acceptance authority | Relevant unit/adapter/store/browser/security checks and benchmarks; identify authorized local checks separately from held linking tests and cloud actions |

The controlling [E1–E6 contract](10-query-engineering.md) resolves these design
items. Actual implementation and passing evidence remain required.

## Evidence to require

Cover all scope combinations, every predicate/operator and their intersections,
all seven seed queries, missing/null values, independent tri-state preferences,
archived/missing references, every grouping/sort direction and deterministic ties.
Prove exact partition/count invariants and zero groups. Exercise date boundaries,
DST and timezone changes, nanosecond-sensitive timestamps, relative/absolute empty
intersections, midnight/resume and date-only Due interpretation. Include complete
population versus partially loaded/rendered subsets, mutation-driven movement,
listener failure/recovery, access revocation and UID switching. Benchmark complete
retained metadata; document failed attempts and practical limits. Design detailing
can proceed now; end-to-end acceptance depends on actual Task/store dependencies.

No application tests were run for detailing. Final staging is recorded below;
no application source, deployed resource, account or release artifact was changed.

## Accepted detailing — Q1–Q10, 5 November 2026

The owner accepted all recommendations below on 5 November2026 and requested
engineering gap resolution. They refine the accepted baseline without changing the slice order. Engineering interfaces shown
here are semantic contracts, not a final persisted Task schema.

### Q1 — Evaluator boundary and result contract

Use a pure evaluator supplied with a validated query, an immutable complete Task
metadata snapshot, Category/Location catalogues, and one captured clock/timezone
context. Inputs belong to one UID and admission generation. Domain code receives
plain values; SDK snapshots and timestamps are translated at the adapter boundary.

The normalized Task projection includes stable ID, supported schema/edit version,
Title, Reference when introduced, Category ID, optional Location ID, lifecycle,
Important/Urgent tri-states, explicit active-pause state, closure outcome and the
seven supported dates. Description, receipts, Discussion, Todos and Activity are
not loaded for evaluation. Do not infer pause from Paused Until presence or expiry.

Return an ordered sequence of groups with stable group key, label descriptor,
ordered Task IDs and count, plus total matching count and input/query/context
revision. Stable keys use field plus enum/record/bucket identity, never display
names or array positions. Results contain references to the same normalized Tasks,
not independent mutable Task copies. Require unique Task IDs at input.

Apply scope → structured predicates → partition → per-group sort → counts. Counts
come from the partition, not a separate approximate pass. Evaluating does not
write data, advance schemas, reset Views or append Activity Events.

### Q2 — Complete population and admission

Recommend one shared, UID-scoped metadata subscription to all retained Task roots,
including Closed and deleted roots, while an admitted query consumer needs it.
This gives one reusable population for all scope combinations and avoids a new
network query for each filter/group/sort change. No per-Task detail reads. Measure
its retained-volume costs before acceptance; a narrower completeness-preserving
strategy may replace it only with explicit review and equivalent evidence.

The application port emits replacement/delta batches with authority, pending-write
status and generation. Initial readiness requires a server-confirmed complete Task
snapshot and complete required catalogues. Cache-only data, a first page, limited
query or rendered subset cannot produce a ready total. Do not use a query limit
or silently omit records to satisfy a performance target.

Publish Task changes and derived result/count changes in one store revision after
validation. Listener-confirmed changes and cloud-acknowledged local mutations share
one version-aware reconciliation path. Pending optimistic SDK documents do not
enter confirmed counts. Deduplicate acknowledgement/listener races; ignore older
record versions and reject conflicting content at the same version as an integrity
error requiring authoritative reload. A confirmed removal is a removal, not an
instruction to recreate the Task.

Use explicit loading, ready, stale/reconnecting, blocked and error states. After
transport failure, retain the last authorized result with a stale indicator but
never label it current or replace it with a zero count. A retry rebuilds complete
state before ready. On Logout, UID change, compatibility revocation, confirmed
permission loss or deletion fence, immediately remove visible protected results,
dispose listeners and invalidate callbacks. Same-UID reentry uses fresh admission.

### Q3 — Group catalogue and unresolved references

Recommend constructing the group universe before filtering: all known active and
archived Categories/Locations, all fixed enum groups or all eight date buckets.
Keep groups even when their current filter intersection has zero Tasks; filters
do not silently remove sections. Archived labels remain readable and marked.

Category order uses numeric global rank then stable ID, with protected
Uncategorized forced last. Location uses rank then ID, with synthetic Unspecified
last. For structurally valid references whose records are missing after complete
catalogue loading, retain one separate group per missing ID labelled Category
unavailable / Location unavailable. Place these after known ordinary records,
ordered by ID, before the protected/synthetic last group. Never merge them into
Uncategorized/Unspecified or rewrite the Task. Reappearance restores its real label
and rank. Missing IDs referenced only by query filters are retained in the query;
materialize their zero-count groups as well. An incomplete catalogue is loading,
not evidence that a referenced record is missing.

Lifecycle group order: Draft, In Progress, Closed. Important/Urgent uses the
accepted five-group order. Date groups use the accepted eight-bucket order. Group
order never reverses with per-Task descending sort. Closure outcome, paused and
individual Important/Urgent are not additional Group By fields in query schema1.

### Q4 — Total sorting table

All directions apply to the selected primary key only. Equal primary keys use
the accepted ascending Title comparator, then stable Task ID. Missing primary
values stay last in both directions; reversing a comparator must not move them
first. Title ordering reuses Slice7: NFC lowercase Unicode code-point key, then
original Title by code-point order, then ID, without device-locale collation.

| Sort field | Accepted primary key |
|---|---|
| Title | Accepted Title comparator; direction reverses its text comparison, ID stays ascending |
| Category / Location | Current name using the same normalized text comparison; original name then classification ID; global rank is for group order only |
| Lifecycle | Draft, In Progress, Closed |
| Important/Urgent | Do First, Schedule, Delegate, Eliminate, Unclassified |
| Created / Planned Start / Actual Start / Actual End / Paused Until / Deleted Date | Exact normalized instant, preserving stored sub-millisecond precision |
| Due | Day in workspace timezone first; within a day exact-time values by instant, date-only values after all exact-time values in ascending order |

For classification sorting, actual missing references and absent Location sort
last; deterministic missing-ID keys break their ties before Title. Uncategorized
is a real named Category and sorts by name when used as a Task sort key. Synthetic
Unspecified is semantic absence, not alphabetically compared display text.

Due sorting is a material recommendation: a date-only deadline occupies the end
of its selected calendar day, consistent with exclusive next-midnight expiry.
Descending reverses nonmissing primary keys, including that precision ordering.
Tasks with no Due always remain last. The owner accepted this mixed-precision
comparator with Q1–Q10.

### Q5 — Dates, precision and timezone boundaries

Preserve instants as seconds plus nanoseconds (or an equivalent lossless plain
representation), not JavaScript millisecond numbers. Use a discriminated date-only
Due value retaining its originally selected calendar date; never recover precision
by testing whether a timestamp happens to be midnight. Exact storage keys and
Task schema rollout must align with the Task writer/deletion contracts before
coding. This proposal does not add scheduling controls or migrate Tasks.

For instant-backed fields, calendar and relative operands resolve to the start
of their named day in the workspace timezone; exact operands compare as instants.
Due comparisons instead project both Task Due and operands to calendar dates.
Between is `[from,to)`; missing dates fail comparisons and satisfy only Is Not Set.
A set date satisfies Is Set. Group dates by signed calendar-day difference from
captured today, using date arithmetic rather than elapsed hours divided by24.

Recommend a timezone resolver with an explicit, tested rule: day start is the
first valid instant in that local calendar day; if midnight repeats, use its
earlier occurrence. A wholly skipped day resolves to the next valid day start;
a range whose resolved boundaries coincide matches nothing. Date-only Due keeps
its selected date even for a skipped local day. Unsupported/out-of-range resolved
dates produce an evaluation error, never clamping, UTC fallback or Unspecified.
E3 selects @js-temporal/polyfill0.5.1 for the calendar adapter; installation and
runtime/bundle verification remain implementation work.

### Q6 — Reevaluation and coherent revisions

Reevaluate on confirmed Task changes, query changes, catalogue rename/archive/rank
changes, workspace timezone changes and crossing local midnight. Also recapture
now on focus, visibility resume and reconnect to recover missed timers and clock
changes. Recommend checking the local-day/timezone context at least once per
visible minute; recompute only if its day/context changes. No elapsed-time polling
causes data writes. Timers/listeners stop with the consuming admission lifetime.

Capture now once per pass; use that same anchor for all relative filters and date
groups. Do not publish a partially recomputed result. If worker/background work
is later needed, results publish only when UID, generation and all input revisions
still match. Expired pauses stay paused until explicit Resume; midnight does not
invent lifecycle transitions. Date-arrival behavior remains display/evaluation only.

### Q7 — Validation and failure boundaries

Reuse the existing strict query decoder and querySchemaVersion1. Unsupported
schemas get an explicit unsupported-query state with recovery to a separately
chosen valid View; no automatic saved-query replacement. Reject malformed Tasks,
invalid dates and duplicate catalogue/Task identities before ready evaluation.
Recommend blocking the affected consumer rather than showing silently reduced
results. Distinguish that integrity error from legitimate missing references and
from a valid query whose intersection happens to be empty.

E4 specifies selection/condition/payload bounds and E1/E3 the date range. Actual
persistence/Rules enforcement and budget checks remain implementation gates. Prove existing
seed queries and accepted saved data stay valid. Query edits, Search and View
management must not gain writes through the evaluator.

### Q8 — Integration and user-visible slice boundary

When Task/store dependencies exist, replace the minimal All Tasks evaluator with
this shared engine and connect navigation to the six provisioned Saved View
queries using existing read-only query definitions. Recommend showing their
actual results through the established list shell while controls remain Slice11
and persistence actions Slice12. Do not expose Save, chart, Search, lifecycle or
management actions prematurely. If navigation integration would require a new
interaction beyond accepted Slice6/7 contracts, return that interaction for review.

Counts and groups update reactively after confirmed changes. Existing Task Detail
origin/search/group/scroll contracts remain intact; moving or disappearing Tasks
must not cause a forged origin or a mutation. Retain stable group identities so
Slice11 and later chart drill-down can target them without temporary filtering.

### Q9 — Acceptance and measured cost

Require table-driven predicate/scope/date/comparator vectors and partition/count
invariants, including permutation independence, no duplicate membership and stable
ties. Verify all seven seed queries against one mixed population. Adapter/store
checks cover initial completeness, pending writes, catalogue races, removal,
acknowledgement order, revocation, stale recovery and old-generation callbacks.
Browser evidence covers reactive movement and counts, load/error/empty distinctions,
resize and origin restoration using implemented Task dependencies.

Benchmark cold loading separately from warm evaluation using representative100,
1000 and10000 retained roots, varied selectivity and worst-case catalogue/group
counts. Record environment, payload bytes, reads, listeners, memory and median/p95
evaluation time, including midnight/context reevaluation. These sample sizes are
measurement points, not supported-volume promises or account limits. Propose
acceptance thresholds from results and intended browser hardware before closure;
if full retention loading is impractical, return the strategy for review rather
than silently truncating. No new backend, billing tier or speculative cap.

Focused pure checks can be planned independently. Shared Auth/provider/redirect
and held Slice4 regression scope still require applicable authorization before
execution. Local proof does not establish live indexes, real-provider behavior,
billing or overall Firebase feasibility. No tests are executed by detailing.

### Q10 — Documentation, compatibility and closure

Update the evolving manual and newly enrolled starter guidance to explain only
released query behavior; preserve no-backfill/no-overwrite rules. Query meaning
changes require explicit schema/version compatibility review, not silent seed
rewrites. Adding an evaluator alone introduces no persisted family, operation
receipt or Activity Event; any new metadata writer must separately extend Rules,
client capability, rollback and trusted cleanup inventory.

Design closure is recorded by owner agreement on Q1–Q10, including full-retention
loading, missing-reference groups, total sort/precision, timezone edge policy and
read-only Saved View integration. Implementation closure additionally requires
concrete Task codec/port/Rules integration, enforcement of the resolved
resource bounds and pinned calendar dependency, measured results against targets
and passing applicable evidence.
Slice5 is separately owner-accepted; Slices5A–9 implementation is not implied.
Final staging is recorded below; no commit/push or cloud action.


## Design closure and engineering resolution — 5 November 2026

Q1–Q10 are owner-accepted. Proposal/review wording inside their original rationale
is historical and does not leave those alternatives open. The controlling
[engineering contract](10-query-engineering.md) resolves E1–E6: exact projection,
confirmed population reconciliation, calendar adapter/dependency, definition bounds,
identities/errors and validation/performance targets. [Typed interfaces](10-query-contract.ts)
are documentation artifacts and do not implement Task persistence or evaluation.
No remaining product decision is identified within this accepted scope.
Implementation, actual Rules/adapter/calendar proofs, retained-volume benchmarks
and browser acceptance remain required; no success is inferred from typechecking
an interface. Slice4 remains held and cloud actions remain separate.


## Final review and staging — 5 November 2026

Owner requested completion and staging for commit/push. Eight files cover accepted
detailing, engineering/typed contracts and README/status/plan/specification/
architecture alignment. Main through8dbe29b is integrated, including Slice5 closure.
No new product decision remains open in this scope. Runtime proofs, dependency
installation, writer/Rules enforcement, measured benchmarks and browser acceptance
are explicit implementation gates.

Strict TypeScript6.0.3 contract checking, relative-file/anchor checks, conflict-marker
and whitespace review pass. No application tests/builds, emulator, provider/cloud
checks or deployment are performed. Suggested commit:
`docs: accept Slice 10 query engine detailing and engineering contracts`.
Staging prepares review; no commit or push is performed by this request.
