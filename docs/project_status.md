# Taskify — Project Status

> **Controlling revision (2026-10-19):** Owner-agreed major redesign is documented in **docs/product_spec.md §17**. Its three-state lifecycle, independent pause, unified All Tasks/Saved Views and Home Dashboard supersede contradictory earlier Issue 11–18 sections below. Earlier sections remain historical context. No revised code, deployment or beta/production migration is claimed; old environments will be abandoned. Implementation-design details deferred to vertical slices are enumerated in §17.10; the approved Reference and Global Search amendment is §17.8. The legacy specification remains immutable.

## 2026-10-19 — Lifecycle, schedule, saved views and Home redesign

- **Lifecycle:** Draft, In Progress, Closed; Pause independently definite/indefinite, with fixed reasons, per-pause-episode comment, Edit Pause and Resume; separate closure outcomes Done vs five failure reasons, direct Reopen; Start/Resume conflict resolution.
- **Scheduling:** Start as quick action, Schedule from Draft with optional Pause Until Start and system-generated "Waiting to start" comment; Reschedule tertiary. Actual Start independent of scheduling.
- **Views:** Home Dashboard, shared All Tasks workspace with mandatory Group By, Save/Save As/Reset, navigation discard warning and cross-device Settings → Views ordering. Six editable Saved Views are automatically provisioned (Focus, Scheduled, Priority, Local, Completed, Deleted). Protected system All Tasks is the seventh View, last by default, always visible on Home and immutable as a saved definition; global ordering is user-adjustable.
- **Dashboard:** global nondeleted distinct-Task New/Closed clustered burn-rate and per-Saved-View collapsible pie/legend sections with drill-down.
- **Scope:** Remove DOW/TOD Task preferences and HERE/NOW proximity; keep TOD date-entry shortcuts resolved as timestamps; Location remains classification with coordinates latent only.
- **Lifecycle reconciliation closed (2026-10-19):** Draft + Paused activity does not change Draft or set Actual Start; Reopen preserves an empty Actual Start; Start remains available to In Progress Tasks when Actual Start is empty. See §17.2–17.3.
- **Views provisioning/grouping closed (2026-10-19):** All seven Views initially appear on Home. The six ordinary Saved Views are editable/deletable; All Tasks is protected and always visible. Group By partitions Tasks exclusively, with missing dates in Unspecified last. Provisioned default groupings and within-group sorts appear in §17.5. UI design details remain deferred.
- **Filtering and cleanup resolved (2026-10-19):** All Views support Closure Reason as multi-select Filter-only, available when Include Closed is on; disabled selections remain stored but inactive. Include Closed and Include Deleted are independent; Deleted Date presence is the sole deletion indicator and allows the Deleted preset to isolate its population. Account-wide, manual cleanup now resides in Settings → Cleanup, with independent retained N Days/Months thresholds, strictly older-than cutoff, confirmations and partial-failure safeguards. See §17.5 and §17.9.
- **Date and Dashboard default reconciliation (2026-10-19):** §17.1 now governs N Days/Weeks calendar offsets, N Months same-day/clamp-to-month-end semantics, local clock-time preservation, deterministic DST handling, Planned Start/Paused Until start boundaries, Due end boundaries, and midnight TOD rollover. Rescheduling Planned Start never modifies Paused Until automatically (§17.4). Dashboard defaults to Last 7 Days, then remembers the user's choice (§17.6). These decisions supersede old Paused Until end-of-slot rules.
- **Dashboard interaction resolved (2026-10-19):** Zero-count groups and empty Saved Views retain Open View access. Chart segment/legend navigation opens the unchanged Saved View and scrolls/expands the target group; no temporary query restriction. Counts include all matching Tasks independent of expansion (§17.6).
- **Reactive View contract resolved (2026-10-19):** Successful Task mutations update shared store/state and reconcile row membership, grouping and counts locally; this supersedes §7.4's stationary-edited-row/manual-Refresh contract (§17.7). Implementation mechanisms are deferred by slice.
- **Major-changes discussion CLOSED (2026-10-19):** Functional redesign and cross-spec supersession audit recorded in §17.10. Historical sections remain for traceability, not parallel authority. Next phase: design-first vertical implementation slices, with detailed UI, infrastructure, state-management and backend decisions deferred. No implementation or deployment claimed.
- **Post-closure Reference and Global Search amendment approved (2026-10-19):** One optional Task Reference (free text, max 255, no uniqueness); header Search is an explicit-submit, temporary, client-side single-phrase text filter across Title, Category, Location and Reference within the currently open Task View, defaulting to All Tasks only for a nonempty submission with no open View. Preserve grouping/sorting/zero groups; Search is never saved and clears on navigation except Task Detail → Back. Full eligible result population required. Earlier §9.5 deep/standalone Search is superseded (§17.8).
- **Status:** major redesign and post-closure Search/Reference amendment approved and documented; implementation and backend feasibility unresolved. Legacy file unchanged.


