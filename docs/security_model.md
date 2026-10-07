# Taskify Security Model

> Authoritative authorization and Firestore Security Rules baseline. Load through `docs/project_status.md`.

#### Firestore Security Rules Contract — Milestones 1–3

Security Rules v2 is the baseline. Rules enforce authorization and document-shape invariants; trusted backend code is responsible for lifecycle/business-action validation, atomic System Changes writes, archive/delete/restore semantics, hierarchy operations, reminders, and other backend-owned state transitions.

Authentication helpers should resolve the authenticated user's canonical email from Firebase Auth and compare normalized/canonical values consistently with stored domain email fields.

**Users**
- `/users/{uid}`: an authenticated user may read and update only their own profile document.
- Client updates may change only explicitly user-editable profile fields such as `display_name` and, when enabled, user-editable settings such as timezone.
- Identity-controlled fields including `uid`, canonical email fields, auth-provider identity, provider-derived profile picture provenance, and creation metadata are immutable from ordinary client updates.
- Profile creation must match `request.auth.uid` and the authenticated canonical email.

**Categories**
- Category documents are readable/writable only by their owner.
- `owner_email` is immutable after creation and must equal the authenticated user's canonical email.
- Create/update validates category name/normalized-name shape and approved category fields.
- Referenced categories are archived rather than client-deleted when product semantics require preservation; destructive delete is not part of the normal client contract.

**Task reads**
- Milestones 1–3 are individual-first. A Task is readable by its Owner; registered shared-task access is added in Milestone 6.
- Queries must include constraints compatible with Rules; Rules do not filter unauthorized Task documents out of otherwise broader queries.
- Task subcollections inherit Task-context visibility unless a stricter per-user rule is defined below.

**Root Task create**
- Direct client Task creation is denied for Milestones 1–3.
- Root Task creation uses the trusted `createTask` callable so TaskDate normalization, scalar date projections, Task initialization, and deterministic System Changes thread creation are atomic.
- The backend enforces:
  - `type == "task"`;
  - `owner_email == executor_email == created_by_email == me`;
  - empty participant arrays in the Milestone 1–3 individual flow;
  - root hierarchy fields set to null;
  - lifecycle initialized to `upcoming/planned`;
  - `availability == "working"`;
  - archive/delete/recovery/completion timestamps initialized to null;
  - valid owned category reference;
  - server timestamps and canonical TaskDate projections.
- Subtask creation continues through trusted `createSubtask`.

**Ordinary Task update**
- Direct client updates are allowed only on an owned, non-deleted Task and only for approved ordinary fields.
- Owner-editable ordinary fields for Milestones 1–3 are:
  - `title`
  - `description_md`
  - `category_id`
  - `priority`
  - `updated_at`
- Start/Due/End and scalar date projections are not direct client-editable; they are backend-controlled through `updateTaskDates`.
- Rules must reject updates that change any protected field, including:
  - `type`
  - `owner_email`, `executor_email`, `created_by_email`
  - participant arrays
  - `lifecycle`
  - `availability`
  - hierarchy fields
  - `archived_at`, `deleted_at`, `purge_after`, `completed_at`
  - `created_at`
- `updated_at` on a direct client edit must resolve to the current server request time according to the implemented timestamp pattern.
- Category changes must continue to reference a valid category owned by the current user.
- Date edits are backend-controlled. Clients submit canonical date intent to `updateTaskDates`; the backend derives scalar date projections and timed instants.
- Direct physical Task delete is denied.

**Backend-only Task actions**
- Lifecycle transitions, archive, restore archive, soft delete, restore delete, hierarchy/governance changes, and other audit-relevant business actions are denied to ordinary client writes and execute through trusted backend transactions.
- Backend actions maintain `availability` atomically with `archived_at` / `deleted_at`.
- Backend lifecycle actions maintain lifecycle, `completed_at`, automatic Start/End behavior, and System Changes atomically.

