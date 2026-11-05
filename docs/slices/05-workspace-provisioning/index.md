# Slice 5 — Workspace provisioning

Status: **owner-accepted and closed, 5 November 2026**.
See the [closure record](closure.md).
App0.2.0, contract revision2/serverRelease2 and initialization Rules were published
from clean pushed02458ff. See the [deployment report/evidence](preview.md)
[owner verification](acceptance.md) and
[runtime checkpoint](implementation.md). Earlier dated
checkpoints below are historical. Slice5 is closed; Slice4 remains on hold.
Linking is not a provisioning prerequisite. No further promotion is authorized.

Authority: [product specification](../../product_spec.md),
[architecture](../../architecture.md), [slice plan](../../implementation_plan.md),
[Slice 3](../03-provider-sign-in/index.md) and [Slice 4](../04-identity-linking/index.md).
This amendment supersedes the earlier absence of a required starter Location list
and resolves the previously open starter Category catalogue.

## Initialization policy finalized for commit — 4 November 2026

Owner requested finalizing production Rules and committing before continuing.
[Rules checkpoint](rules.md) records generated
firestore.workspace.rules, explicit firebase.workspace.json, shared597-zone
policy, bounded optional social profile fields and owner-status-only read fencing.
72 focused unit/51 integration checks and static/generation checks pass. Earlier
fixture-only Rules and missing-production-policy statements below are historical.
No deployment/capability/contract publication occurred at that checkpoint. The
requested source commit is0c8db30; subsequent adapter/controller/UI work is recorded
in the runtime checkpoint. Slice5 stays open.

## Second implementation checkpoint — 4 November 2026

[Persisted codecs and stage probe](stages.md) adds
lossless confirmed-snapshot translation and strict workspace-record decoders.
A24-stage local Rules candidate passes18 integration tests, with66 focused unit
passes and static checks. Expression limits required single-Location stages;
Category pairs remain. The test-only probe uses explicit UTC/empty profile and
atomic batches; it is not a production policy or admitted transaction adapter.
Cloud workspace writes and UI provisioning remain disabled. Full details/limits,
source hashes and final logs are linked in the checkpoint.

## First implementation checkpoint — 4 November 2026

Owner authorized beginning implementation. [Domain checkpoint](domain.md)
adds a strict pure query codec, exact fresh seed plans and name/timezone validation.
41 focused tests and static checks pass. No persisted workspace records, new Rules,
SDK adapter, UI orchestration or cloud changes yet. Earlier readiness/checklist
statements that implementation has not started are historical; the persistence
and stage-integrity gates remain open. Slice4 remains held.

## Local verification checkpoint — 4 November 2026

Owner authorized local verification after the testing explanation. The applicable
local emulator/headless readiness checks are now permitted; earlier hold statements
below record historical authorization checkpoints. Slice4 remains open/on hold;
this does not authorize cloud actions, interactive provider tests or claim linking
acceptance. [Readiness report](readiness.md): 81 focused
unit, 7 existing integration and 4 compatibility browser checks passed. Candidate
family-map tests demonstrate the need for deliberate app bounds; production Slice5
transactions/Rules remain unimplemented and unverified. No full regression claim.

## Deliverable and exclusions

Initialize one UID-owned workspace with minimal profile/settings, twelve Categories,
ten Locations, six ordinary Saved Views and protected All Tasks. Provide blocking
Loading/progress, recovery and a minimal Workspace ready surface with Logout.
Unspecified is the default absence of a Location, displayed last; it is not an
eleventh Location document. Uncategorized is a real protected Category, ordered last.

Do not implement navigation, Task creation/loading, Dashboard charts, query
execution/editor, management forms or profile editing. Those remain their agreed
slices. No starter Tasks are created here. Provisioning does not require multiple
linked providers. Slice 3 is implemented and owner-accepted; linking-specific
validation remains Slice 4 work and is not proven by provisioning.

## Integration amendment — main baseline d013515, 2 November 2026

Owner authorized this amendment after reviewing the newer Slice4 implementation
and [hold/handoff](../04-identity-linking/hold.md). Approved catalogue, icon, ordering,
View, timezone and no-backfill policies are unchanged. Slice4 remains open, held
and unaccepted; its shared Auth changes are not assumed regression-free.

### Admission and presentation

Provisioning requires initialized authenticated UID, session admission, current
compatibility, connectivity and absence of a deletion fence. It does not require
multiple providers, provider-membership loading, current-account verification,
link suggestions, proof tokens or successful linking. A transient provider-status
error must not become a workspace initialization failure.

Compose provisioning/loading/recovery/Workspace ready as the primary authenticated
surface, independent of Sign-in methods. Keep Logout accessible through blocking
states. Do not turn off compatibility/session safeguards merely to bypass a
linking defect. Do not claim existing primary sign-in is unaffected without tests.

### Lifecycle and account isolation

Use the existing session admission (UID, generation and compatibility ticket).
Visibility/resume or Auth notifications can revoke compatibility admission even
without changing UID. Stop new stage submission, preserve the UID/job progress
reference and reconcile already submitted work before obtaining fresh admission.
Never restart the seed template solely because a ticket expired. Logout/account
switch invalidates publication of all old-account results, including same-UID
sign-out/sign-in across different session generations.