> **Status: Issues 15–17 closed at product/logical model level (2026-10-13); Issue 18 MongoDB Atlas Free feasibility next; Appwrite Cloud ruled out for PoC/beta under current ongoing-cost constraints.** The redesigned product behavior is consolidated in `docs/product_spec.md`; unresolved details remain open and implementation is not claimed. The previous Firebase baseline remains available in Git history. No revised implementation or deployment is claimed.

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
- Backend selection is open under Issue 18. **Appwrite Cloud Auth + DocumentsDB was the earlier preferred proposal but is not feasible for PoC/beta under the owner's ongoing-cost constraints**; MongoDB Atlas Free is the next candidate for evaluation. Google social sign-in remains the preferred sign-in UX, subject to provider/security validation. Taskify-owned data-access adapter remains the architectural direction.
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

### Query-first information architecture (Issue 12 closed, revised in Issue 14)

- Current **six** Tasks views: Focus, Resolve, Plan, All Active, **Closed**, Trash. Issue 14 merged Recently Closed and Archive into Closed; no separate archive state/date/actions.
- Closed and Trash retrieve **all** eligible history by default, with independent remembered historical time buckets. All Active is nonterminal by default, with optional terminal expansion.
- Delete/Restore change deletion metadata only; Closed membership depends on terminal lifecycle. See `docs/product_spec.md` §§7 and 11 for authoritative current details.

## Issue 12 — Home decisions (agreed in discussion)

- **Home** is a contextual workspace with **HERE + NOW**, **HERE**, and **NOW** sections; not an eighth preset query.
- **HERE + NOW** matches BOTH location and NOW preferences; **HERE** matches location independently; **NOW** matches DOW/TOD independently. Tasks may appear in multiple sections.
- NOW eligibility: DOW+TOD both match; TOD matches with DOW absent; or DOW matches on its own. DOW mismatch excludes; no DOW/TOD preference excludes. NOW sorts by **DOW+TOD → TOD-only → DOW-only → Title**.
- HERE sorts **Distance → Title**. HERE + NOW sorts **Distance → NOW match class → Title**. No arbitrary top-3–5 cap or inferred relevance scores.
- Initial Home scope is WIP (In Progress, Waiting, Blocked, On Hold), not executable-only. User-selectable lifecycle, Category and date filters; explicit **Remember / Reset**.
- HERE and HERE + NOW share selectable current/saved/manual location and configurable radius, with coarse proximity resolution. Missing location shows an empty/prompted HERE and HERE + NOW; NOW stays available.
- All Home sections remain visible with counts, including empty ones. When opening the workspace or changing filters, expand **only the first nonempty section**, in fixed section order; others collapsed. The same accordion defaults/count/empty-group visibility apply to query grouping. Sort-change expansion behavior remains deferred.
- While Home is visible, refresh manually; returning to Home refreshes automatically. Show location and last-updated time separately, without movement distance.
- Retain **header Global Search**, **global Task Create**, and **temporary title-only Quick Search** within a query. **Events are removed**.

## Issue 12 — Navigation and Task Detail (agreed in discussion)

- **Remove Calendar and Nearby as separate workspaces.** Retain date/location on Tasks and Home. Search map presentation is a **possible future enhancement**, not a current feature.
- **Responsive navigation:** Gmail-inspired collapsible desktop sidebar and mobile drawer using the same Home/Tasks hierarchy; global header Search and independent Task Create. Settings separate.
- **Workspace session:** Open Task → Back/Close restores the full origin query, filters, sorting, grouping, scroll and accordion expansion. Explicit application navigation always re-enters a workspace from Remember-saved settings or defaults; do not restore temporary context across workspace visits or clients.
- **Direct-linked Task:** normal browser history and app navigation, no fabricated prior workspace.
- **Task Detail:** mobile full-page; desktop side panel by default, expandable to full page with optional Collapse. Back/Close from either display returns directly to the originating workspace. Workspace is context, not a concurrent editing surface.
- **Unsaved changes:** Stay/Discard warning before navigation or switching tasks; no automatic saving.
- **Working UX hypothesis (validate with use):** users mostly work from workspace through the side panel; desktop full-page is less frequent.
- **Query group accordions:** visible counts and empty groups, only first nonempty expands on entry or filter changes, manual expansion allowed; Back from Task Detail restores exact existing expansion. Sorting-change rule deferred.
- No next/previous Task navigation or Task-to-Task links in current scope without a demonstrated need.

