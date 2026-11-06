# Slice10 — Engineering contract resolution

5 November 2026. The owner accepted Q1–Q10 and requested resolution of engineering
gaps. This companion defines implementation contracts, not implemented features
or passing production evidence. [Typed interfaces](query-contract.ts) accompany
[accepted detailing](index.md).

## E1 — Projection, precision and schema mapping

`TaskMetadata` is the evaluator's exact normalized projection. All properties are
present; absence is `null`, never undefined, an empty ID, zero timestamp or NaN.
Adapters retain full root records separately for strict source validation and
version/content comparison. The projection is not a new persisted family.

| Source | Normalization / integrity contract |
|---|---|
| Task1 | Reference normalizes to null; other fields follow the Slice7 Task codec. Nonempty fields unavailable in Task1 are not fabricated. |
| Task2 | Reference is its validated text or null; description is not fetched. Root version is the shared aggregate version. |
| Unknown schema | Block affected consumer with unsupportedSchema; no skip, repair or read upgrade. |
| Optional values | Physical nulls map to semantic null; missing required physical keys are malformed, except explicitly schema-defined legacy omissions. |
| Pause | Explicit active state plus nullable Until. Unpaused requires null Until; active with null Until is indefinite. Expiry alone changes neither. |
| Closed | Requires valid outcome and Actual End; Draft/In Progress require both null. Actual Start may be null in any lifecycle. |
| Deleted | Deleted At alone determines deletion, independently of lifecycle. |
| Category/Location | Required structural Category ID; optional Location ID. Missing catalogue targets are legal unresolved references. |

Instant contract: integer seconds in [-62135596800,253402300799], integer
nanoseconds in [0,999999999], lexicographic comparison. This covers ISO years0001
through9999; reject leap seconds, malformed instants and out-of-range values.
Signed seconds are supported here even though the older provisioning-specific
codec rejects negative seconds; do not reuse that narrower decoder for query dates.
Query schema1 instant operands keep their existing millisecond-text syntax, then
normalize losslessly to this pair. Stored Task instants can have finer precision.

Due date-only normalization requires original ISO calendar date plus the committed
exclusive expiry instant; exact-time Due has its instant. The Task writer must
preserve the original date when timezone changes. Do not recompute stored expiry
on read, and do not validate it against the user's *current* timezone. A future
scheduling codec must retain enough original input context to validate its write;
Slice10 neither introduces that writer nor guesses missing precision. Task1/2
records with null Due need no precision inference. Non-null legacy Due without an
explicit precision contract blocks interpretation until a compatible codec exists.

Grouping/filtering date-only Due uses its retained date. Instant Due uses current
workspace timezone. Sorting first compares these calendar dates, then exact-time
instants within the day, then the date-only rank. Descending reverses nonmissing
keys only. For all other dates compare the second/nanosecond pair. Text comparisons
iterate Unicode code points, not JS UTF-16 code units. Normalize/lowercase only
comparison keys, preserving stored strings. Equal selected keys use ascending
Title (normalized key, original text), then Task ID by code point. Explicit Title
descending reverses both text components, while ID stays ascending.

## E2 — Loading and confirmed reconciliation

Subscribe to the UID's complete `tasks`, `categories` and `locations` collections,
without filters, orderBy, pagination or limits. There is one subscription set per
admitted account, shared by consumers with reference counting. A settings listener
supplies timezone; query/View loading remains its existing application boundary.
Collection reads load complete roots, not a server-side field projection: metadata
must stay in roots and description in its child. Never read children per Task.

Use snapshot metadata events. A collection replacement is eligible only when both
fromCache and hasPendingWrites are false. A pending snapshot never clears a
confirmed row or changes totals. Hold that collection's last confirmed replacement
until the next eligible snapshot. Before its first confirmation it is loading.
A query whose cloud write acknowledgement arrives earlier may update confirmed
state only with an authoritative returned/read-back root and expected version;
a bare successful Promise or optimistic snapshot is not a replacement record.

The adapter's stream epoch increments on resubscription and sequence increments
for each delivered event. Reject callbacks outside the current admission/epoch;
within one stream, ignore sequences already processed. A complete replacement is
an authoritative membership set, including removals. Retain higher-version local
confirmed overlays until the stream catches up; do not resurrect a member removed
by a later confirmed complete replacement. If a root disappears while an overlay
is unresolved, force authoritative inspection before publishing ready state.

Version/content comparison uses the full validated root, not only the projection:
a description edit may increase root version without changing projected fields.
Same-version different full content is an integrity error. Lower versions arriving
from obsolete callbacks cannot overwrite state. A lower-version root in a *fresh*
server-confirmed replacement is an integrity error requiring inspection, rather
than an indefinitely ignored snapshot. Empty confirmed collections are complete.