The integration baseline supplied a no-op account-state cleanup hook; the runtime
implementation now supplies state clearing, subscription disposal and pending-result
invalidation before user-scoped state is exposed. Cleanup must not
cancel or pretend to roll back an already committed stage. Verify disposal during
runtime teardown and avoid duplicate listeners after remount/reconnect.

### Profile and runtime boundaries

SessionIdentity now includes optional initial-profile photo data through the
infrastructure identity translation. Do not pass Firebase User
objects into application/domain or read provider status merely to obtain a photo.
Capture profile once, allow absent fields and never overwrite persisted user edits.

The shared Auth/Firestore runtime now owns the provisioning adapter; SDK types
stay in infrastructure and its database lifecycle is reused. Do not
create a second persistent Auth session, reconnect workspace data to an isolated
provider-metadata helper or attach a listener per visual component. A status-reader
implementation using memory-only Auth is not the workspace's authentication source.

### Required integration evidence and held tests

Before accepting Slice5, validate Google and Microsoft single-provider entry,
restoration, Logout, account switching, late callbacks, gate revocation during a
stage, unknown acknowledgement reconciliation, visibility/reconnect and absence of
repeated provider-status/compatibility checking loops. Confirm provisioning can
reach ready without opening or completing Sign-in methods. Reuse existing shared
Auth/Firestore regression patterns where relevant; mocked adapter evidence alone
does not establish real-provider safety.

These are Slice5 acceptance requirements. Later owner authorization permitted
the local and affected-boundary checks recorded in the release evidence; hosted
owner acceptance remains pending. This does not accept Slice4 linking or authorize
additional held-feature testing. Keep linking/multi-provider acceptance separate
from provisioning results; the original amendment itself executed no tests.

Physical paths, bounded initialization stages, query codecs, family declarations
and initialization Rules are now implemented and locally verified; the approved
0.2.0 Rules/contract/client release is published to dev. Slice5A request/finalizer
mechanics and hosted owner acceptance remain separate. Further cloud publication
still requires an explicit destination and authorization.

## Approved classification templates

All ordinary records start active, with no coordinates. Persist explicit global
order matching these tables; future reordering does not change record identity.
Use stable internal IDs independent of mutable names. Suggested seed IDs below
are implementation proposals, not externally meaningful ownership keys.

| Order | Category / seed ID | Material Symbols Rounded icon |
|---:|---|---|
| 1 | Family / family | family_restroom |
| 2 | Finance / finance | wallet |
| 3 | Friends / friends | group |
| 4 | Growth / growth | trending_up |
| 5 | Hobbies / hobbies | palette |
| 6 | Household / household | home_and_garden |
| 7 | Leisure / leisure | weekend |
| 8 | Self / self | person |
| 9 | Social / social | celebration |
| 10 | Wellness / wellness | heart_plus |
| 11 | Work / work | work |
| 12 | Uncategorized / uncategorized | category |

Uncategorized has a stable protected ID, fixed name/icon and cannot be archived
or deleted. Ordinary starter Categories follow current rename/archive rules, not
legacy fixed-name restrictions. Names use current NFC/trim, case-insensitive
uniqueness and 30-grapheme limits. No Partner or Spirituality Category is seeded.

| Order | Location / seed ID | Material Symbols Rounded icon |
|---:|---|---|
| 1 | Grocery / grocery | local_grocery_store |
| 2 | Gym / gym | fitness_center |
| 3 | Local Stores / local-stores | storefront |
| 4 | Mall / mall | local_mall |
| 5 | Market / market | store |
| 6 | Office / office | business |
| 7 | Online / online | language |
| 8 | Pharmacy / pharmacy | local_pharmacy |
| 9 | Residence / residence | home |
| 10 | School / school | school |
| Last | Unspecified / no record or assignment | location_on |

Online is classification only. None of these Locations adds GPS, maps, proximity
or coordinate editing. Locations follow current naming/archive rules. Unspecified
is selected initially and appears after named Locations in groups/pickers.

Material Symbols Rounded is the approved family. Store allowlisted semantic icon
names, not arbitrary SVG/HTML or provider URLs. Use a consistent unfilled style.
Package/version and self-hosted asset delivery must be selected and checked during
implementation; no icon dependency is installed by detailing. Ordinary icons can
be edited in later management slices; protected/synthetic icons remain fixed.

## Approved initial Views

All Views start shown on Home, with All Tasks permanently included. Global order:

| Order | View / seed ID | Eligibility | Group by | Sort |
|---:|---|---|---|---|
| 1 | Focus / focus | Open, nondeleted; paused included | Due Date | Due ascending |
| 2 | Scheduled / scheduled | Open, nondeleted; paused included | Planned Start | Planned Start ascending |
| 3 | Priority / priority | Open, nondeleted; paused included | Important/Urgent | Due ascending |
| 4 | Local / local | Open, nondeleted; paused included | Location | Due ascending |
| 5 | Completed / completed | Closed, nondeleted, outcome Done | Actual End | Actual End descending |
| 6 | Deleted / deleted | Deleted Date is set; open and Closed | Deleted Date | Deleted Date descending |
| 7 | All Tasks / all-tasks | Open, nondeleted; paused included | Category | Due ascending |