## Issue 12 — Final decisions and closure (2026-10-13)

**Status:** Product-level IA decisions complete and recorded in `docs/product_spec.md` §§7–10. This does not imply implementation, design verification, or approval of backend mechanics.

- **At Issue 12 closure, all seven names were retained; Issue 14 later revised this to six.** Focus excludes future/indefinite pauses but ignores expired pauses; Planned Start never filters Focus. Resolve still includes interrupted tasks and any recorded pause.
- **At Issue 12 closure:** active views loaded all eligible Tasks, historical views had 15-day defaults. **Issue 14 supersedes historical restrictions:** Closed and Trash now show all eligible Tasks.
- **Shared Group By/Filter/Sort** interaction across applicable query and Global Search dimensions; one global sort via table column headers, category/state/time grouping where applicable. Sorting preserves accordion expansion. Grouping by Paused Until orders **Expired → upcoming → Indefinite → Unspecified**; other missing dates go last. Near/Medium/Far thresholds remain per-query and explicitly Remember-saved.
- **Task rows:** shared structure, omit the Group By column; title opens Task Detail. Visible hybrid context/state-dependent primary action (Edit fallback); overflow contains up to two other valid lifecycle actions, then standard actions, with no duplication.
- **Resolve Extend** supports later pause or Indefinite. Standard overflow includes Add Comment and Attach File, both as unsaved-work-protected popovers targeting Notes & Comments.
- **Edits:** keep the edited row stationary and highlighted until next edit/refresh. If it becomes ineligible, animate its removal and update counts. Otherwise counts/ordering/group membership wait for explicit Refresh; show distinct-edited-task counter with **Refresh view** link.
- **Global Search:** text-only; at least three characters; user explicitly clicks Search. Cumulative depth Title (default) → Description → All Content. Active default scope with expansion for terminal/archived; filter-icon popover with Apply/Clear/Cancel. Tabular columns Title, Category, Status, Planned Start, Due, Match; sortable headers; optional Category grouping; 10 results per batch with explicit Load More; shared responsive row style.
- **Map Search is future-only**. Home HERE still supports proximity. 
- **Issue 14 supersession:** Closed bulk Move to Trash older than N; Trash bulk Purge older than N; individual Delete, Restore and Permanent Delete. All deletion actions require confirmation.

**Next work after Issue 15:** Detailed domain/architecture/security reconciliation, not further Issue 12 product-level IA debate.

## Issues 13–14 — Decisions recorded (2026-10-13)

- **TOD:** fixed nonconfigurable half-open periods Late Night 00–05, Morning 05–08, Mid Morning 08–12, Afternoon 12–16, Evening 16–20, Night 20–00, interpreted in configured timezone. Reminders and recurrence deferred.
- **Scope:** WYSIWYG descriptions/comments; files and external links in Notes & Comments and Todo Thread **headers**, never System. Terminal/deleted Tasks and closed Todo Threads remain read-only.
- **Attachment limits:** 5 MB/file, 25 MB combined uploaded files and 10 items across Task, one-file uploads; renaming without confirmation, replacement/removal with confirmation. Task-title flat ZIP Download All includes files, description and external links, not comments.
- **Lifecycle:** Close automatically enters Closed, no archive metadata. Terminal closure clears Paused Until, retains Planned/Due/Actual Start; Reopen goes to In Progress, clears latest Actual End, keeps Todo Thread states; history preserves prior outcomes. Done with open Todo Threads always warns with count/names but does not block.
- **Trash:** soft Delete/Restore affect deletion metadata only, each requires confirmation. Individual/bulk permanent deletion only in Trash, irreversible confirmation, storage files before DB. Bulk partial success permitted, failed items retried manually.
- **Bulk views:** Closed cleanup and Trash purge remain in the relevant view, remember independent day/month thresholds, ignore view filters, show count and confirmation; no automatic cleanup. Closed/Trash historical buckets independently Remember-saved and all records visible by default.
- **Deferred:** recurrence mechanics, notifications/reminders, related Tasks, optional Eisenhower and Map Search. **Removed:** Events, Calendar/Nearby workspaces, collaboration, independent subtasks, Priority and View Builder.
- **Next:** Issue 15 Task Detail hierarchy is now closed; domain/storage/security reconciliation follows. No implementation or deployment claimed.

## Issue 15 — Task Detail UX closed (2026-10-13)