Each collection's replacement applies atomically. Evaluate only after all three
collections have initial confirmed replacements and valid timezone. Independent
listeners are not claimed to be a globally atomic database snapshot; missing
reference groups intentionally accommodate cross-stream timing. Publish one
immutable client revision per applied batch. Catalogue arrival/rename reclassifies
rows without changing Task data. A query change reuses population without reads.

Transport loss retains authorized prior output as stale. Reconnect establishes
fresh complete replacements for all three sources before marking current again.
A fatal listener error clears current results into error and requires explicit
retry/resubscribe; an integrity/unsupported-schema error does not retain a visible
partial result. Access/fence/compatibility blocking clears all protected output
and cached roots immediately. Disposal invalidates the generation before unsubscribing.

Firebase's documented cache/pending-write behavior is the basis for these gates:
[realtime listeners](https://firebase.google.com/docs/firestore/query-data/listen).
No multi-collection point-in-time guarantee or offline synchronization is assumed.

## E3 — Calendar implementation boundary

Select `@js-temporal/polyfill` **0.5.1** for the calendar adapter at implementation,
with exact lockfile/transitive resolution and license/bundle review. Do not add
it to domain/application imports or mutate global Temporal. A dedicated calendar
infrastructure module imports it and implements CalendarPort; explicitly extend
the architecture import allowlist only for that module. Current source boundaries
allow only Firebase imports in infrastructure, so this is a required integration
change rather than an assumption that the dependency already exists.

Use ISO PlainDate arithmetic for daysBetween/addDays. Convert instants with
nanosecond precision. Resolve startOfDay using the first valid time for the named
day, earlier repeated midnight, and the next valid day when wholly skipped. Detect
skipped dates explicitly by comparing the resolved local date. Do not substitute
an arbitrary fixed24-hour duration or apply general nonexistent-clock-time
shifting to midnight (a gap may end before the shifted clock time).

The polyfill uses runtime timezone data; record browser/runtime/ICU versions in
evidence. Its package pin is not a timezone database pin or a cross-browser future
rule guarantee. Unsupported pinned workspace timezone IDs fail with recovery to
explicit timezone selection, never silent UTC. Day arithmetic or boundary results
outside0001–9999 produce dateRange. Safe-integer relative offsets can be decoded
but evaluation checks their resulting range before conversion.

Source verification: [maintainer package0.5.1](https://github.com/js-temporal/temporal-polyfill/blob/main/package.json)
and [Temporal timezone/day-start semantics](https://tc39.es/proposal-temporal/docs/zoneddatetime.html).
Installation, runtime vectors and browser bundle acceptance remain implementation
verification; no package or lockfile was changed for this detailing.

## E4 — Bounded definition processing and persistence

Resolve bounds as a distinction between retained readers and new-definition
writers. Do not silently tighten the existing schema1 decoder or drop legacy
selection IDs. Fixed selection dimensions naturally bound themselves by unique
enums (lifecycle3, paused2, closureOutcome6, importantUrgent5).

For new query definitions produced by later editors/persistence, use these
engineering limits: Category256 selections, Location256 selections,16 date
conditions per date field, and65,536 UTF-8 bytes for compact JSON.stringify of the
validated query envelope. Enforce structural IDs up to1500 UTF-8 bytes at the
persistence boundary and valid ISO dates0001–9999. Reject oversized new input
with an explicit validation error; never truncate or silently simplify it. These
are query-definition resource bounds, not limits on retained Tasks/catalogues.

Retained schema1 readers continue to accept definitions admitted by their declared
writer contract. A definition exceeding the new writer budget remains readable
and evaluable; it is not silently rewritten on navigation. Slice12 must preserve
it unchanged or explain that deliberate edits need to meet new-write validation.
Before activating those writers, measure actual existing definitions and enforce
matching byte/count checks in client and View-write Rules. Freeze that contract
in compatibility/release evidence; a new-write budget does not retroactively
prove deployed Rules or permit incompatible legacy writers.

Complete Firestore document size must be checked separately from compact JSON:
field/path/document encoding overhead is different. Its documented1MiB document,
1500-byte ID and depth20 boundaries are platform ceilings, not justification for
an arbitrarily sized query. Current Slice5 Rules only admit exact seed Views;
do not add generic View writes in Slice10. Review index exemptions for query maps
before later View writers, since indexed field values also have platform limits.
See [Firestore limits](https://firebase.google.com/docs/firestore/quotas).

## E5 — Stable identities, errors and deterministic examples

Serialize GroupIdentity as a JSON tuple with fixed discriminator/field/value,
not concatenation with an unescaped delimiter. Use complete IDs; display labels
are not identities. A recovered missing classification uses the same logical
classification identity for expansion/scroll restoration; the missing flag is
presentation metadata. The typed missingClassification variant translates to
the same classification tuple as its resolved variant. Enum/date keys are fixed
schema tokens; unavailable groups sort by ID before protected/synthetic last.

| Vector | Required result |
|---|---|
| Scope off/off; Draft A, Closed B, deleted Draft C, deleted Closed D | A only |
| Scope on/off | A,B |
| Scope off/on | A,C |
| Scope on/on | A,B,C,D |
| Closure Done selected, Include Closed off | Outcome predicate inactive; open scope preserved |
| Category filtered to Work, grouped by Category | All catalogue groups remain; only Work can have nonzero count |
| Active pause with expired Until | Paused selection matches; notPaused does not |
| Active indefinite pause | Paused matches; Paused Until Is Not Set matches |
| Date offsets -31,-30,-8,-7,-1,0,1,7,8,30,31 and null | Older; Previous8–30; Previous8–30; Previous1–7; Previous1–7; Today; Next1–7; Next1–7; Next8–30; Next8–30; Later; Unspecified |
| Same second, nanos1 and2 | Ascending1 before2; descending2 before1 |
| Missing Due versus present Due | Missing last in either direction |
| Title A/a equal normalized key | Original code-point tie A before a ascending |
| Missing Location x later resolves to Office | Task stays assigned to x; stable logical group key; label/rank updates |
| New collection has pending write and no prior confirmed snapshot | Loading; no authoritative total |

Error codes are invalidQuery, unsupportedQuery, invalidData, unsupportedSchema,
dateRange and listenerFailed. Admission blocking has separate reasons; neither
error nor loading has a numeric zero total. Stale results carry their original
revision and explicit stale status. Retry repeats authoritative reading; no hidden
repair or writer action. A fresh query error does not clear the saved definition.

## E6 — Verification ownership, targets and release gates

| Evidence | Concrete gate |
|---|---|
| Domain | Every supported field/operator, all scope rows, fixed group universes, comparator algebra/permutation invariance, partitions and all seven seeds |
| Calendar adapter | New York spring/fall DST, Sao Paulo midnight gap, Havana repeated midnight, Apia2011-12-30 skip, Kolkata fractional offset, leap/year bounds, nanoseconds and timezone changes |
| Store/adapter | Empty initial server result, cache-only/pending updates, metadata-only ack, out-of-order/old epoch callbacks, conflicting versions, removals, catalogue races, reconnect, fences and UID changes |
| Rules | UID-scoped complete list permission, cross-UID denial, current compatibility/fence admission and retained schemas; no new generic writer |
| Browser | Confirmed Task edits move rows/counts without refresh; stale/error/empty differ; Saved Views use unchanged definitions; stable origin/group restoration |
| Performance | Deterministic100/1000/10000 Task corpora,20 warmups and100 timed passes per query, every grouping plus low/high-selectivity intersections |

Set an initial acceptance target of warm evaluation p95≤100ms at1000 Tasks and
≤500ms at10000 on a recorded desktop and a recorded midrange mobile browser,
including filter/group/sort/count but excluding transport/render. These are
engineering targets to test, not measured guarantees or new Task limits. Also
record max duration, heap delta where supported, serialized root bytes and cold
load time/read counts. Report unsupported memory instrumentation rather than
inventing figures. A pass on desktop emulation alone does not prove mobile speed.
If targets fail, optimize within semantics or return the strategy/target for review;
do not silently lower completeness or add a backend.

Separate mutation-free query recomputation from adapter read counts; it must
perform zero data reads/writes. Initial load has one collection listener each for
Tasks/Categories/Locations, shared across Views; record actual reads and reconnect
cost without claiming local events equal billing. Dispose the set when its last
consumer ends, and verify no leaked subscriptions after repeated navigation.

The current checkout has no Task codec, Task metadata store or lifecycle writer.
These contracts close detailing gaps but cannot establish integration acceptance.
Implement against actual Slices7/8 dependencies; schema fixture vectors can cover
future states without shipping future lifecycle actions. Required production
Rules, dependency installation, benchmark measurements and browser/emulator
passes remain named execution gates. Held linking checks stay held; scoped local
query verification does not resume them. Cloud publication is separate.

## Resolution ledger

E1 projection/precision mapping, E2 port/completeness reconciliation, E3 calendar
adapter/dependency, E4 resource policy, E5 identities/errors/vectors and E6 test/
performance targets are specified. There are no pending alternatives requiring a
new product decision within Q1–Q10. Exact future writer persistence/Rules work
belongs to its owning slices and must obey these read contracts. Failed proofs
must reopen the affected engineering decision transparently; design closure is
not a claim that these currently unimplemented contracts have passed.


## Detailing verification — 5 November 2026

Strict standalone TypeScript6.0.3 checking ofquery-contract.ts and its imported
query types passed with exactOptionalPropertyTypes/noUncheckedIndexedAccess and
ES2022. Used the existing implementation checkout compiler without installing or
changing dependencies. Initial attempt found no local node_modules; the sibling
compiler first required --ignoreConfig, then passed. This verifies interface type
consistency only, not evaluator/calendar runtime or Rules behavior. Documentation
whitespace and relative-file links were checked. No application tests, emulator,
benchmark or hosted checks were executed; final staging is recorded in the Slice10 review checkpoint; no commit/push.