Deleted enables both Include Closed and Include Deleted, with Deleted Date Is Set.
Completed enables Include Closed and filters Closed/Done/nondeleted. Normal Views
have mandatory grouping; closure reason is filter-only. Encode the exact initial
queries explicitly, not opaque preset names interpreted differently by readers.

Persist the query definition with an independently versioned query payload and
validate it without executing queries. Define initial filter operators, empty
filters, date-group semantics and null/missing-date handling explicitly in the
codec. Reuse the agreed product semantics; do not quietly invent new date-bucket
thresholds. A parameter unresolved by the existing spec must return for decision
before its value is persisted. Full predicate support/editor remains Slices 10–12;
expand compatibly, preserving meaning and rejecting unknown queries safely.

All Tasks definition/name/protection/Home inclusion cannot be overwritten or
removed. Its `order` is mutable independently of its protected definition, initially last; later View
management may reorder it. Ordinary Views can later be renamed, edited, hidden,
reordered or deleted. A completed initializer never recreates an intentionally
deleted ordinary View or resets user-modified definitions/order.

## Agreed query structure — 4 November 2026

Owner directed proceeding after the Step 3 proposal. Each persisted View query
contains required `querySchemaVersion` (initially 1), `includeClosed` and
`includeDeleted` booleans, a `filters` object, a mandatory supported `groupBy`
and `sort: { field, direction }`. Empty filters impose no additional restriction
within the candidate scope. OR applies within filter dimensions, AND across them.
Include controls expand scope; they do not mean only Closed or only deleted.
One sort applies within groups, with stable Task ID resolving equal sort values.
Paused Tasks remain eligible unless explicitly filtered. Workspace settings supply
the timezone. Search text, scroll and expansion state are not query fields.

Initial definitions are the seven approved rows above. Completed explicitly filters
Closed/Done; Deleted explicitly requires Deleted Date Is Set with both scope flags
on. This step does not finalize filter operators or operand serialization; grouping
boundaries were subsequently agreed below. Owner resolved the grouped-dimension conflict on 4 November
2026: all grouping fields remain available in filters, including Deleted Date.
Grouping changes do not clear otherwise valid filters; evaluate filters before
partitioning the eligible population into groups.
Closure reasons remain stored but inactive when Include Closed is off, as required
by product specification section 17.5. Query schema v1 is not final until these
remaining codec edge contracts are resolved. JSON operand shapes, filter/date-sort
semantics and group boundaries below are now accepted. No query implementation or test run is claimed.

## Agreed grouped-field filtering and date buckets — 4 November 2026

Owner rejected the historical restriction on filtering a grouped dimension.
Every supported grouping field remains filterable using its applicable operators;
there is no presence-only exception. Filters select the population first, grouping
partitions the result. Grouping changes alone do not erase valid filter selections.
Mandatory grouping, retained zero-count groups and matching-count invariants remain.
Closure outcome is still filter-only; this amendment does not introduce new
Group By dimensions or new filter operators.

Owner also removed standalone Yesterday and Tomorrow buckets, including those
calendar days in the previous and next 1–7-day windows respectively:

| Group | Calendar-day offset from today, in workspace timezone |
|---|---|
| Older | -31 or earlier |
| Previous 8–30 days | -30 through -8 |
| Previous 1–7 days | -7 through -1 |
| Today | 0 |
| Next 1–7 days | +1 through +7 |
| Next 8–30 days | +8 through +30 |
| Later | +31 or later |
| Unspecified | Missing grouping date; always last |

Each valid date belongs to exactly one bucket; zero-count buckets remain visible.
Use calendar-day boundaries rather than elapsed 24-hour durations. This changes
date groups, not Tomorrow/Yesterday date-entry shortcuts or Task date-storage
semantics. Invalid dates remain validation errors, not Unspecified. Exact operand
serialization remains to be finalized; the subsequent filter/date-sort agreement
below resolves relative evaluation and date-only Due semantics.

## Agreed filter and date/sort semantics — 4 November 2026

Owner directed proceeding after review of the operator/date-edge proposal.
The following semantics are accepted; exact JSON discriminators and operand
shapes remain the next proposal. The executable query codec is not implemented.

| Concern | Accepted semantics |
|---|---|
| Selection filters | Nonempty stable-ID or enum lists; OR within a dimension, AND across dimensions |
| Empty selections | Remove the filter; reject persisted empty selection lists |
| Unspecified Location | Explicit no-assignment operand, distinct from a Location ID |
| Date operators | Is Set, Is Not Set, Before, On or After, Between |
| Between | Inclusive lower bound and exclusive upper bound, `[from, to)` |
| Relative dates | Persist calendar-day offsets, evaluate against today in workspace timezone rather than freezing dates on save |
| Evaluation anchor | Capture one now/timezone for each query evaluation; use consistently for filtering and grouping |
| Date-only Due | Group/filter by the selected calendar day despite next-midnight exclusive expiry storage; exact-time Due uses its actual timestamp |
| Missing sort values | Always last in either direction; stable Task ID resolves ties |
| Date-group ordering | Chronological Older through Later; Unspecified last; task sort direction does not reverse group order |
| Invalid conditions | Reject unknown operators, malformed operands, reversed/empty ranges and contradictory conditions; preserve stored data for recovery |