- **Hierarchy:** Title → clickable Status/Dates → clickable Classification/Preferences → state-dependent Task Action Bar → two-line Description preview (expand to formatted display) → Notes & Comments → Todos → + Add Todo → low-prominence Activity Log.
- **Actions:** Ready (Draft → Planned), Start, Pause, Resume and Reopen are state-dependent primaries; Close is secondary for nonterminal tasks; More contains only secondary Task-level actions and duplicates neither badges nor primary controls. Ready is a user-facing action, not a new status; assigning planned dates alone does not change lifecycle.
- **Pause:** Managed together with Waiting, Blocked and On Hold; interrupted Tasks retain visible Resume, and current status/Paused Until are editable via contextual badges.
- **Editing:** Contextual overlays for most substantive edits including WYSIWYG description; title inline; simple preferences may toggle directly. Existing Save/Cancel and unsaved-change protection apply.
- **Work sections:** Notes & Comments expanded by default; Todos displayed in creation order with independently collapsed contents, with Add Todo title overlay; files/links in thread headers via + Attach overlay; Activity Log collapsed and read-only.
- **Supersession:** Comments are **plain text**, compact inline entries with no hard length limit, explicitly superseding Issue 14's WYSIWYG comment rule. WYSIWYG Task descriptions remain. User-facing Todo means Todo Thread, and Activity Log means immutable System Changes.
- **Responsive:** Existing desktop side panel/full-page expansion and mobile full-page rules retained; same hierarchy/actions with wrapping badges and prominent controls, **subject to usage verification**.
- **Status:** Product-level UX decisions recorded, not implemented or validated. See `docs/product_spec.md` §12.

## Issue 16 — Domain business rules in progress (2026-10-13)

- **Interruption semantics:** Waiting = external time dependency, Blocked = obstacle/conflict/unavailability, On Hold = user choice not to proceed. Direct transitions permitted; Paused Until optional and independently editable.
- **Lifecycle explanations:** Natural Draft → Planned → In Progress → Done actions and Resume require no comment; interruptions, switching interruption reasons, non-Done closure, direct Draft/Planned → Done and all Reopen actions require explanations in the immutable transition Activity Log entry. Implicit content-driven promotions do not require an additional explanation.
- **Scheduling:** Relative-date shortcuts and conventional picker for Planned Start, Due, Paused Until; date/pause changes log old/new values and have optional comments. Planned dates never imply Planned lifecycle.
- **Classification:** Category required with Uncategorized default; Location optionally Unspecified. Important/Urgent tri-state Yes/No/Unset, either Unset implies Eisenhower Unclassified. DOW/TOD support multiple values, OR within dimension, empty means no preference. Home/query matching needs reconciliation.
- **Audit scope:** Task title/description, Category/Location/preferences and ordinary comment activity are not logged. Todo rename/state/delete, attachment changes, Task Delete/Restore and lifecycle/schedule changes are logged. Todo creation needs no log entry. Permanent deletion removes Task/history.
- **Status superseded by Issue 16 closure below:** Earlier agreed rules recorded in `docs/product_spec.md` §13; see the closure section for the finalized NOW matching, five-class grouping and product-level closure. No implementation claimed.

## Issue 16 — Product/domain rules closed (2026-10-13)

- **Autonomy:** Single-user knowledge/activity repository, not compliance auditing; logical constraints with minimal friction. Required lifecycle deviation explanations retained as useful context.
- **Dates:** Actual Start and End remain system-managed and not directly editable; Actual Start records first entry into In Progress including later Reopen, Actual End records latest closure and clears on Reopen. Planned Start/Due remain intentions and do not gate lifecycle. Paused Until may be later than Due with nonblocking warning.
- **Todos:** Parent Task closes only at user's choice; Todo completion does not auto-close parent. Closing a Todo or adding comments/attachments still promotes Draft/Planned to In Progress. Todo creation never promotes; existing read-only and nonempty-Todo deletion restrictions retained.
- **NOW matching supersession:** DOW and TOD allow multiple values, OR within each dimension, **AND across dimensions** when both configured; either dimension alone can match; neither excludes. Remove the prior DOW-only fallback for TOD mismatches. Preserve NOW match-class sort.
- **Important/Urgent:** Combined five-class Group By and multi-select Filter in **all six Task views**, in fixed order **Do First, Schedule, Delegate, Eliminate, Unclassified**. Unclassified means either tri-state value is Unset. Same shared grouping/filter/Remember semantics; no change to default view grouping. Delegate/Eliminate are labels only.
- **Architecture direction:** Configuration-driven shared query-view implementation is favored for assessment, without collapsing view-specific domain rules or claiming code exists.
- **Status:** Issue 16 **closed at business-rule specification level**. Remaining transition-contract details, storage/security/concurrency, time/DST, query implementation and UX verification belong to subsequent architecture/design work. See `docs/product_spec.md` §§8.3, 13.

