# Taskify — Project Status

> **Status: Working simplified product specification prepared (2026-10-12).** The redesigned product behavior is consolidated in `docs/product_spec.md`; unresolved details remain open and implementation is not claimed. The previous Firebase baseline remains available in Git history. No revised implementation or deployment is claimed.

## Authority and governance

This file is the canonical project entry point. The project owner makes all material product, architecture, repository and operational decisions. Explicitly distinguish **current discussion agreement**, **approved repository baseline**, **proposal**, **open issue**, **implemented**, and **verified**. Do not treat legacy implementation as evidence for the redesigned architecture.

## Legacy specification preservation policy

- `docs/product_spec_legacy.md` is a **read-only historical reference**, not a working specification or editable source of requirements.
- **Never create, edit, overwrite, reformat, synchronize, or otherwise modify** `docs/product_spec_legacy.md` during subsequent specification revisions, implementation, or documentation cleanup.
- Use it only to understand historical intent or compare previous behavior with the revised specification. Conflicts are resolved through current owner-approved decisions and `docs/product_spec.md`, **not** by treating legacy content as current authority.
- **Retain the file until the project owner explicitly authorizes its deletion.** Do not infer deletion approval from cleanup requests, migration progress, obsolete content, or a future release.
- Changes to current product behavior belong in `docs/product_spec.md`, with project status updated here. Deleting the legacy file is a separate owner-controlled action.

## Repository and historical baseline

- Repository: https://github.com/dpdhole/taskify
- Historical approved baseline: `main` through DEC-082 before the simplification branch. The older decisions, Firebase backend, rules, tests and verification evidence are recoverable from Git history.
- Cleanup preparation branch: `docs/simplification-revision-intent-2026-10-12`; source head before cleanup: `c0a4751aae50edf6e95a2c57490bbf392f5590c0`.
- `docs/product_spec.md` is the **working simplified product specification**, recording discussion decisions and explicitly unresolved requirements. `docs/product_spec_legacy.md` preserves the older product specification as a **legacy reference only**.
- Historical discussion reconciliation proposal: `docs/proposals/taskify-simplification.md` at commit `92b15eb80ee85dae9802e43d6ec9de1dc2c897b2`. That proposal is preserved in Git history after cleanup.
- Replacing or deleting files from the working tree does not invalidate Git history or approve revised business rules.

## Current development state

The previous Firebase Category backend, tests, indexes and task/API slice were implemented and verified within recorded historical scope. They are **not** a working Appwrite application. The simplified client, persistence, authorization and deployment have not been implemented or verified. Repo cleanup does not delete cloud resources or migrate production data.

## Simplified product direction — agreed in discussion

### Scope and identity

- Single-user, mobile-first/responsive task management; no collaboration accounts, role-based task participation, or delegation.
- Cloud-authoritative online writes, optional offline read cache, no offline write synchronization.
- Proposed Appwrite Auth + DocumentsDB with Taskify data-access adapter; Google social sign-in first, Apple later. Stable internal identity; provider linking/authorization require validation.
- Client-side last-modified conflict warning is **best effort**; atomic concurrency guarantees are not assumed.

### Task and category model

- Lifecycle and fixed grouping order: **Draft → Planned → In Progress → Waiting → Blocked → On Hold → Done → Cancelled → Unable to Complete**.
- Creation defaults Draft; Draft → Planned is explicit. Qualifying user activity promotes Draft/Planned to In Progress. Interrupted tasks require explicit Resume; closing and reopening follow lifecycle contracts.
- Each Task has permanent Notes & Comments and System threads; optional Todo Threads replace independent subtasks. Significant system events are immutable; persistence/atomicity remains to be specified.
- Every Task belongs to a Category; permanent protected Uncategorized; other Categories globally reordered, renamed, icon-adjusted, or archived without breaking task references.
- Remove task-level Priority. Keep Important, Urgent, DOW and TOD as user preferences.

### Dates and paused attention (Issue 11 closed)