**Task preferences**
- `/tasks/{taskId}/preferences/{uid}`: readable only when the parent Task is readable and `uid == request.auth.uid`; collection-group reads additionally require `user_email == me`.
- A user may create/update/delete only their own preference document.
- `task_id` must identify the containing Task and is immutable.
- `user_email` must equal the authenticated canonical email and is immutable.
- Client-writable preference content is limited to the approved `system_tags` structure and timestamps/schema metadata required by the implementation.
- `system_tags` must validate the approved enums/cardinality rules for importance, urgency, DOW, and TOD.

**Task state / Hide Until**
- `/tasks/{taskId}/states/{uid}`: readable only for the matching authenticated user when the parent Task is readable; collection-group reads require `user_email == me`.
- Client direct writes are denied. Hide Until / clear-Hide-Until executes through trusted backend actions so identity, timestamp, and Task-access invariants are enforced consistently.
- `task_id` and `user_email` are backend-maintained identity fields.

**Reminders**
- Reminder documents are readable only by the reminder owner when the parent Task is readable.
- Direct client create/update/delete is denied for Milestones 1–3. Reminder create/update/cancel operations use trusted backend actions to protect delivery-state invariants and prevent clients from forging delivery results.
- Delivery fields such as `delivery_state` and `delivered_at` are backend-controlled.

**View preferences**
- `/users/{uid}/view_preferences/{viewKey}`: only the matching authenticated user may read/write/delete.
- Writes validate a supported `schema_version` and the approved per-view preference shape.
- Remember writes the complete resolved snapshot; Reset deletes the document.
- Runtime Important/Urgent/DOW/TOD modifier state is not persisted here unless separately approved.

**Threads / System Changes**
- Task activity/thread data is readable when the parent Task is readable.
- Milestones 1–3 do not allow ordinary client writes to the `System Changes` thread or its entries.
- System Changes entries are written only by trusted backend business actions.
- Human conversation/comment writes remain deferred to the collaboration milestone.

**Collection-group rules**
- Collection-group queries for `preferences` and `states` must be authorized using document-level identity fields (`user_email == me`) because the parent Task path is not sufficient to authorize an arbitrary collection-group query.
- Rules for collection-group reads must remain compatible with the approved query predicates; the client must issue identity-constrained queries rather than relying on Rules to discard other users' documents.

**Default-deny and testing**
- Any document/path/field mutation not explicitly allowed is denied.
- Firebase Emulator Security Rules tests are mandatory before deployment for Milestones 1–3.
- Tests must cover positive and negative cases for Task create/update/read, protected-field mutation, category ownership, date synchronization, preference isolation, collection-group isolation, Hide Until access, reminder ownership, view preferences, System Changes immutability, and archive/delete/lifecycle client-write denial.

## Permission Model

**Status:** Approved

- Permissions are task-scoped and role-based, with Owner retaining control over task intent, participation, archive/delete, and restore/reopen.
- Owner and Executor are treated as trusted collaborators. Executor may edit core task fields (including title, description, dates, location, and attachments) and manage execution-related lifecycle actions.
- Only Owner may change Owner/Executor assignment, Category, Priority, participant roles, archive/delete, or reopen/restore completed/deleted work.
- Informed participants are strictly read-only, but may download attachments.
- Consultant/Reviewer is feedback-only: may read task/activity, comment/reply, and approve/reject during review; may not edit task fields or upload files.
- External Consultant/Reviewer access via secure task link allows full read, comments/replies, attachment download, and approve/reject. Possession of the secure link is sufficient authentication for now. Links are task-scoped and revocable.
- Only parent-task Owner or Executor may create a subtask. The creator becomes the subtask Owner and Executor by default, with those roles overridable under normal task rules.
- Parent Consultant/Reviewer/Informed participants are not automatically inherited by subtasks. Parent-task participants can view subtasks; subtask-only participants do not automatically gain visibility into the parent task or sibling subtasks.
- Material edits and permission-relevant changes are recorded in the `System Changes` activity thread.
