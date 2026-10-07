# Taskify Backend Architecture

> Authoritative trusted mutation, transaction, and scheduler architecture. Load through `docs/project_status.md`.

#### Category Mutation Boundary — Milestones 1–3

Category identity/state mutations use trusted backend operations where cross-document uniqueness or archive/reactivation semantics are involved.

**Backend callables**
```text
createCategory({
  name
})
```

```text
renameCategory({
  category_id,
  name,
  expected_updated_at
})
```

```text
setCategoryArchived({
  category_id,
  archived: boolean,
  expected_updated_at
})
```

```text
resetCategoryOrder({})
```

**Reset contract (DEC-074)**
- DEC-077 replaces the earlier `resetCategoriesToDefaults` endpoint specification with `resetCategoryOrder({})`. This is an order-only operation, not default restoration. The old endpoint was never implemented; source API-contract changes remain pending implementation.
- Resolve the owner server-side and use the current Category set in one atomic transaction. The request contains no client-supplied Category IDs or per-Category `expected_updated_at` tokens. Re-read/retry material state as required; this does not weaken concurrency checks on individual rename/archive operations.
- Return all owned Categories, including archived ones, in resulting alphabetical order using this Firebase-independent response shape:
  ```text
  {
    changed_count: number,
    categories: [
      {
        category_id: string,
        display_order: number,
        updated_at: ApiTimestamp
      }
    ]
  }
  ```
- `changed_count` counts Categories whose persisted numeric order changed. Unchanged entries retain their timestamps. Empty/already-correct sets succeed with `changed_count = 0`. Do not add a synthetic collection-level timestamp.
- Resolve the authenticated canonical email server-side and atomically read/reorder all owned Categories, including custom and archived entries, according to the Category order-reset contract in `docs/data_model.md`.
- Preserve archive state, identity, names, default provenance, creation timestamps, uniqueness guards, and Task references. Only changed numeric `display_order` values and their server-time `updated_at` may be written.
- An already-correct effective alphabetical order causes no writes, including when existing numeric order values have gaps. Repeated Reset remains idempotent.
- Default provisioning is separate; Reset must not create missing defaults or reactivate Categories.

**Normalization and uniqueness**
- Clients submit user-facing `name`; `normalized_name` is derived only by trusted backend code.
- Trim the submitted name, normalize its display form to Unicode NFC, preserve display casing/internal whitespace/accents/punctuation, and enforce a non-empty maximum of 15 characters. Derive the uniqueness key using locale-independent lowercasing (DEC-075).
- Category-name uniqueness is scoped per owner as `owner_email + normalized_name`.
- A transactional uniqueness guard is maintained separately from the canonical Category document so concurrent create/rename/reactivate operations cannot race.
- Canonical Category identity remains `category_id`; the uniqueness guard is derived/non-authoritative metadata.
- Create, rename, archive/reactivate, and default provisioning maintain uniqueness guards atomically where required. Order Reset is atomic but does not mutate names or guards.

**Field ownership**
- Backend-controlled: `owner_email`, `normalized_name`, `is_default`, `archived_at`, `created_at`.
- User-facing category name changes use backend callables.
- `updated_at` uses server time for all category mutations.
- Default names and archive state are protected; only custom Categories may change those fields. Both default/custom Categories may be reordered. No-op operations preserve every timestamp under the DEC-076 mutation contract.