- Planned Start and Due are user-managed; Actual Start and Actual End are lifecycle-managed.
- Planned dates support date-only, symbolic TOD slots and exact times, with visible precision. Date-only Due becomes overdue on the next calendar day in the user's configured timezone.
- Planned Start calendar date must be ≤ Due calendar date when both present. Scheduling can optionally shift the other planned date by the same number of calendar days; synchronization defaults off.
- Overdue derives from Due, not Planned Start. Planned dates and pause expiry never automatically change lifecycle.
- Paused Until may be timed or indefinite; expired pause remains recorded until user action. Resume clears pause with transition atomically. Terminal closure retains pause for context but disables its operational effect; reopening clears pause.
- Pauses may suppress execution attention but not planning/scheduling visibility of overdue work. Reminder coupling and subtle cross-query behavior are deferred.

### Query-first information architecture (Issue 12 partly resolved)

Seven query destinations; default presentation is grouped accordion/list:

| Query | Default Group By | Default within-group sort |
|---|---|---|
| Focus | Due | Planned Start ↑ |
| Resolve | Lifecycle | Paused Until ↑ |
| Plan | Lifecycle | Created ↑ |
| All Active (working name) | Category | Due ↑ |
| Recently Closed | Actual End | Actual End ↓ |
| Archive (working name) | Archived Date | Archived Date ↓ |
| Trash (working name) | Deleted Date | Deleted Date ↓ |

- Focus excludes Waiting/Blocked/On Hold; Resolve includes all interrupted tasks **or** tasks with a recorded pause (including expired) while nonterminal. Plan includes Draft/Planned regardless of dates.
- All Active defaults to open, nonarchived work; temporarily expandable to all nondeleted Tasks, including terminal/archived. Expanded scope and retrieval horizons do not persist.
- Category, Lifecycle and Time filters are multi-select; selections OR within a dimension, AND across dimensions; default no restriction.
- Grouping by a dimension removes its filter; changing Group By clears conflicting selections. Category order is globally user-defined; lifecycle order is fixed above.
- DOW/TOD and Important/Urgent remain personal working preferences. Per-query Near/Medium/Far bucket thresholds show actual ranges.
- Query-specific fixed retrieval limits, explicit temporary expansion and visible partial-result indicators. Resolve cannot silently omit unresolved tasks; Focus includes qualifying overdue tasks.
- `Remember` explicitly saves supported per-query presentation/filter preferences; `Reset` restores defaults. Filter option counts are supported; detailed semantics deferred.

## Deferred / unresolved

- Final fixed labels for All Active, Archive and Trash; precise Focus paused/date eligibility; subtle cross-query visibility and UX testing.
- Date bucket labels/order for expired, indefinite and unspecified pauses; concrete TOD boundaries; actual fixed retrieval horizons; reminders/notifications.
- Eisenhower, Calendar and Map presentations; task-detail interaction design.
- Whether Events, recurrence, locations, external links and other legacy features are retained, deferred or removed.
- Appwrite service feasibility: permissions, uniqueness, structural invariants, atomic multi-document writes and system history; exact storage schemas and migration strategy.
- Archive/Trash retention and restore rules.

## Planned specification migration

1. Use this file as the canonical **project status** entry point, `docs/product_spec.md` as the working simplified product baseline, and `docs/product_spec_legacy.md` only as a historical reference.
2. Resume Issue 12's remaining product/IA design when appropriate.
3. Approve replacement product rules and document supersessions explicitly; then design coherent data, security and architecture contracts.
4. Reconcile and approve the working `docs/product_spec.md` alongside future data, architecture and security specifications, rather than silently reviving obsolete documents or treating historical DEC entries as erased.
5. Require separate approval for commits, merges, implementation, data migration and deployment.

**Repository cleanup scope:** Prepared active tree contains `README.md`, `docs/project_status.md`, `docs/product_spec.md`, and the protected read-only `docs/product_spec_legacy.md`. Source removals are not cloud-resource deletions.