Date-only Due interpretation requires precision metadata or an equivalent explicit
codec contract: midnight alone cannot distinguish a date-only expiry from an
exact-time Due at midnight. Concrete Task storage remains a later slice; do not
infer precision by subtracting time from every midnight timestamp. This record
establishes query semantics without inventing a Task schema or migrating data.

## Approved query JSON representation — 4 November 2026

Owner explicitly approved the following representation. Stable camelCase field
and enum tokens are independent of display labels. View name, `order` and
`showOnHome` are outside `query`.

| Operand / condition | Approved representation |
|---|---|
| Selection | `{"op":"in","values":["closed"]}`; nonempty values |
| Actual Location | Tagged value `{"kind":"id","id":"office"}` |
| Unspecified Location | Tagged value `{"kind":"unassigned"}`, distinct from a record ID |
| Date presence | `{"op":"isSet"}` or `{"op":"isNotSet"}` |
| Date comparison | `{"op":"before","value":…}` or `{"op":"onOrAfter","value":…}` |
| Date range | `{"op":"between","from":…,"to":…}`; half-open |
| Absolute calendar boundary | `{"kind":"calendarDate","date":"2026-11-04"}`; start of that calendar day in workspace timezone |
| Relative calendar boundary | `{"kind":"relativeDay","offset":0}`; start of today, with 1 meaning tomorrow |
| Exact instant | `{"kind":"instant","value":"2026-11-04T10:30:00Z"}` |
| Multiple date conditions | Array under the date field, combined with AND; reject contradictions |

Approved Completed example:

```json
{
  "querySchemaVersion": 1,
  "includeClosed": true,
  "includeDeleted": false,
  "filters": {
    "lifecycle": { "op": "in", "values": ["closed"] },
    "closureOutcome": { "op": "in", "values": ["done"] }
  },
  "groupBy": "actualEnd",
  "sort": { "field": "actualEnd", "direction": "desc" }
}
```

The envelope, operators, operand shapes and date-group behavior are agreed.
This does not claim a complete executable v1 codec: enumerate the full field/enum
allowlists, bounds, duplicate-value handling, operand combinations and precise validation checks before codec freeze;
subsequent accepted validation policy below resolves the date-kind/Due choices.
Relative conditions may become empty/reversed as time advances; distinguish
invalid persisted structure from an evaluation-time empty intersection without
rewriting the saved query. These residual edge contracts remain for explicit
resolution, not silent implementation choices. No query engine or Task schema
is introduced by JSON approval.

## Accepted query validation policy — 4 November 2026

Owner directed continuing after the final-validation proposal. Apply these rules
when detailing/implementing the v1 codec; exhaustive token lists and resource
bounds are still engineering work and are not supplied by this policy alone.

- Explicit field/enumeration allowlists; reject unknown fields and duplicate
  selection values. Editor output uses unique selections and stable enum tokens.
- Validate referenced IDs structurally without requiring active records. Archived
  references remain valid; never silently strip missing references from a query.
- Date operands are strict valid calendar dates, UTC instant strings or safe-integer
  relative-day offsets. Both boundaries in a Between condition use the same kind;
  mixed-kind ranges are rejected.
- Multiple date conditions combine with AND and may mix absolute/relative kinds
  across separate conditions. Evaluation-time empty intersections yield no results,
  not a malformed saved query. Reject permanent structural contradictions such as
  Is Not Set combined with a comparison on the same date field.
- Due filters in query v1 accept calendarDate/relativeDay operands, not instant
  operands. Interpret date-only Due as its selected calendar day, not its exclusive
  next-midnight expiry; day-based filtering also applies to exact-time Due in the
  workspace timezone. Exact-time Due filtering is deferred for separate semantics.
- Establish explicit selection/condition/payload bounds alongside physical schema
  and Rules-budget design. This is not approval of arbitrary account/product caps.

This accepts validation behavior, not an implemented or frozen exhaustive codec.
Full query execution/editor remain later slices; Slice5 validates and stores seeds.

## Profile, settings and defaults

Capture available social display name/photo once for initial presentation; missing
values are valid. Never overwrite later edits or automatically refresh persisted
profile from subsequent sign-in/linking. Email/provider names are not ownership.

Initialize a validated browser timezone once and retain it across devices. If
unavailable/invalid, block initialization with an explicit timezone-selection
recovery; never silently choose UTC or infer timezone from provider identity.
Only this recovery control is included, not the complete preferences form.
Competing devices use the committed initial value rather than overwrite it.

Store only settings required by this slice, including timezone. Preserve the
agreed warning-enabled, Monday week-start and Last 7 Days defaults in versioned
feature templates until those features need persistence. Default Category is
Uncategorized; default Location is absent. Do not reintroduce DOW/TOD fields.

## Agreed ownership and versioning — 4 November 2026

Owner accepted the following Step 1 decisions. Core document fields and query representation were subsequently agreed below;
validation bounds, stage layout and deletion-fence contracts remain open;
this agreement does not claim implementation or authorize cloud publication.