## Issue 17 — Logical data model closed (2026-10-13)

- Task primary document; typed Discussion, Todo and Activity Log Threads conceptually embedded in Task, with Thread-owned attachment metadata; file bytes in object storage.
- Separate shared Entries for plain-text comments and immutable Activity Log events (optional structured system payload), referencing stable Task and Thread identities.
- Personal Task preferences stored on Task; independent user-owned Categories and saved Locations referenced by ID; Category global ordering and protected Uncategorized retained. Locations have optional coordinates and centrally propagate changes to referencing Tasks.
- User Profile/Settings and one Remember-saved View Configuration document per user/workspace (six Task queries, Home, Global Search); ephemeral state not persisted as view configuration.
- Composition for Task-owned Threads/Entries/attachments and permanent deletion; references for Category/Location; single-user ownership boundary.
- Preferred progressive reads: Task document for core detail/Thread headers, Entry content and file bytes on demand. Global Search All Content requires Entry search. Physical DocumentsDB behavior **unverified**.
- Client-store/query discussions separated for a later architecture issue, with application-scoped normalized cache, shared selectors/mutators and demand-driven loading as agreed direction.
- **Next:** Issue 18 vendor-neutral physical feasibility, beginning with MongoDB Atlas Free. See `docs/product_spec.md` §15.

## Issue 18 — Backend feasibility and cost decision (2026-10-13)

**Approved owner decision:** Mark **Appwrite Cloud with DocumentsDB as not feasible for the Taskify PoC/beta under the current ongoing-cost constraints**, rather than upgrading the existing project. DocumentsDB was unavailable for provisioning on the current free plan; selecting a paid offering would introduce recurring costs. This is a *project cost/scope decision*, not a claim that Appwrite's document model is technically incapable of meeting Taskify's requirements. Do not interpret it as deleting the existing Appwrite PoC project or forbidding future reassessment if costs change.

**Next evaluation candidate:** **MongoDB Atlas Free** for PoC and beta. This is approval to evaluate, **not** a final backend or production architecture selection. Validate the free-tier limits, nested Thread operations, multi-value DOW/TOD queries, Global Search across separate Entries, atomic mutations, authorization, backup/restore and deployment requirements. Atlas alone does not supply client-facing authentication or a secure Taskify API; trusted backend and operating costs remain open.

**Repository organization approved for feasibility work:** `poc/` rather than `experiments/`, with `poc/appwrite/` originally proposed; adapt PoC implementation to `poc/mongodb-atlas/` if used. Put reproducible findings in `docs/feasibility/` and approved design conclusions in a future `docs/architecture.md`. No feasibility code or tests have been created, run or committed yet. Repository/PoC implementation and provisioning remain controlled, explicit actions.

**Attachment release-scope discussion:** Link/metadata-only initial support and deferral of binary file storage have been discussed as a *proposal*, not yet recorded as an approved supersession of the file-attachment product requirements. Do not silently remove or rewrite the existing attachment specification.

## Deferred / unresolved

- Recurrence, reminders/notifications and other deferred enhancements.
- Task Detail accessibility, responsive breakpoints and usability verification; rich-text/attachment technical details (high-level Issue 15 UX closed).
- Implementation-level domain transition contracts, fixed TOD timezone/DST details, query implementation and selected-backend data/security/concurrency, file deletion consistency, migrations and operational design.

## Planned specification migration

1. Use this file as the canonical **project status** entry point, `docs/product_spec.md` as the working simplified product baseline, and `docs/product_spec_legacy.md` only as a historical reference.
2. Issues 12–17 product/domain/logical data decisions are documented with explicit supersessions; Issue 18 evaluates MongoDB Atlas Free following the Appwrite Cloud cost decision.
3. Approve replacement product rules and document supersessions explicitly; then design coherent data, security and architecture contracts.
4. Reconcile and approve the working `docs/product_spec.md` alongside future data, architecture and security specifications, rather than silently reviving obsolete documents or treating historical DEC entries as erased.
5. Require separate approval for commits, merges, implementation, data migration and deployment.

**Repository cleanup scope:** Prepared active tree contains `README.md`, `docs/project_status.md`, `docs/product_spec.md`, and the protected read-only `docs/product_spec_legacy.md`. Source removals are not cloud-resource deletions.
