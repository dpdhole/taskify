# Slice 5 — Workspace provisioning

Status: **next development slice by owner direction, 2 November 2026; scope/defaults agreed; implementation not started**.
The owner put Slice 4 on hold and directed proceeding to this slice. Linking is not
a prerequisite; use the accepted single-provider Auth/session and compatibility
boundaries. See [Slice 4 hold and handoff](04-identity-linking-hold.md). Concrete
persistence/stage/query decisions below still require resolution before dependent
implementation. No executable changes, dependencies, Rules publication, cloud setup,
staging, commit, push or deployment are performed by this documentation update.

Authority: [product specification](../product_spec.md),
[architecture](../architecture.md), [slice plan](../implementation_plan.md),
[Slice 3](03-provider-sign-in.md) and [Slice 4](04-identity-linking.md).
This amendment supersedes the earlier absence of a required starter Location list
and resolves the previously open starter Category catalogue.

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
removed. Its order is separate mutable user state, initially last; later View
management may reorder it. Ordinary Views can later be renamed, edited, hidden,
reordered or deleted. A completed initializer never recreates an intentionally
deleted ordinary View or resets user-modified definitions/order.

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

## Proposed persistence and version boundaries

Use a user-owned namespace keyed by authenticated UID, with proposed paths:

| Record | Proposed path / purpose |
|---|---|
| Initialization | users/{uid}/initialization/workspace — template version, progress/completion |
| Profile | users/{uid}/profile/main — initial optional presentation |
| Settings | users/{uid}/settings/main — required persisted preferences |
| Classifications | users/{uid}/categories/{id}, users/{uid}/locations/{id} |
| View definition | users/{uid}/views/{id} — protection, query and Home inclusion |
| Ordering | users/{uid}/orders/{family} — Category, Location and View ID sequences |
| Stage receipts | users/{uid}/initializationStages/{stageId} — bounded seed completion |

Validate all external records at runtime. Separate record-family schema versions,
query schema versions, mutable-record concurrency versions and template versions.
Use cloud-confirmed timestamps where required; no browser timestamp proves success.
The current compatibilityProbe-only family map is insufficient: extend client and
authoritative contract deliberately for every introduced family before admission.
No contract publication is authorized here. Unknown/malformed required records
block with recovery guidance rather than trigger wholesale overwrite.

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

## Security and recovery acceptance

Replace the current deny-all application-data policy only with explicit UID-owned
record operations needed here. Retain public get-only runtime/compatibility and
privileged policy publication. Deny cross-account reads/writes, ownership changes,
unknown schemas/fields, client-forged receipts and invalid protected-record edits.
Do not loosen generic writes to make seed batches succeed. Production Rules and
indexes remain a separately authorized cloud checkpoint.

Tests must cover first/returning access, same-UID simultaneous clients, interruption
at every stage, unknown acknowledgement, retry, malformed/unknown schema,
cache-only boot, offline/resume, gate revocation, Logout and account switching.
Verify exact catalogue counts/order/icons, all seven query definitions, no seed
reset/recreation after completion, profile/timezone preservation, protected All
Tasks/Uncategorized, reorder separation and cross-UID denials. Run meaningful
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
not a hidden test reset. Its [separate detailing](05A-delete-account.md) selects Option 3 operator-run
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

## Review and next checkpoint

The owner-approved scope/catalogues/icons are recorded above. Physical paths,
stage layout, exact query codec and any previously unspecified query defaults are
concrete design proposals requiring resolution/verification before implementation.
Select icon delivery, implement explicit runtime/Rules boundaries and update
feature guidance/templates without teaching unavailable features. Initial manual
publication stays Slice 9. No invented manual URLs or external publication.

Prepared from local baseline ca822f3 after fast-forwarding to locally known
origin/main. Frozen experiments and legacy specification remain unchanged.
No new validation or cloud readiness is claimed. Review this detailing before
implementation; overall platform feasibility remains INCONCLUSIVE.
