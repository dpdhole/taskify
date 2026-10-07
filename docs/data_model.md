# Taskify Data Model

> Authoritative domain and Firestore data model. Load through `docs/project_status.md`.

### Data Model

**Status:** Approved

#### Task Type

- `Task.type` is an extensible discriminator. Current supported values are **Task** and **Event**.
- **Task** represents actionable work and uses the approved Task lifecycle.
- **Event** represents a scheduled occurrence and uses the reduced Event lifecycle defined in UX Navigation.
- A future **Todo** value is anticipated but is not currently enabled and has no approved field/lifecycle semantics.

#### Task Hierarchy

- Tasks and subtasks use one shared `Task` entity with hierarchical parent linkage; a subtask is therefore a normal Task with a parent relationship and is independently browsable throughout the product.
- The logical model is designed to support arbitrary-depth hierarchy.
- Initial product behavior is limited to one subtask level (`Task -> Subtask`).
- The initial UI, lifecycle warnings, permissions, recurrence handling, and queries target one level only.
- The schema should not require redesign if deeper hierarchy is enabled later.

#### Identity in the Domain Model

- Email is the canonical domain identifier for users and participants across Taskify.
- Task and related domain fields use email consistently, including `owner_email`, `executor_email`, `created_by_email`, activity actor email, attachment uploader email, reminder user email, and User↔Task document ownership.
- Firebase Auth UID may exist as an implementation detail but is not the canonical domain identifier.

#### Task Ownership and Participation

- `owner_email` is a required direct field on `Task` and represents exactly one Owner.
- `executor_email` is a required direct field on `Task`, represents exactly one Executor, and defaults to `owner_email` when unspecified.
- `created_by_email` records task provenance separately from ownership.
- Consultant/Reviewer participants are stored as an array of email IDs on the Task.
- Informed participants are stored as an array of email IDs on the Task.
- Owner and Executor remain direct fields because they are mandatory 1:1 relations and heavily queried.

#### Core Task Data

The shared Task definition contains task-global data including title, markdown description, category, priority, lifecycle state, start/due/end date-time values, location, recurrence linkage, hierarchy fields, ownership/execution fields, participation email arrays, and created/updated/completion metadata.

- For **Task**, Start, Due, and End are all optional. A Task with no Due date represents a **Someday / no commitment date** task.
- Start may be populated automatically when execution begins if absent; End may be populated automatically when the task reaches an appropriate terminal state if absent. Explicitly entered Start/End values are not overwritten automatically.
- Date/time values retain sufficient timezone context for human interpretation and later recurrence behavior.
- Firestore Task documents maintain scalar query fields `start_date`, `due_date`, and `end_date` (nullable `YYYY-MM-DD`) corresponding to the richer date values.
- Firestore Task documents also maintain a derived query field `availability` with values `working`, `archived`, or `deleted`. It is non-authoritative and is derived from archive/delete state to simplify preset retrieval. `deleted` takes precedence when a Task is soft-deleted; otherwise an archived Task is `archived`; all other Tasks are `working`.
- Lifecycle remains stored and queried through the nested fields `lifecycle.macro` and `lifecycle.micro`. Do not add duplicated top-level `lifecycle_macro` / `lifecycle_micro` query projections unless a later measured need justifies them.
- `availability` is maintained only by trusted backend archive/delete/restore business actions and must remain consistent with `archived_at` and `deleted_at`.
- Task `priority` is a boolean task-global Owner-controlled field and remains distinct from per-user Important/Urgent preferences.
- Event-specific date semantics are deferred to **Milestone 5 — Events & Time** and are not part of the current Task architecture pass.

#### Physical Task Document Schema — Milestones 1–3

Canonical Firestore path:

```text
/tasks/{taskId}
```

Canonical document shape:

```text
{
  type: "task",

  title: string,
  description_md: string,
  category_id: string,
  priority: boolean,

  lifecycle: {
    macro: "upcoming" | "active" | "completed",
    micro:
      "draft" | "planned" | "ready" |
      "in_progress" | "waiting" | "blocked" | "on_hold" | "review" |
      "done" | "cancelled" | "unable_to_complete"
  },

  availability: "working" | "archived" | "deleted",

  start: TaskDate | null,
  due: TaskDate | null,
  end: TaskDate | null,

  start_date: string | null,
  due_date: string | null,
  end_date: string | null,

  owner_email: string,
  executor_email: string,
  created_by_email: string,
  consultant_emails: string[],
  informed_emails: string[],

  parent_task_id: string | null,
  root_task_id: string | null,

  archived_at: Timestamp | null,
  deleted_at: Timestamp | null,
  purge_after: Timestamp | null,
  completed_at: Timestamp | null,

  created_at: Timestamp,
  updated_at: Timestamp
}
```

`TaskDate` shape:

```text
{
  date: "YYYY-MM-DD",
  has_time: boolean,
  time: "HH:mm" | null,
  timezone: string | null,
  instant: Timestamp | null
}
```

**Required and nullable fields**
- Every field in the canonical Task document shape is present.
- Optional concepts are represented by explicit `null`, not by omitting the field, for `start`, `due`, `end`, their scalar date projections, archive/delete/recovery/completion timestamps, and hierarchy IDs.
- `description_md` is required but may be an empty string.
- `consultant_emails` and `informed_emails` are required arrays and may be empty.
- `priority` is required and defaults to `false` on ordinary creation unless explicitly set.
- `title` must be a non-empty string after product-level normalization/trim validation.
- Exact title/description maximum sizes remain an implementation/operational decision and are not frozen here.