| Concern | Accepted contract |
|---|---|
| Ownership | One workspace per Firebase UID under `users/{uid}/…`; ownership derives from the path, independently of sign-in provider |
| Record families | Independently version `workspaceInitialization`, `profile`, `settings`, `category`, `location`, `view` and `initializationStage` |
| Record schema | Every document carries `schemaVersion`, initially `1`, identifying persisted structure and meaning |
| Concurrency | Mutable documents carry `recordVersion`, initially `1`, incremented once per committed change; independent of schema version |
| Receipts | Stage receipts are immutable after creation, carry schema/template versions and have no edit counter; retries read rather than modify them |
| Seed template | Initialization and receipts carry `templateVersion`, initially `1`; later templates do not automatically reset completed workspaces |
| Query payload | Saved View queries carry independent `querySchemaVersion`, initially `1`; query meaning evolves separately from View metadata |
| Compatibility | Register every introduced record family in client capabilities and the authoritative contract before admitting dependent operations; current probe-only support is insufficient |
| Unknown data | Unsupported schemas or malformed required records block affected operations while preserving stored data; no silent reinterpretation or destructive repair |
| Upgrades | Only explicit, tested, transactional conversions; ordinary reads never silently upgrade records; preserve concurrent edits and meaning |

App version, contract revision, record schema, record edit counter, query schema
and seed template version are distinct axes; numeric equality is not required.
Existing backward-compatibility and integrity policies remain controlling. No
deletion-control schema or new record family beyond the seven listed is approved
by this step; align Slice5A controls separately before workspace writes.

## Agreed persistence paths — 4 November 2026

Owner explicitly agreed the following UID-owned paths. Stage receipt IDs remain
for the bounded-stage design; path agreement does not approve extra guard/control
families or claim implementation.

| Record | Agreed path / purpose |
|---|---|
| Initialization | users/{uid}/initialization/workspace — template version, progress/completion |
| Profile | users/{uid}/profile/main — initial optional presentation |
| Settings | users/{uid}/settings/main — required persisted preferences |
| Classifications | users/{uid}/categories/{id}, users/{uid}/locations/{id} |
| View definition | users/{uid}/views/{id} — protection, query and Home inclusion |
| Stage receipts | users/{uid}/initializationStages/{stageId} — bounded seed completion |
| Name reservation | users/{uid}/nameKeys/{kind}/keys/{digest} — approved Category/Location name claim |

Validate all external records at runtime. Separate record-family schema versions,
query schema versions, mutable-record concurrency versions and template versions.
Use cloud-confirmed timestamps where required; no browser timestamp proves success.
The original probe-only family map was insufficient. The deployed revision2
contract/client now declare the probe and nine workspace families; app0.2.0 is
required. The design agreement alone did not authorize publication; the later dev
release was explicitly owner-authorized. Unknown/malformed required records
block with recovery guidance rather than trigger wholesale overwrite.

## Agreed document fields and ordering — 4 November 2026

Owner approved the Step 2 fields other than ordering, then selected spaced integer
`order` fields with steps of 1000. This supersedes the separate ordering documents
and `ordering` record family in the original Step 1 proposal; neither is introduced.
Physical paths above are owner-agreed; exact stage IDs and guard/control additions
remain subsequent contracts.

All documents carry `schemaVersion`. Mutable records additionally carry
`recordVersion`, `createdAt` and `updatedAt`, using server-confirmed timestamps.
Ownership and identity derive from the path. Omit absent optional fields
consistently; reject unknown fields within a known schema. Receipt documents use
`completedAt` without mutable-record timestamps or an edit counter.

| Document | Accepted fields / validation |
|---|---|
| Initialization | `templateVersion`, `status` (`initializing` or `complete`), optional `completedAt`; completion requires valid receipts, with `completedAt` present only when complete |
| Profile | Optional `displayName` and `photoUrl`; photo URL uses HTTPS; capture once without later provider-driven overwrite |
| Settings | Required validated supported `timezone`; invalid/missing browser timezone requires explicit selection |
| Category | `name`, `icon`, `archived`, `order`; approved normalization/naming constraints and allowlisted icon; reserved Uncategorized ID determines protection |
| Location | `name`, `icon`, `archived`, `order`; approved naming constraints and allowlisted icon; no coordinates or synthetic Unspecified document |
| View | `name`, `query`, `showOnHome`, `order`; query carries `querySchemaVersion`; reserved All Tasks ID determines protection; query envelope/JSON agreed; exhaustive validation contracts remain |
| Stage receipt | `templateVersion`, `completedAt`; deterministic stage ID; immutable and atomic with required stage records |

Initial ranks follow each approved catalogue: 1000, 2000, 3000 and so on,
independently per family. Initial All Tasks rank is 7000 and it remains movable.
`order` is a finite safe integer; later insertion between adjacent records may
use `ceil((left.order + right.order) / 2)`, not necessarily a multiple of 1000
(owner clarification). The result must be strictly between the neighbours. If
there is no such gap, renumber the family in its current order to 1000, 2000,
3000 and so on, then recalculate the insertion rank. Compute the midpoint without
unsafe integer arithmetic; equal-rank neighbours also require normalization.
Use ascending `(order, stable document ID)` as the deterministic tie-break. Equal
ranks do not constitute corruption or a uniqueness violation. Preserve archived
records' ranks. Uncategorized is displayed last by protected-position semantics;
Unspecified follows named Locations synthetically. Home uses global View order
while respecting `showOnHome`; All Tasks inclusion stays protected.