**Category mutation semantics (DEC-076)**
- Unauthenticated callers receive `UNAUTHENTICATED`. Malformed inputs and missing/foreign Category targets receive `INVALID_ARGUMENT`; do not disclose foreign Category existence.
- Create/rename collisions with another owned Category's normalized name receive `DUPLICATE_ARGUMENT`, whether the existing Category is active or archived. Do not implicitly reactivate or reuse it. A rename retaining its own normalized key is not a duplicate.
- Reject an actual default name/archive change with `INVALID_ARGUMENT`.
- Rename/archive requests retain `expected_updated_at`. Re-read material state transactionally and return `CONFLICT` for a stale token, even when the requested value already matches current state.
- After ownership, validation and concurrency checks, an unchanged request succeeds with the existing timestamp and performs no writes. Default protection forbids changes; it does not turn an unchanged matching-state request into a mutation.
- Valid custom changes are atomic, set Category `updated_at` to server time, preserve Category identity and Task references, and maintain any affected uniqueness guards. A display-casing-only rename changes the name/timestamp but retains its normalized key.
- `DUPLICATE_ARGUMENT` is an approved generic domain error code. Its API-contract enum/transport mapping must be implemented and verified during the separately approved Category implementation; no Category-specific missing/duplicate codes are introduced.

**Registration provisioning / new custom ordering (DEC-075)**
- Trusted account-registration work provisions the 13 alphabetically ordered defaults defined in `docs/data_model.md`. The implementation mechanism and registration-failure coordination remain to be reviewed; no new trigger or callable is selected by this requirement alone.
- New custom Categories are placed after the last existing owned Category, including archived entries. Ordering/uniqueness must be safe under concurrent creation without introducing an unapproved global uniqueness/contiguity invariant for display order.
- Registration provisioning adds defaults; order Reset preserves existing Category data and never performs provisioning.

**Reordering**
- Category reorder may remain a direct Firestore batched write.
- Direct reorder writes may change only `display_order` and `updated_at`.
- No contiguous-order invariant is required for Milestones 1–3; display order only needs to remain deterministic for the client.

**Task category assignment**
- Task `category_id` remains an approved ordinary direct Task edit.
- Security Rules must verify the referenced Category exists, belongs to the Task owner, and is active (`archived_at == null`) before accepting a new assignment.
- Existing Tasks may continue referencing archived Categories.

#### Backend Callable/API and Transaction Contract — Milestones 1–3

Use Firebase 2nd-generation callable functions as the client-facing trusted backend boundary for business actions. Callable handlers authenticate the Firebase user, resolve the canonical user email server-side, validate authorization and current document state, and execute domain mutations in Firestore transactions. Client-supplied identity fields are never trusted.

**General mutation contract**
- Task business-action calls use optimistic concurrency through the Task's current `updated_at`.
- Standard request shape:
  ```text
  {
    task_id,
    expected_updated_at,
    ...action_specific_payload
  }
  ```
- If the current Task `updated_at` differs from `expected_updated_at`, return `CONFLICT` without applying the mutation.
- All Task mutations set `updated_at` from server time.
- Transaction handlers re-read every document whose state is material to authorization or validation inside the transaction.
- A successful business action returns the resulting authoritative Task state or the minimum authoritative fields required for immediate client reconciliation, together with the new `updated_at`.
- Retry behavior must be safe under Firestore transaction retries; handlers must not perform external side effects inside retryable transaction bodies.

**Task creation**
- Callable:
  ```text
  createTask({
    title,
    description_md,
    category_id,
    priority?,
    start?,
    due?,
    end?
  })
  ```
- Date inputs contain only canonical user intent:
  ```text
  {
    date: "YYYY-MM-DD",
    has_time: boolean,
    time: "HH:mm" | null,
    timezone: IANA string | null
  }
  ```
- Clients do not provide `instant`, scalar date projections, ownership fields, lifecycle, availability, hierarchy, or server timestamps.
- Backend derives timed `instant` values, `start_date`/`due_date`/`end_date`, identity fields, lifecycle, availability, and timestamps.
- Task creation and deterministic `system_changes` thread creation are atomic.

**Task date update**
- Callable:
  ```text
  updateTaskDates({
    task_id,
    expected_updated_at,
    start?: TaskDateInput | null,
    due?: TaskDateInput | null,
    end?: TaskDateInput | null
  })
  ```