**Lifecycle invariants**
- Valid macro/micro pairs are:
  - `upcoming`: `draft`, `planned`, `ready`
  - `active`: `in_progress`, `waiting`, `blocked`, `on_hold`, `review`
  - `completed`: `done`, `cancelled`, `unable_to_complete`
- Normal user-created Tasks start `upcoming/planned`.
- `draft` remains reserved for trusted backend/import creation.
- Lifecycle is backend-controlled after creation and follows the approved action contract.

**Availability invariants**
- `deleted_at != null` implies `availability == "deleted"`.
- Otherwise `archived_at != null` implies `availability == "archived"`.
- Otherwise `availability == "working"`.
- `availability == "working"` requires `deleted_at == null` and `archived_at == null`.
- `availability == "archived"` requires `archived_at != null` and `deleted_at == null`.
- `availability == "deleted"` requires `deleted_at != null`.
- A deleted Task may retain `archived_at`; restore-delete recalculates availability from that preserved archive state.
- `purge_after` is non-null only while the Task is soft-deleted and recoverable; restoring the Task clears `deleted_at` and `purge_after`.

**TaskDate invariants**
- `date` is required whenever a `TaskDate` exists and uses canonical `YYYY-MM-DD`.
- If `has_time == false`: `time == null`, `timezone == null`, and `instant == null`.
- If `has_time == true`: `time`, `timezone`, and `instant` are all non-null.
- `time` uses canonical 24-hour `HH:mm`.
- `timezone` is an IANA timezone identifier.
- `instant` is the UTC instant derived from `date + time + timezone`; it is a query/execution projection, not independent user input.
- Scalar projections are exact:
  - `start == null` iff `start_date == null`; otherwise `start_date == start.date`
  - `due == null` iff `due_date == null`; otherwise `due_date == due.date`
  - `end == null` iff `end_date == null`; otherwise `end_date == end.date`
- Date-only TaskDates preserve human-local date semantics and do not synthesize midnight instants.
- Explicit user-entered Start/End values are not overwritten by automatic lifecycle behavior.

**Identity and participation invariants**
- Email fields store canonical normalized domain email values.
- `owner_email`, `executor_email`, and `created_by_email` are required and non-empty.
- In the Milestone 1–3 individual flow, ordinary root creation requires all three direct identity fields to equal the authenticated user's canonical email.
- `consultant_emails` and `informed_emails` contain no duplicate entries within each array.
- Milestone 1–3 ordinary creation uses empty participant arrays; collaboration mutations are deferred to Milestone 6.
- Cross-role duplicate/overlap semantics beyond the current individual flow remain deferred to the collaboration design stage.

**Category invariant**
- `category_id` is required.
- It must reference a valid category owned by the Task Owner under the approved category rules.
- Archived-category assignment semantics are governed by the Category schema; existing Tasks may retain references to archived categories.

**Hierarchy invariants**
- Root Task: `parent_task_id == null` and `root_task_id == null`.
- First-level subtask: `parent_task_id == parent Task ID` and `root_task_id == parent Task ID`.
- Milestones 1–3 prohibit creating a child beneath an existing subtask.
- Hierarchy fields are backend-controlled and immutable through ordinary client updates.

**Completion/archive/delete timestamps**
- `completed_at` is non-null exactly when the current lifecycle macro is `completed`.
- Reopen clears `completed_at`.
- `archived_at` records current archive state; archive sets it, restore archive clears it unless the Task is currently deleted and preserved archive state must survive restore-delete semantics.
- `deleted_at` records current soft-delete state.
- `purge_after > deleted_at` whenever both are set.
- Archive/delete timestamps do not independently alter lifecycle.

**Creation/update timestamps**
- `created_at` is server-generated and immutable.
- `updated_at` is server time for every Task mutation that changes the shared Task document.
- Private user-state changes such as Hide Until and personal reminders do not update the Task's `updated_at`.
- `updated_at` is the optimistic-concurrency token for trusted Task business actions.

**Field ownership**
- Direct client-editable after creation: `title`, `description_md`, `category_id`, `priority`, and `updated_at`, subject to Security Rules validation.
- Backend-controlled: `start`, `due`, `end`, scalar date projections, timed `instant` projections, `lifecycle`, `availability`, hierarchy fields, archive/delete/recovery/completion timestamps, and any automatic Start/End changes caused by lifecycle actions.
- Identity/participation fields are immutable in Milestones 1–3 after creation; collaboration-era mutation semantics are deferred.
- `type` and `created_at` are immutable.

**Physical deletion**
- Ordinary clients may never physically delete a Task document.
- Permanent purge is a trusted backend/operations process after `purge_after`, with dependent-data cleanup defined by the approved soft-delete model.

**Validation policy**
- Security Rules validate type, allowed-field changes, ownership, enum/domain values, lifecycle creation state, nullability, category ownership, and any date synchronization constraints practical to enforce safely.
- Backend handlers revalidate all invariants material to trusted actions.
- Rich TaskDate normalization and scalar/instant projection are performed only by trusted backend code; Security Rules deny direct date mutation.
- Emulator tests must include malformed enums, missing required fields, invalid macro/micro pairs, invalid availability/timestamp combinations, malformed TaskDate values, scalar-date mismatches, hierarchy mutation attempts, identity mutation attempts, and invalid protected-field writes.

#### User Profile Schema — Milestones 1–3

Canonical Firestore path:

```text
/users/{uid}
```

Canonical document shape:

```text
{
  uid: string,
  email: string,
  normalized_email: string,
  display_name: string | null,
  profile_picture_url: string | null,
  auth_provider: string,
  timezone: string,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

**Invariants**
- `uid` equals the Firebase Auth UID and the document ID.
- `email` is the canonical account email supplied by the authenticated identity.
- `normalized_email` is the normalized canonical form used for domain comparisons.
- `display_name` is nullable and user-editable.
- `profile_picture_url` is nullable and, in current scope, populated only from supported social-provider identity data.
- `auth_provider` records the effective authentication provider/source required by the implementation and is identity-controlled.
- `timezone` is a required IANA timezone identifier. Initial value is derived from the client/device at profile creation and may later be user-edited through Settings.
- DEC-068 bounds direct-write Rules validation to identifier shape (`UTC` or a slash-separated identifier), not actual membership in the IANA database. This validation limitation is approved; TaskDate callables retain full runtime timezone validation.
- `created_at` and `updated_at` use server timestamps.

**Field ownership**
- User-editable: `display_name`, `timezone`.
- Identity/backend-controlled: `uid`, `email`, `normalized_email`, `auth_provider`, provider-derived `profile_picture_url`, `created_at`.
- `updated_at` changes on profile mutation and must use server time.
- Ordinary client writes must not alter canonical identity fields.

**Access**
- A user may read and update only `/users/{request.auth.uid}`.
- Profile create must match the authenticated UID and canonical email.
- Ordinary client physical deletion is not part of the Milestone 1–3 contract.

#### Category Schema — Milestones 1–3

Canonical Firestore path:

```text
/categories/{categoryId}
```

Canonical document shape:

```text
{
  owner_email: string,
  name: string,
  normalized_name: string,
  display_order: number,
  is_default: boolean,
  archived_at: Timestamp | null,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

**Invariants**
- `owner_email` is required, canonical, immutable, and equals the authenticated user's canonical email at creation.
- `name` is required and non-empty after product-level trim/normalization.
- `normalized_name` is derived deterministically from `name` and is used for per-user uniqueness.
- Active and archived categories for one user may not create ambiguous duplicate normalized names; create/rename/reset logic must preserve one canonical category identity per normalized name.
- `display_order` is required and user-controlled for ordering categories.
- `is_default` identifies categories originating from the product default set; it is not a permission flag.
- `archived_at == null` means active; non-null means archived.
- `created_at` and `updated_at` are server timestamps.

**Task-reference behavior**
- Tasks may retain references to archived categories.
- New assignment to an archived category is not allowed.
- A referenced category is archived rather than destructively deleted.
- Category IDs remain stable when a default category is restored/reactivated.

**Default reset behavior**
- Reset-to-default reconciles against the current product-defined default category set.
- For each default normalized name:
  - reactivate the existing matching category if archived;
  - otherwise create it if absent;
  - mark it `is_default = true`;
  - restore the product default display order/name as defined by the current default set.
- User-created non-default categories are not deleted by reset.
- Reset does not rewrite existing Task category references.
- Because reset may touch multiple category documents and uniqueness invariants, implement it as a trusted backend operation rather than an uncoordinated multi-document client sequence.

**Field ownership and access**
- Only the category owner may read/write the document in Milestones 1–3.
- Category create/rename/archive/reactivate use trusted backend operations. Direct client category mutation is limited to reorder writes for `display_order` plus `updated_at`.
- `owner_email`, `created_at`, and default provenance semantics are protected.
- `normalized_name` uniqueness, reset, and reactivation semantics are enforced by trusted backend operations and transactional uniqueness guards.
- Destructive client delete is denied for referenced categories; physical cleanup of unreferenced historical categories is not required for Milestones 1–3.

#### User Timezone

- Each user profile stores an IANA timezone identifier.
- The timezone is initially derived from the device/browser timezone and may later be editable in Settings.
- Relative date semantics, date buckets, DOW, and TOD evaluation use the user's stored timezone rather than the executing device's transient local timezone.

#### Per-View Preferences

- View customization is persisted only when the user explicitly chooses **Remember**.
- A remembered view stores a **full resolved preference snapshot**, not sparse overrides.
- No per-view preference document exists until Remember is used; absence of a document means use the current product defaults for that view.
- Remembered view preferences are stored per user and per view, e.g. `/users/{uid}/view_preferences/{viewKey}`.
- The snapshot includes the view's resolved customizable state, such as primary organization, view-specific time thresholds, filters, and sort.
- Time thresholds are **view-specific**, not global. A view may define and remember its own **Near / Medium / Far** day boundaries; for example, Focus may use tighter 3/7/10 thresholds while Plan may use looser 5/15/30 thresholds.
- Time buckets are derived as: Older = before today; Today; Near = day 1 through Near; Medium = Near+1 through Medium; Far = Medium+1 through Far; Later = after Far; **Unspecified** = the relevant date is not set. Thresholds must satisfy `0 < near < medium < far`.
- When a view is organized by a date dimension and the relevant date is absent, place the Task in the **Unspecified** bucket at the end of the view. This is presentation semantics and does not invent a date value.
- Temporary changes remain client/session state until Remember is invoked.
- Reset removes the remembered preference document and returns the view to the current product defaults.
- View preference documents should carry a schema version so future semantic changes can be migrated deliberately.
- Each view owns its retrieval policy. Grouping is presentation-only and does not create independent Firestore retrieval streams.
- For views with a time-bounded working set, the default retrieval horizon is `max(30, 2 × far_days)` using the date field relevant to that view; the view may provide an explicit user action to expand beyond the loaded extent.
- `updated_at` may be used as a view-level staleness signal. Staleness is presentation/retrieval metadata only and never changes lifecycle, archive state, or completion state.
- **All Active** defaults to `stale_days = 60`: active tasks untouched for longer than that may be excluded from the default working set or surfaced separately as stale, with explicit access to include them. The threshold is view-specific and rememberable.
- Views where completeness is intrinsic may choose not to apply the staleness cutoff; for example, Resolve should not hide Waiting/Blocked/On Hold work solely because it is old.

#### Preset Retrieval Contracts

- Retrieval is defined per preset/view. Grouping, time buckets, Category grouping, Status grouping, and client-side sort operate on the retrieved candidate set and do not create separate Firestore retrieval streams.
- **Focus** — candidate set is active Tasks with `availability == "working"` and a Due date at or before the view retrieval horizon, plus all overdue Tasks. Use `due_date` as the retrieval date field. Staleness does not exclude Tasks from Focus because due-date urgency takes precedence; stale age may be shown as secondary context.
- **Resolve** — candidate set is Tasks with `availability == "working"` in Waiting, Blocked, or On Hold. Retrieve the complete unresolved set by default. Staleness does not exclude Tasks; older untouched Tasks may receive stronger stale emphasis because age increases the need for intervention.
- **Prioritize** — candidate set is active Tasks with `availability == "working"`; Tasks with Due dates inside the loaded view extent use `due_date` retrieval, while Tasks with no Due date remain eligible and appear in the final **Unspecified** bucket when organized by Due. Use `due_date` for bounded retrieval. Staleness does not override or hide deadline-based relevance.
- **Plan** — candidate set is active Tasks with `availability == "working"` and no Due date. Use `created_at` for the bounded working set. Plan supports staleness based on `updated_at`; stale unscheduled Tasks remain valid and may be surfaced as neglected/older work rather than silently dropped. Default `stale_days` is 60 unless the remembered view preference specifies another value.
- **Follow Up** — candidate set is Tasks for which the current user's `hidden_until > now`. Use `hidden_until` as the bounded retrieval field. Staleness is not used for exclusion because the future follow-up time is authoritative for the view.
- **All Active** — candidate set is all non-completed Tasks with `availability == "working"` in the active working universe. Default `stale_days = 60`; Tasks untouched longer than the threshold are excluded from the default working set or surfaced separately as stale, with an explicit user action to include them. This is a retrieval/presentation rule only.
- **Recently Closed** — candidate set is terminal Completed Tasks inside the view's retrospective extent using `completed_at`. `updated_at` staleness does not apply because closure time is the relevant age signal.
- **Unarchive** — candidate set is Tasks with `availability == "archived"` inside the view's loaded retrospective extent using `archived_at`. `updated_at` staleness does not apply because archive age is the relevant age signal.
- **Recover** — candidate set is Tasks with `availability == "deleted"` that remain recoverable, using `deleted_at` / `purge_after` as the governing window. `updated_at` staleness does not apply.
- Where a view uses a bounded date field, its default extent is `max(30, 2 × far_days)`. The view must clearly indicate when the loaded extent is partial and provide an explicit action to expand it.
- Staleness is view-specific and rememberable only on views where it is meaningful. It must never implicitly transition lifecycle, archive, delete, complete, or purge a Task.
- For any date-organized preset, a missing value for that preset's date dimension is represented by the final **Unspecified** bucket rather than being silently omitted, unless the preset's defining semantics explicitly require that date to exist.

#### Firestore Candidate Queries and Index Contract — Milestones 1–3

For Milestones 1–3, registered collaboration is not yet active, so Task candidate queries are scoped by `owner_email == currentUser.email`. Shared-task discovery is deferred to Milestone 6. Server-side predicates define the preset candidate universe; Category, Priority, remembered presentation refinements, runtime system-tag modifiers, grouping, and final display sort are applied client-side unless later measurements justify additional indexed predicates.

Use nested lifecycle fields directly: `lifecycle.macro` and `lifecycle.micro`. Use `availability` as the archive/delete retrieval projection.

Let:
- `today` = current calendar date in the user's stored IANA timezone, formatted `YYYY-MM-DD`.
- `horizonDays = max(30, 2 × far_days)`.
- `futureBoundary` = `today + horizonDays`.
- `pastBoundaryTs` = current instant minus `horizonDays`.
- `staleBoundaryTs` = current instant minus the view's `stale_days`.

Candidate query shapes:

- **Focus**
  - Query Tasks where `owner_email == me`, `availability == "working"`, `lifecycle.macro in ["upcoming","active"]`, and `due_date <= futureBoundary`.
  - Order by `due_date ASC`.
  - This single range includes all overdue Tasks and the loaded future extent.
  - `due_date == null` is intentionally excluded because Due is intrinsic to Focus.
  - Expansion moves `futureBoundary` outward and reruns the same view-level query.

- **Resolve**
  - Query Tasks where `owner_email == me`, `availability == "working"`, and `lifecycle.micro in ["waiting","blocked","on_hold"]`.
  - Retrieve the complete matching set; no date or staleness boundary is applied.
  - Grouping and stale emphasis are client-side. There is no normal extent-expansion query.

- **Prioritize**
  - Dated branch: query Tasks where `owner_email == me`, `availability == "working"`, `lifecycle.macro in ["upcoming","active"]`, and `due_date <= futureBoundary`; order by `due_date ASC`.
  - Unspecified branch: query Tasks where the same owner/availability/lifecycle predicates apply and `due_date == null`.
  - Merge the two branches client-side. The null branch becomes the final **Unspecified** bucket when organized by Due.
  - Expansion moves only the dated branch's `futureBoundary` outward; the Unspecified branch remains complete.

- **Plan**
  - Query Tasks where `owner_email == me`, `availability == "working"`, `lifecycle.macro in ["upcoming","active"]`, `due_date == null`, and `created_at >= pastBoundaryTs`.
  - Order by `created_at DESC`.
  - Apply `updated_at` staleness classification client-side; default `stale_days = 60`. Stale Plan Tasks are not silently discarded.
  - Expansion moves `pastBoundaryTs` backward and reruns the same view-level query.

- **Follow Up**
  - Query `collectionGroup("states")` where `user_email == me`, `hidden_until > now`, and `hidden_until <= futureBoundaryInstant`; order by `hidden_until ASC`.
  - Resolve returned `task_id` values to Task documents, then retain Tasks visible to the current user and valid for Follow Up.
  - Expansion moves `futureBoundaryInstant` outward.
  - Normal views suppress currently hidden Tasks after per-user state enrichment; Follow Up intentionally includes them.

- **All Active**
  - Default query: Tasks where `owner_email == me`, `availability == "working"`, `lifecycle.macro in ["upcoming","active"]`, and `updated_at >= staleBoundaryTs`.
  - Order by `updated_at DESC`.
  - Default `stale_days = 60`.
  - Explicit inclusion of stale Tasks removes/extends the `updated_at` lower boundary at the view level; stale Tasks remain valid Tasks and are never lifecycle-mutated by this rule.

- **Recently Closed**
  - Query Tasks where `owner_email == me`, `availability == "working"`, `lifecycle.macro == "completed"`, and `completed_at >= pastBoundaryTs`.
  - Order by `completed_at DESC`.
  - Expansion moves `pastBoundaryTs` backward.
  - Archived or deleted Tasks are intentionally handled by Unarchive/Recover rather than the normal Recently Closed working set.

- **Unarchive**
  - Query Tasks where `owner_email == me`, `availability == "archived"`, and `archived_at >= pastBoundaryTs`.
  - Order by `archived_at DESC`.
  - Expansion moves `pastBoundaryTs` backward.

- **Recover**
  - Query Tasks where `owner_email == me`, `availability == "deleted"`, `deleted_at >= pastBoundaryTs`, and `purge_after > now`.
  - Order by `deleted_at DESC`, then `purge_after ASC` where required by the selected Firestore index/query plan.
  - Expansion moves `pastBoundaryTs` backward but never bypasses `purge_after > now`.

Per-user enrichment:
- `collectionGroup("preferences").where("user_email","==",me)` provides the user's system-tag map for candidate refinement.
- `collectionGroup("states").where("user_email","==",me).where("hidden_until",">",now)` provides active Hide-until state for suppression in normal views.
- Security Rules v2 must explicitly authorize these collection-group queries using the same user-identity constraints; Rules are authorization constraints, not post-query filters.

Initial composite-index contract:
- Tasks: `owner_email, availability, lifecycle.macro, due_date ASC` — Focus and Prioritize dated branch.
- Tasks: `owner_email, availability, lifecycle.macro, due_date` — Prioritize Unspecified branch; retain as a distinct index only if Firestore does not satisfy it through an existing compatible index.
- Tasks: `owner_email, availability, lifecycle.micro` — Resolve.
- Tasks: `owner_email, availability, lifecycle.macro, due_date, created_at DESC` — Plan.
- Tasks: `owner_email, availability, lifecycle.macro, updated_at DESC` — All Active.
- Tasks: `owner_email, availability, lifecycle.macro, completed_at DESC` — Recently Closed.
- Tasks: `owner_email, availability, archived_at DESC` — Unarchive.
- Tasks: `owner_email, availability, deleted_at DESC, purge_after ASC` — Recover.
- Collection group `states`: `user_email, hidden_until ASC` — Follow Up and active Hide-until lookup.
- Collection group `preferences`: explicit ascending single-field collection-group index on `user_email` — per-user preference enrichment (DEC-069).

Index policy:
- The minimum intended explicit composite-index set is frozen as: Tasks `owner_email, availability, lifecycle.macro, due_date ASC`; Tasks `owner_email, availability, lifecycle.micro`; Tasks `owner_email, availability, lifecycle.macro, due_date, created_at DESC`; Tasks `owner_email, availability, lifecycle.macro, updated_at DESC`; Tasks `owner_email, availability, lifecycle.macro, completed_at DESC`; Tasks `owner_email, availability, archived_at DESC`; Tasks `owner_email, availability, deleted_at DESC, purge_after ASC`; and collection-group `states` `user_email, hidden_until ASC`.
- Do not add a separate Prioritize null-Due composite index initially: the frozen `owner_email, availability, lifecycle.macro, due_date ASC` index is intended to serve both the dated and null-Due branches unless operational validation proves otherwise.
- Do not add an explicit composite index for collection-group `preferences.user_email`. DEC-069 enables an ascending single-field `COLLECTION_GROUP` index through a field override, preserving existing collection-scope defaults. Automatic single-field indexing has collection scope by default and does not supply this group-scoped index.
- Create indexes for preset-defining retrieval, not for every Category/Status/Priority/custom-sort combination.
- Final view grouping and user-selected sort remain client-side over the bounded candidate set.
- Validate the exact generated index set with emulator/integration tests and Firestore Query Explain before treating index ordering as operationally final. In particular, validate the Recover query's multiple inequality fields (`deleted_at` and `purge_after`) against the actual SDK query and index plan. Operational field-order/redundancy adjustments that preserve the frozen query semantics do not require a product-semantic change.
- Pagination/page-size policy is deferred until measured candidate-set behavior warrants it; view-level date/staleness bounds are the primary Milestone 1–3 read-control mechanism.

#### User-Task Data Separation Rule

User ↔ Task-specific values remain separate from the shared Task document but are stored as **Task subcollections**, reflecting their task-scoped nature and expected small participant counts. They are not embedded directly in the Task document.

#### User Task Preference Schema — Milestones 1–3

Canonical Firestore path:

```text
/tasks/{taskId}/preferences/{uid}
```

Canonical document shape:

```text
{
  task_id: string,
  user_email: string,

  system_tags: {
    importance: "important" | "not_important" | null,
    urgency: "urgent" | "not_urgent" | null,
    dow: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[],
    tod: ("early_morning" | "midmorning" | "afternoon" | "evening" | "night")[]
  },

  created_at: Timestamp,
  updated_at: Timestamp
}
```

**Invariants**
- The document ID equals the authenticated Firebase UID.
- `task_id` identifies the containing Task and is immutable.
- `user_email` equals the authenticated user's canonical email and is immutable.
- `dow` and `tod` contain only approved enum values and no duplicates.
- Importance/Urgency explicit negative values remain distinct from `null` / unclassified.
- `created_at` is immutable; `updated_at` uses server time.
- A user may create/update/delete only their own preference document and only when the parent Task is readable. Direct document gets also require parent access and matching UID.
- Preference list queries use the DEC-067 identity-only exception (`user_email == me`); this includes collection-group and ordinary collection lists, even when the parent is missing/inaccessible.

#### User Task State Schema — Milestones 1–3

Canonical Firestore path:

```text
/tasks/{taskId}/states/{uid}
```

Canonical document shape:

```text
{
  task_id: string,
  user_email: string,
  hidden_until: Timestamp | null,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

**Invariants**
- The document ID equals the authenticated Firebase UID.
- `task_id` identifies the containing Task and is immutable.
- `user_email` equals the authenticated user's canonical email and is immutable.
- When `hidden_until` is non-null for an active Hide Until operation, it must be in the future at the time it is set.
- Expired timestamps may remain stored; active/inactive state is derived from current time.
- Clearing Hide Until retains the state document and sets `hidden_until = null`; it does not delete the state document.
- The state document is reserved for current/future per-user system state, so stable document identity is intentional.
- Direct client writes are denied; trusted backend callables manage Hide Until.
- State changes do not alter Task lifecycle, Task `updated_at`, or System Changes.
- State list queries use the DEC-067 identity-only exception (`user_email == me`); this includes collection-group and ordinary collection lists, even when the parent is missing/inaccessible. Direct document gets retain matching UID and parent-access checks.

#### Reminder Schema — Milestones 1–3

Canonical Firestore path:

```text
/tasks/{taskId}/reminders/{reminderId}
```

Canonical document shape:

```text
{
  task_id: string,
  user_email: string,
  remind_at: Timestamp,

  delivery_state:
    "scheduled" |
    "delivered" |
    "cancelled" |
    "failed",

  created_at: Timestamp,
  updated_at: Timestamp,
  delivered_at: Timestamp | null
}
```

**Invariants**
- `task_id` identifies the containing Task and is immutable.
- `user_email` is the reminder owner's canonical email and is immutable.
- `remind_at` is required.
- New reminders start with `delivery_state = "scheduled"`.
- `delivered_at` is non-null only when `delivery_state == "delivered"`.
- Delivery transitions to `delivered` or `failed` are backend-worker controlled.
- Cancel sets `delivery_state = "cancelled"`; normal client behavior does not physically delete reminder records.
- Reminder mutations do not alter Task `updated_at`.
- Users may read only their own reminders when the parent Task is readable.
- Create/update/cancel operations use trusted backend callables.

Canonical logical/physical separation:

- `/tasks/{taskId}/preferences/{userId}` — **UserTaskPreference**. System tags are stored in a structured `system_tags` map rather than as unrelated top-level fields or a flat tag array. Current dimensions are `importance`, `urgency`, `dow`, and `tod`. New dimensions require an approved product definition and validation semantics.
- `/tasks/{taskId}/states/{userId}` — **UserTaskState** for system-managed per-user state such as **Hide until** / `hidden_until` and future user-specific system state.
- `/tasks/{taskId}/reminders/{reminderId}` — **Reminder** documents; multiple reminders per user/task are allowed.

The canonical preference document also carries `task_id` and `user_email` to support secure collection-group queries. For Importance/Urgency, explicit negative values remain distinct from unclassified/null. DOW/TOD are multi-select dimensions.

Cross-task query projections/indexes may be introduced as derived, non-authoritative structures during Firebase Architecture when required by Home, Tasks, Saved Views, or collaboration. No `userTaskIndex` is required for Milestones 1–2 unless measured/query constraints justify it.

#### Reminders and Hide Until

- Reminders are per-user and per-task, with a required `remind_at` date/time and delivery state.
- **Hide until** is system-managed per-user task state, triggered by a user action and stored as `hidden_until`.
- Tasks hidden until a future time are suppressed from normal working views until `hidden_until`, while remaining retrievable through Search and the global **Follow Up** preset.
- Hide until is distinct from lifecycle states such as Waiting/Blocked/On Hold: lifecycle states describe the shared Task's progress, while Hide until only controls when the current user wants the Task surfaced.
- Hide until is also distinct from DOW/TOD/Important/Urgent because those are user-managed system tags, while Hide until is time-bound system-managed state.

#### Recurrence

- Recurrence rules are modeled separately from generated task instances.
- Each generated occurrence is an independent Task with linkage to its recurrence rule/series.
- Past occurrences are not rewritten by edits to future recurrence behavior.
- Recurrence evaluation retains timezone context and supports `This occurrence` and `This and future occurrences` behavior.

#### View Preference Schema — Milestones 1–3

Canonical Firestore path:

```text
/users/{uid}/view_preferences/{viewKey}
```

Canonical document shape:

```text
{
  schema_version: 1,

  primary_organization: "time" | "category" | "status",

  time_thresholds: {
    near_days: number,
    medium_days: number,
    far_days: number
  } | null,

  stale_days: number | null,

  filters: {
    category_ids: string[],
    lifecycle_states: string[],
    priority: boolean | null
  },

  sort: {
    field:
      "title" | "due" | "start" | "created" |
      "priority" | "category" | "status",
    direction: "asc" | "desc"
  },

  remembered_at: Timestamp,
  updated_at: Timestamp
}
```

**Invariants**
- `viewKey` is one supported product-defined preset identifier.
- Only the matching authenticated user may read/write/delete the document.
- Document existence means the preset has an explicitly remembered configuration.
- Remember writes the complete resolved snapshot; temporary modifications do not write this document.
- Reset physically deletes the document and returns the view to current product defaults.
- If `time_thresholds` is present, it must satisfy `0 < near_days < medium_days < far_days`.
- `time_thresholds` may be `null` when the preset does not use time thresholds.
- `stale_days` may be non-null only for presets whose approved semantics support staleness.
- Filters and sort fields are validated against the capabilities supported by that specific preset rather than assumed universally valid.
- `category_ids` must reference categories belonging to the current user.
- Runtime Important/Urgent/DOW/TOD modifiers are not persisted here.
- `remembered_at` is set when Remember is explicitly invoked.
- `updated_at` changes whenever the remembered configuration is rewritten.
- The document is schema-versioned for deliberate future migration.

**Approved remembered-view capability matrix (DEC-066)**

Preset document IDs use the snake_case identifiers below. Lifecycle filters use canonical micro-state IDs; an empty list means no additional filter. Category and Priority filters are supported by every preset. The preset's existing candidate/retrieval contract remains authoritative.

| Preset ID | Primary organization | Time thresholds | Stale days | Allowed sort fields | Lifecycle filters |
|---|---|---|---|---|---|
| `focus` | time, category, status | required for time; otherwise null or ordered map | null | title, due, start, created, priority, category, status | upcoming/active micro-states |
| `resolve` | category, status | null | null | title, due, start, created, priority, category, status | waiting, blocked, on_hold |
| `prioritize` | time, category, status | required for time; otherwise null or ordered map | null | title, due, start, created, priority, category, status | upcoming/active micro-states |
| `plan` | time, category, status | required for time; otherwise null or ordered map | null or positive integer | title, start, created, priority, category, status | upcoming/active micro-states |
| `follow_up` | time, category, status | required for time; otherwise null or ordered map | null | title, due, start, created, priority, category, status | all approved micro-states |
| `all_active` | category, status | null | null or positive integer | title, due, start, created, priority, category, status | upcoming/active micro-states |
| `recently_closed` | time, category, status | required for time; otherwise null or ordered map | null | title, due, start, created, priority, category, status | done, cancelled, unable_to_complete |
| `unarchive` | time, category, status | required for time; otherwise null or ordered map | null | title, due, start, created, priority, category, status | all approved micro-states |
| `recover` | time, category, status | required for time; otherwise null or ordered map | null | title, due, start, created, priority, category, status | all approved micro-states |

- Every supported sort permits `asc` and `desc`. Plan excludes Due sorting because every candidate has no Due date.
- Threshold values are positive integers satisfying `near_days < medium_days < far_days`. Time organization uses the preset's existing governing date; no new date projection is introduced.
- `category_ids` contains at most 10 unique owned Category IDs, including archived owned Categories. This operational cap permits ownership checks within the per-operation Rules document-access budget.
- Lifecycle-filter lists contain no duplicates. Upcoming/active micro-states are `draft`, `planned`, `ready`, `in_progress`, `waiting`, `blocked`, `on_hold`, and `review`.
- A null `stale_days` means no persisted staleness cutoff, preserving the existing explicit ability to include stale Tasks.

#### Activity and Threads

- Activity/conversation data is stored under the containing Task: `/tasks/{taskId}/threads/{threadId}/entries/{entryId}`.
- Human-readable rendering of System Changes is always derived from canonical structured data; rendered prose is not stored as the canonical audit record.
- Firestore Security Rules v2 is used from the outset so later collection-group queries remain available.

#### System Changes Thread Schema — Milestones 1–3

Canonical Firestore path:

```text
/tasks/{taskId}/threads/system_changes
```

Canonical document shape:

```text
{
  type: "system_changes",
  subject: "System Changes",
  created_by_email: string,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

**Invariants**
- Every Task has exactly one System Changes thread.
- The deterministic thread document ID is `system_changes`.
- The thread is created as part of root Task/subtask creation.
- `type`, `subject`, `created_by_email`, and `created_at` are immutable.
- `updated_at` advances when a System Changes entry is appended.
- Ordinary clients cannot create/update/delete the System Changes thread.
- The thread is readable whenever the parent Task is readable.
- Future human conversation threads use separate IDs/types.

#### System Changes Entry Schema — Milestones 1–3

Canonical Firestore path:

```text
/tasks/{taskId}/threads/system_changes/entries/{entryId}
```

Canonical document shape:

```text
{
  type: "system_change",

  actor_email: string,
  occurred_at: Timestamp,

  action: string,

  previous_state: {
    macro: string,
    micro: string
  } | null,

  new_state: {
    macro: string,
    micro: string
  } | null,

  reason: string | null,

  changes: {
    <field_path>: {
      before: any,
      after: any
    }
  }
}
```

**Invariants**
- Entry IDs are backend-generated.
- Entries are append-only and immutable.
- Ordinary clients cannot create/update/delete System Changes entries.
- `actor_email` is resolved from trusted authenticated backend context.
- `occurred_at` uses server time.
- `action` uses an approved stable action identifier.
- Lifecycle actions populate `previous_state` and `new_state`; non-lifecycle actions may use `null`.
- `reason` follows the approved required/optional action semantics.
- `changes` contains only fields materially changed by the action.
- Structured audit values are canonical.
- No redundant rendered prose/message is stored as canonical System Changes content.
- Task mutation and its System Changes entry are written atomically in the same trusted transaction.

#### Attachments and File Content

- Attachment metadata is stored separately from the Task and may reference either the task generally or a specific activity entry.
- Metadata includes uploader email, filename, MIME type, size, storage reference, and timestamps.
- Actual binary content is stored in object storage, not Firestore.
- Archiving a task retains its files.
- Soft deletion retains file content during the recovery period.
- Permanent purge removes both attachment metadata and the underlying stored object.
- Exact retention periods, quotas, size/type limits, and object-storage lifecycle rules are deferred to Firebase Architecture / operations.

#### External Secure Access

- External Consultant/Reviewer and Informed access uses dedicated secure-access records tied to task, participant email, role, token hash, validity/revocation state, and access metadata.
- Raw secure-link tokens are not stored directly.
- Registered-vs-external status is resolved from whether the participant email maps to a Taskify account.

#### Archive, Soft Delete, and Purge

- Archive is a normal long-lived user state; archived records are excluded from normal active views by default but remain queryable.
- Soft delete provides temporary recoverability and removes records from normal UX.
- Permanent purge occurs after a retention period and removes owned dependent data, including attachments and object-storage content.
- Exact retention duration and purge mechanism are deferred to Firebase Architecture / operations.

#### Preset Views and View Preferences

- Preset definitions are application-owned client query strategies, not Firestore saved-query documents.
- No user-created Saved View persistence model is required.
- Full remembered per-view preference snapshots are stored under the user as approved in Per-View Preferences.
- Each preset may expose independently tuned defaults and supported customization parameters.
- Dynamic system-tag modifiers remain runtime state and are not part of the remembered view snapshot unless explicitly approved later.
- Initial global preset order and user question:
  1. **Focus** — "What needs my attention now or very soon?" Overdue or due within the next 3 calendar days.
  2. **Resolve** — "What is stuck or paused and needs intervention?" Blocked, On Hold, or Waiting.
  3. **Prioritize** — "What should I work on first based on deadlines?" Active tasks grouped by Due date, with no-due tasks last.
  4. **Plan** — "What tasks have no due date and still need scheduling or commitment?" Active tasks with no Due date, grouped by Created-date bucket: Today, Previous 7 Days, Previous 30 Days, Older; within each bucket order by Category, then Created date.
  5. **Follow Up** — "What have I deliberately hidden that I need to revisit later?" Tasks with active `hidden_until`.
  6. **All Active** — "What work is currently open?" All non-completed, non-archived, non-deleted tasks.
  7. **Recently Closed** — "What have I finished, cancelled, or otherwise closed recently?" Terminal tasks closed in the past 15 days using `completed_at`.
  8. **Unarchive** — "What archived tasks can I bring back into normal use?" Archived tasks available to restore.
  9. **Recover** — "What deleted tasks can I still restore?" Soft-deleted tasks still within the recovery window.
- Preset grouping/presentation is fixed as follows:
  - **Focus** — group by Due-date bucket: Overdue, Today, Next 3 Days.
  - **Resolve** — group by lifecycle micro-state: Blocked, Waiting, On Hold.
  - **Prioritize** — group by Due-date bucket/date, chronological, No Due last.
  - **Plan** — group by Created-date bucket: Today, Previous 7 Days, Previous 30 Days, Older; within each bucket order by Category, then Created date.
  - **Follow Up** — group by hidden-until date bucket: Today, Tomorrow, Later.
  - **All Active** — no grouping.
  - **Recently Closed** — group by closed-date bucket.
  - **Unarchive** — group by archived-date bucket.
  - **Recover** — group by deleted-date bucket.
- Whenever the primary grouping is date-based, **Category is the secondary ordering key**. Time/date ordering then resolves within Category as appropriate to the view. This is an ordering rule, not nested visible grouping.

#### Search

- No separate logical SearchIndex entity is required at this stage.
- Search fields remain on their native entities. A derived search index may be introduced later during Firebase Architecture if required.

#### Related Tasks

No Related Tasks / See Also relationship is included in the current data model. The concept remains deferred due to risk of encouraging project-management-style dependency/work-breakdown usage.

#### Firestore Modeling Boundary

- Logical decisions about what belongs on Task versus user-owned or unbounded collections are fixed here.
- Exact Firestore collection paths, subcollection layout, denormalization, indexes, and security-rule implementation are deferred to the Firebase Architecture stage.