Reordering changes `order` and mutable-record metadata, preserving identity and
other content. Existing stale-version reload/explicit-overwrite policies apply;
no overwrite may bypass integrity. When an insertion gap is exhausted, normalize
the affected family's ranks back to steps of 1000 through a safe transactional
operation. Exact concurrency, collection-size bounds, Rules budgets and atomic
renumbering mechanics remain to be verified before implementing reorder commands;
no partially visible multi-record renumbering is accepted. Seed retries must never
reset committed user ordering in a completed workspace. Later management slices
implement user reordering; Slice5 persists initial ranks only.

## Agreed name uniqueness and reservation contract — 4 November 2026

The path structure and subsequent reservation approach are owner-agreed. No additional root `users/{uid}` document is
needed absent a concrete operation; renames preserve stable record IDs, reserved
IDs determine protection, and no separate ordering documents are introduced.

Review found a previously accepted PoC/beta boundary in
[feasibility decisions](../../feasibility/firebase-validation-decisions.md) and the
[later assessment](../../feasibility/firebase-verification-assessment.md): NFC
normalization and the 30-grapheme policy are client-enforced; Rules enforce
trim/lower consistency, UID isolation and atomic reservations of literal name keys.
A modified owner client can bypass canonical Unicode/grapheme validation within
its own namespace. Do not claim adversarial canonical-equivalence uniqueness.
The initial failed name probe predates this accepted limitation; do not reopen it
as an unmade owner decision. Frozen candidate Rules are evidence, not production
policy. Existing accepted boundaries do not waive other integrity protections.

Owner directed proceeding after the reservation proposal; the following contract
is accepted but not implemented or freshly validated:

- For Category and Location separately within each UID, add `nameKey` to the
  named record and one `nameReservation` schema family, initially schema 1.
  App canonicalization is trim, NFC, then locale-independent lowercase; Rules
  require the exact literal relation `nameKey == name.lower()` and trimmed names.
  Define/test the app/Rules Unicode lowercasing behavior; do not substitute an
  unverified full Unicode case-folding algorithm.
- Reservation path: `users/{uid}/nameKeys/{kind}/keys/{digest}`, with kind restricted
  to `categories` or `locations`, digest the SHA-256 hex of UTF-8 `nameKey`.
  Hashing keeps slashes/path punctuation out of the ID. Verify the digest/key
  relation in Rules, not merely in the app. Treat unexpected digest/key mismatch
  as an integrity error, never overwrite another name's reservation.
- Reservation fields: `schemaVersion`, `nameKey`, `entityId`, `createdAt` using
  server-confirmed time. Immutable binding; no edit counter. Rename deletes the
  old reservation and creates the new one, rather than editing its binding.
- Create entity and reservation atomically; enforce correspondence both ways.
  Two clients claiming the same key must yield one winner and a name-conflict
  outcome for the other. No preflight query is proof of uniqueness.
- Rename atomically acquires the new key, updates the entity/version and releases
  the old key. Case-only renames retain the existing reservation. Cross-entity
  swaps and standalone reservation removal are not ordinary supported operations.
- Archived records retain their reservation, so active/archived names share one
  namespace per kind. Category and Location may have the same name. View-name
  uniqueness is not introduced by this proposal.
- Protected Uncategorized and all seeded named records receive reservations too.
  Reordering, icon edits and archive/restore do not change the reservation.
  Account deletion removes entities/reservations under the separate trusted fence
  contract; later entity deletion must specify atomic release/reference handling.