- Omitted date fields mean unchanged; explicit `null` clears that date.
- Backend validates date/time format and IANA timezone, derives timed `instant` projections, synchronizes scalar date fields, and sets Task `updated_at`.
- Uses the same optimistic-concurrency contract as lifecycle actions.
- Date-only values retain `time = null`, `timezone = null`, and `instant = null`.
- Explicit Start/End values continue to follow the approved lifecycle non-overwrite rules.

**Lifecycle / archive / delete endpoint**
- Client callable:
  ```text
  executeTaskAction({
    task_id,
    action,
    expected_updated_at,
    payload?: {
      reason?: string
    }
  })
  ```
- Milestone 1–3 actions:
  - `start`
  - `wait_for_input`
  - `mark_blocked`
  - `put_on_hold`
  - `resume`
  - `complete`
  - `cancel`
  - `mark_unable`
  - `reopen`
  - `archive`
  - `restore_archive`
  - `delete`
  - `restore_delete`
- The callable is a thin dispatcher to internal action handlers; transition logic is not duplicated across endpoints.
- Each action transaction:
  1. reads the Task;
  2. verifies ownership/authorization and recoverability/deletion conditions;
  3. checks `expected_updated_at`;
  4. validates the requested transition/action against the approved lifecycle contract;
  5. applies Task changes, including `availability`, relevant timestamps, `completed_at`, and automatic Start/End behavior;
  6. writes one structured System Changes entry in the Task's default System Changes thread;
  7. commits Task + System Changes atomically.
- Required/optional reason semantics follow the approved lifecycle contract.
- Reopen clears `completed_at` but preserves End unless a later approved rule changes that behavior.
- Archive/restore archive do not change lifecycle.
- Delete/restore delete do not change lifecycle; soft delete sets `deleted_at`, `purge_after`, and `availability = "deleted"`. Restore delete clears delete/recovery fields and restores `availability` from the preserved archive state.

**Subtask creation**
- Callable:
  ```text
  createSubtask({
    parent_task_id,
    expected_parent_updated_at,
    task: {
      title,
      description_md?,
      category_id,
      priority?,
      start?,
      due?,
      end?
    }
  })
  ```
- Transaction reads the parent and validates:
  - caller owns or is otherwise permitted by the current milestone's hierarchy rule;
  - parent is not deleted and is eligible for child creation;
  - one-level hierarchy limit is not exceeded;
  - `expected_parent_updated_at` still matches;
  - referenced category is valid for the new Task Owner.
- The new subtask is created as a normal Task with:
  - `type = "task"`;
  - creator as Owner/Executor in the Milestone 1–3 individual flow;
  - `lifecycle = Upcoming:Planned`;
  - `availability = "working"`;
  - correct `parent_task_id` and `root_task_id`;
  - synchronized rich/scalar dates;
  - server timestamps.
- Parent Task data is changed only if an approved parent metadata field requires it; otherwise parent `updated_at` need not change merely because a child was created.
- Creation and any required System Changes entry are atomic.

**Hide Until**
- Callables:
  ```text
  hideTaskUntil({
    task_id,
    hidden_until,
    expected_task_updated_at?
  })

  clearHiddenUntil({
    task_id
  })
  ```
- Validate Task readability/access and that `hidden_until` is in the future when set.
- Upsert/delete or clear the caller's `/tasks/{taskId}/states/{uid}` state atomically as appropriate.
- `task_id` and `user_email` are server-derived/validated identity fields.
- Hide Until does not mutate Task lifecycle and does not create a lifecycle System Changes entry.
- Task `updated_at` is not changed solely because one user's private Hide Until state changed.

**Reminders**
- Callables:
  ```text
  createReminder({
    task_id,
    remind_at
  })

  updateReminder({
    task_id,
    reminder_id,
    remind_at
  })

  cancelReminder({
    task_id,
    reminder_id
  })
  ```
- Validate caller access to the Task and ownership of the reminder.
- Create sets `delivery_state = "scheduled"` and server-maintained identity/timestamps.
- Update is allowed only while the reminder remains editable under the current delivery-state rules and resets scheduling metadata as needed.
- Cancel sets `delivery_state = "cancelled"`; clients do not physically delete delivered/auditable reminder records unless a later retention policy permits it.
- Delivery transitions to `delivered` or `failed` and `delivered_at` are backend-worker controlled, not callable-client controlled.
- Reminder mutations do not change Task `updated_at` solely because a personal reminder changed.

**Automatic Planned → Ready promotion**
- The automatic `Upcoming:Planned -> Upcoming:Ready` transition when Start arrives is a trusted backend process, not a client direct write.
- Milestones 1–3 use a Firebase 2nd-generation scheduled function / Cloud Scheduler sweeper running every **4 hours**.
- Candidate retrieval uses working Planned Tasks whose `start_date` is due/past relative to the evaluation date; backend code then evaluates the exact TaskDate semantics.
- Eligibility requires:
  - `availability == "working"`;
  - `lifecycle.macro == "upcoming"`;
  - `lifecycle.micro == "planned"`;
  - `start != null`;
  - for timed Start, `start.instant <= now`;
  - for date-only Start, `start.date <= today` using the Task Owner's stored timezone.
- Each candidate is processed transactionally. The transaction re-reads the Task and re-checks all eligibility predicates before mutation.
- A successful promotion changes only lifecycle to `upcoming/ready`, sets Task `updated_at` to server time, and appends one structured System Changes entry with stable action identifier `auto_ready`.
- Start/End values are not modified by the automatic promotion.
- The transition is idempotent because only a Task still in `upcoming/planned` is mutated; duplicate or overlapping scheduler invocations therefore become no-ops after the first successful promotion.
- If a scheduler run fails, the next sweep naturally re-discovers still-eligible Planned Tasks; no separate scheduler-state document is required.
- No System Changes entry is written for skipped/non-eligible candidates.
- Milestones 1–3 do not add a per-Task scheduling queue or a separate `start_instant` query projection. The 4-hour cadence is accepted because most Task usage is expected to operate at day resolution; a timed Start may therefore become Ready up to approximately four hours after its exact instant.
- If later measurement or product requirements demand tighter timed precision, a dedicated query projection or per-Task scheduling mechanism may be proposed separately.

**Direct client writes remain outside callables**
- Approved ordinary non-date Task edits, category management, per-user system-tag preferences, and remembered view preferences remain direct Firestore client operations protected by Security Rules. Root Task creation and all Start/Due/End mutations use trusted backend callables.
- Business-action callables must not become a generic Task-update endpoint.

**Stable backend error codes**
- `UNAUTHENTICATED`
- `TASK_NOT_FOUND`
- `NOT_AUTHORIZED`
- `INVALID_ARGUMENT`
- `DUPLICATE_ARGUMENT` (Approved by DEC-076; implementation pending)
- `INVALID_TRANSITION`
- `REASON_REQUIRED`
- `TASK_DELETED`
- `TASK_NOT_RECOVERABLE`
- `PARENT_NOT_ELIGIBLE`
- `SUBTASK_DEPTH_EXCEEDED`
- `REMINDER_NOT_FOUND`
- `INVALID_REMINDER_STATE`
- `CONFLICT`
- `INTERNAL`
- Error payloads may include safe machine-readable context, but must not expose unauthorized Task existence/details.

**Transaction boundaries**
- Task + System Changes for a business action: one Firestore transaction.
- Subtask creation + hierarchy validation + required System Changes: one Firestore transaction.
- Hide Until state mutation: one transaction/batched atomic mutation scoped to the user-state document and any required validation reads; no Task write unless required by a later approved invariant.
- Reminder create/update/cancel: one transaction over the reminder plus Task-access validation reads; no Task write solely for reminder state.
- External side effects such as future notification delivery, email, or push dispatch occur after committed domain state and must use idempotent/outbox-style processing if introduced; they are never relied upon for transaction atomicity.