The reservation agreement increases the seven record families to eight, adding
`nameReservation` with schema 1. Include guard writes in stage budgets, declare
the family in client capabilities/authoritative compatibility policy and include
its nested path in Slice5A deletion inventory. This supersedes the earlier
seven-family-only scope; the later deletion fence adds the ninth family. Bounded
initialization Rules and the authorized local checks now pass. Hosted acceptance
and Slice5A implementation remain pending; Slice4 stays held.
Firebase documents `getAfter()` for validating post-write state in atomic operations:
[Rules conditions](https://firebase.google.com/docs/firestore/security/rules-conditions).

## Safe initialization and progress

Admission requires an initialized authenticated UID, current compatibility and
connectivity. Show blocking **Loading** with progress messages such as Checking
workspace, Creating classifications, Creating Views and Verifying workspace.
Display: “Please finish initial setup on this device before opening this account
elsewhere.” Announce progress accessibly; do not display invented percentages.
Logout remains available. Do not describe data corruption as an acceptable effect
of simultaneous first access.

Use deterministic seed identities and transactional, idempotent bounded stages.
First read/validate existing state. Create missing records only within their
unfinished seed stage; validate existing seed records rather than overwrite them.
Persist a stage receipt atomically with its required records. Enforce receipt
integrity and permitted stage transitions in Rules, not only client code.
Finalize completion only after all required stages are confirmed and validated.

Do not assume the full seed fits one transaction's Rules access budget. Specify
and test a bounded stage grouping, receipt checks and finalization within actual
SDK/Rules limits before implementation acceptance. Progress receipts must not be
forgeable completion shortcuts. Any repair of inconsistent completed required
records needs explicit recovery; do not silently reconstruct user-controlled data.

Two tabs/devices may attempt setup. Transactions must converge without duplicate
records, overwritten profile/timezone/order or a premature complete marker. A
second client waits/rechecks progress and resumes safely if the first disappears;
no permanent client-held lock. Future management operations must respect incomplete
initialization boundaries. Never use a warning in place of concurrency integrity.

Cache-only results cannot confirm setup. Bind async work to UID/session generation
and compatibility admission. Revoke new operations on Logout/account changes or
gate loss. Reconcile already submitted writes against cloud state before safe
retry; cancellation does not undo commits. Known-offline setup is blocked and no
offline write queue is introduced. Preserve useful recovery input where feasible.
After confirmation show Workspace ready; this does not assert Task-population
completeness, an empty inventory, a functioning Dashboard or later navigation.

## Accepted initialization stages and recovery — 4 November 2026

Owner explicitly accepted the proposed stage/recovery approach. Transactions are
sequential and bounded; exact stage IDs, receipts, counters/prerequisites and
Rules expressions still require concrete design and budget verification.

| Phase | Accepted behavior |
|---|---|
| Admission | Check session, compatibility, connectivity and absence of deletion fence |
| Base setup | Atomically create initialization state, initial profile/settings and receipt; concurrent clients retain first committed values |
| Categories | Deterministic seed records together with name reservations and receipts |
| Locations | Same paired-record/receipt approach as Categories |
| Views | Seed all seven explicit definitions with initial numeric ranks and receipts |
| Finalization | Mark complete only after Rules-verifiable evidence confirms every required stage |
| Recovery | Read committed progress and resume unfinished stages without overwriting completed stages or user changes |

Candidate maximum is two named records plus their reservations per stage; this
is a design starting point, not a certified Rules limit or immutable batch size.
Reduce grouping if needed for verified budgets. Receipt creation must be enforced
alongside required records; a client-supplied receipt/count alone cannot prove
completion. Design finalization evidence without assuming one transaction can
read every receipt or that a mutable counter is inherently trustworthy.

Unknown acknowledgement requires authoritative server reconciliation before retry.
Logout/account switch or gate loss stops new submissions and invalidates stale UI
results; already submitted work can commit and must later be reconciled. Do not
promise rollback or restart a template because admission expired. The one-device
setup message is guidance, never a substitute for concurrent-client convergence.

No implementation, Rules/emulator/browser verification or cloud publication is
claimed by stage acceptance. The broader-test hold remains active. The shared Slice5A fence control is subsequently agreed below; exact finalizer
states, proof admission and retirement safety remain Slice5A verification work.

## Agreed shared deletion-fence contract — 4 November 2026

Owner directed proceeding after the shared-fence proposal. This agreement prepares
Slice5 admission/Rules; the deletion request UI, trusted finalizer and destructive
execution remain Slice5A and separately authorized operations.

| Concern | Accepted contract |
|---|---|
| Path | `accountDeletion/{uid}` outside the workspace data subtree |
| Fence | Existence blocks provisioning and ordinary workspace writes, independent of job state |
| Versioning | Add `accountDeletion` family, initially schema 1; declare in compatibility capabilities/policy; nine families including nameReservation |
| Initial fields | `schemaVersion`, `jobId`, `inventoryVersion`, `state: requested`, server-confirmed `requestedAt` |
| Operator fields | Validated minimal progress/timestamps; no profile data or credentials |
| Browser rights | Matching owner reads status; creates one strictly validated request after the approved fresh-proof flow; no update/delete |
| Operator rights | Explicitly invoked trusted script progresses same job, cleans data, deletes Auth last, eventually retires fence |
| Failed/unknown control read | Block safely; never infer absence from a read failure or unsupported schema |
| Concurrency | Every workspace write's Rules enforce fence absence, including initialization/receipts/name reservations; committed setup stages remain deletion inventory |
| Retirement | Only trusted finalizer after verified data cleanup, Auth absence and validated stale-token safety interval; no automatic expiry |

No mutable `blocked` Boolean controls admission: all existing control states are
fenced, including unknown states. Existence checks must still fence unsupported
schemas even where the UI cannot decode progress. Root control is intentionally
outside ordinary workspace deletion; include it in trusted inventory as a control
retired last, not as ordinary data to purge first. Cloud deletion job execution is
not authorized by accepting the contract.

Exact proof admission, job states/progress shape, inventory versions, token-safety
bound and control mutation/version concurrency rules remain Slice5A detailing.
Do not claim their verification or silently grant client progress writes. Slice5
must implement fence admission/Rules without exposing an incomplete deletion UI.
Its client capability declares readable schema 1; a write capability is declared
only by a build implementing the authorized request creation operation.

## Security and recovery acceptance

The deployed initialization Rules replace the former deny-all application-data
policy only for the exact UID-owned operations needed here. Retain public get-only runtime/compatibility and
privileged policy publication. Deny cross-account reads/writes, ownership changes,
unknown schemas/fields, client-forged receipts and invalid protected-record edits.
Do not loosen generic writes to make seed batches succeed. Production Rules and
indexes remain separately controlled; initialization Rules were explicitly
authorized and deployed for the0.2.0 dev release. No index change was needed.

Tests must cover first/returning access, same-UID simultaneous clients, interruption
at every stage, unknown acknowledgement, retry, malformed/unknown schema,
cache-only boot, offline/resume, gate revocation, Logout and account switching.
Verify exact catalogue counts/order/icons, all seven query definitions, no seed
reset/recreation after completion, profile/timezone preservation, protected All
Tasks/Uncategorized, ordering independent of query/name changes and cross-UID denials. Run meaningful
adapter/Rules/browser integration and affected Auth/compatibility regressions.
Record reads/writes/retries/listener lifetimes for first and returning access;
local counts are not actual billing or platform-capacity proof. Do not impose a
speculative account cap. Diagnostics exclude profile content, credentials and tokens.

## Onboarding and early Delete Account

Workspace completion and onboarding completion are separate markers. Slice 9
introduces the three starter Tasks for newly initialized eligible workspaces;
no automatic backfill to already initialized accounts, no content overwrite and
no resurrection of deliberately deleted examples. Template updates do not rerun
initialization. This slice provides infrastructure, not future Task schemas.

Insert **Slice 5A — Delete Account** immediately after Slice 5 and before Slice 6,
preserving existing slice identifiers. It is a normal user-facing capability,
not a hidden test reset. Its [separate detailing](../05A-delete-account/index.md) selects Option 3 operator-run
trusted finalization with temporary fencing; align provisioning fences before
implementation. Browsers submit intent/status only; the operator script performs
cleanup, Auth deletion and safe fence retirement.
The deletion contract covers fresh authentication,
named confirmation, owned-data removal before Auth identity deletion, interruption,
resumption and isolation of orphaned data. Reusing the same provider login must
not promise the old UID. The owner's two Google and one Microsoft personal test
accounts motivate early delivery; no accounts are deleted by this document.
Do not add the old in-scope seed-only deletion logic as a future unsafe shortcut:
the deletion contract must evolve with every new owned record family.

## Remaining gaps and decision register — 4 November 2026

Accepted: UID paths; nine record families; version axes; core fields; per-record
integer ranks with 1000 initial spacing/midpoint insertion; seven starter queries;
query JSON/operators/validation policies; group/filter coexistence; eight date
buckets; client-only NFC/grapheme boundary plus atomic name reservations; sequential
bounded initialization/recovery; existence-based root deletion fence. These are
not reopened as unresolved product decisions.

Local readiness evidence is [reported](readiness.md),
with [machine evidence](readiness-evidence.json) and
[execution output](readiness.log). The baseline passed
81 focused unit,7 existing emulator integration and4 compatibility browser checks.
Source/runner hashes match; normalized execution-log byte hash is verified. No
new test execution is implied by this documentation reconciliation.

| Item | Current position | Remaining gate |
|---|---|---|
| Schema/codec contract | Exact persisted decoders, seed/query bounds and snapshot translation implemented | Later CRUD/Task physical schemas stay in their slices |
| Initialization integrity | Deployed Rules, guarded adapter, receipts and reconciliation verified; owner primary workflow passed | Closed Slice5 scope; retain evidence for future changes |
| Runtime/fence/presentation | Shared runtime, UID/generation/admission binding, cleanup, fences and Loading/recovery/ready implemented and verified | Slice5A request/finalizer remains separate |
| Icons |22 pinned self-hosted Rounded assets, license, semantic aliases and offline integrity check supplied | Future catalogue/navigation presentation uses these assets |
| Local verification | See runtime report and machine evidence for final counts and limitations | Does not claim real-provider/cloud acceptance or Slice4 completion |
| Compatibility rollout | Published: app0.2.0, contract revision2/serverRelease2, nine workspace families and exact initialization Rules; older clients blocked | Retain0.2.0 rollback floor; further promotions require instruction |
| Due precision/query execution | Initialization stores the agreed query envelope | Task precision and mixed-precision execution remain later-slice work |

Verdict: initialization runtime is implemented, locally verified and released to
dev. Hosted artifact/gate checks pass; the owner reports the primary workflow
passed on mobile and desktop. The owner subsequently closed Slice5; see the
[closure record](closure.md). Release identity/bounds and coordinated publication
are complete. Slice4 remains held; Slice5A remains separate.

Original detailing used baseline ca822f3, integration amendment d013515; readiness
baseline is8320898 with uncommitted contract documentation and the new unit test.
Frozen experiments/legacy spec are unchanged. The evidence reconciliation itself performed no code implementation or tests;
subsequent domain implementation is recorded at the top. No staging, commit,
push or deployment is included.

## Slice9 accepted provisioning amendment — 4 November 2026

Owner accepted Slice9 N1–N8 and selected blocking onboarding within provisioning.
For newly enrolled initialization plans, starter Tasks are required stages before
workspace readiness; retain per-stage markers and show blocking progress/recovery.
Legacy ready accounts are not backfilled. This supersedes any implication that
separate onboarding markers permit eligible workspace readiness before completion.
Slice5 alone still creates no Tasks; Slice9 integrates the additional stages.
See [Slice9](../09-onboarding-tasks-manual/index.md). Revised G1–G8 are owner-accepted;
exact implementation proof remains required; no code, tests or cloud actions are performed.