**Backend tests**
- Emulator/integration tests are mandatory for every callable action.
- Tests cover authorization, expected-state validation, optimistic-concurrency conflicts, required reasons, timestamp/date behavior, `availability` transitions, atomic System Changes creation, subtask-depth rules, Hide Until isolation, reminder state transitions, transaction retry safety, and idempotent automatic Planned→Ready behavior.

## Internal `apps/api` Structure

**Status:** Approved

The backend uses a feature-oriented structure with thin Firebase deployment adapters:

```text
apps/api/src/
├── functions/       # callable and scheduled Firebase entry points; thin adapters only
├── tasks/           # Task operations, lifecycle rules, and date normalization
├── categories/      # Category business operations
├── reminders/       # Reminder business operations
├── task-state/      # Hide Until operations
├── scheduled/       # scheduled business processes
├── persistence/     # shared Firebase/Firestore mechanics, paths, converters
├── auth/            # authenticated-user/canonical-identity resolution
├── audit/           # System Changes construction/writes
└── shared/          # narrow backend-wide utilities such as errors/timestamps
```

- `functions/` owns Firebase callable/scheduler declaration, context/auth extraction, contract parsing, operation invocation, and public error translation; it does not own Taskify business rules.
- Feature operations own business validation and transaction orchestration. Firestore transaction reads/writes remain explicit rather than hidden behind generic repository abstractions.
- Shared infrastructure exists only for genuinely cross-feature Firebase/auth/audit concerns.
- Do not introduce generic controller → service → repository → use-case layering unless a demonstrated future need justifies it.
- `packages/api-contracts` owns public request/response DTOs, action identifiers, and stable public error codes. Firestore persistence models, derived fields, lifecycle implementation, authorization, transaction logic, date normalization, and audit implementation remain private to `apps/api`.
- Implement files when their operations are implemented; do not pre-create placeholder source files merely to mirror the intended structure.

### Public timestamp transport

**Status:** Approved

Public API contracts are Firebase/Firestore-independent. Timestamp values crossing the trusted API boundary use canonical ISO-8601 UTC strings. Firestore `Timestamp` values and conversion logic remain private implementation details of `apps/api` and client-side adapters. This rule applies to optimistic-concurrency timestamps, Hide Until, reminders, and timestamp values returned by trusted API operations.

## API Build and Local Callable Verification

**Status:** Build/tooling design Approved (DEC-071–DEC-073); implemented locally. Executed evidence and remaining verification limits are recorded through `docs/project_status.md`.

- TypeScript 5.9.3 compiles `packages/api-contracts` first, exposing compiled ESM and declaration entry points. The API production configuration uses NodeNext module/resolution semantics and excludes test files.
- `pnpm run build:api` builds both packages. `pnpm run package:api` generates `apps/api/dist/firebase` and installs its production dependencies independently of the workspace, producing a pnpm lockfile.
- The generated artifact preserves Node.js 22 and pnpm 10.34.6, contains emitted API files and external runtime dependencies, and omits the current type-only `@taskify/api-contracts` runtime dependency only after checking the emitted JS. The source workspace dependency remains intact. A later runtime contract import requires revisiting packaging rather than silently stripping it.
- The artifact and compiled outputs are ignored build products. The generator validates its absolute destination under API `dist`, recreates only that generated artifact, and preserves its lockfile when the generated manifest is unchanged. A new clone/build without an artifact lock resolves the declared dependency ranges; no workspace lockfile is introduced in this scope.
- `firebase.json` references the generated source, codebase `api`, runtime `nodejs22`, and a build/package predeploy hook. This configuration does not authorize Functions deployment. Cloud buildpack install/start behavior has not yet been exercised.
- `pnpm run test:api:callable` packages the API, starts Auth/Functions/Firestore emulators for `demo-taskify`, and runs the Firebase client callable HTTP suite. The suite checks emulator endpoints before fixture access and does not use cloud fixtures.
- The current callable uses the SDK's default region in the emulator (`us-central1`). This local behavior does not select a cloud Functions deployment region; a future deployment plan must explicitly review region, IAM, provider configuration, and billing.
