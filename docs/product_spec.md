# Taskify — Product Specification

> **WORKING SIMPLIFIED BASELINE · 2026-10-12.** This document consolidates product decisions explicitly agreed in the Taskify simplification discussion. It is the current **working product specification** on the revision branch, **not evidence of implementation** and not a blanket approval of unresolved design details. The historic, previously approved requirements are preserved in [product_spec_legacy.md](product_spec_legacy.md) and Git history. [project_status.md](project_status.md) records status and outstanding decisions.

## 1. Product vision and boundaries

Taskify is a responsive, mobile-first, **single-user personal responsibility and task manager**, not project-management or team-collaboration software. A task can involve people or work performed externally, but they do not receive Taskify accounts, permissions, task assignments or communications through the product.

- One person's task inventory and task-level personal working preferences.
- One browser experience across mobile and desktop, with future mobile application capability deferred.
- Cloud is authoritative. Creating and changing data requires connectivity. Optional offline **reading** may be cached; no offline writes, queued mutations or sync-conflict reconciliation.
- Avoid heavyweight workflow machinery, hidden automatic lifecycle transitions, redundant per-view action semantics and unnecessary configuration.
- AI assistance, participant workflows and additional advanced features are deferred unless explicitly reapproved.

## 2. Identity and overall behavior

- User signs in with a social identity provider, with Google first and Apple planned next. Remembered device sessions are desirable.
- Taskify maintains a stable internal account identifier rather than treating email addresses as immutable identity.
- Linking identities requires verified, provider-supported safe linkage; matching or hidden email values alone are not sufficient.
- Appwrite Auth and DocumentsDB, with a Taskify-owned data-access abstraction and no custom backend initially, are **architectural direction requiring feasibility reconciliation**, not a fully validated implementation contract.
- Client-side pre-save version checks and user warnings are best effort; they are not atomic concurrency control.

## 3. Task domain and lifecycle

### 3.1 Canonical lifecycle and order

| Stage | Lifecycle states |
|---|---|
| Upcoming | Draft, Planned |
| Active | In Progress, Waiting, Blocked, On Hold |
| Terminal | Done, Cancelled, Unable to Complete |

**Global fixed natural order:** Draft → Planned → In Progress → Waiting → Blocked → On Hold → Done → Cancelled → Unable to Complete.

- New tasks default to **Draft**. Draft represents an intent without sufficiently defined scope; Planned means high-level scope is understood even if details will change.
- **Draft → Planned is an explicit user decision**. Assigning planning dates never performs it.
- Adding a user comment or attachment in Notes & Comments or Todo Thread, or closing a Todo Thread, promotes Draft/Planned to In Progress. Creating/renaming a Todo Thread alone does not.
- Waiting, Blocked and On Hold do **not** automatically resume when someone comments, an attachment is added, a pause expires or any planned date arrives. **Resume** is explicit.
- A nonterminal task may close directly into any terminal state without first entering In Progress. Reopen from any terminal state enters In Progress.
- A task that has entered execution does not transition backwards into Draft/Planned.
- Terminal and deleted Tasks are **read-only**, including comments and attachments. Reopen before making changes. Direct terminal-to-terminal transitions are prohibited: reopen to In Progress, then close to the desired outcome.
- Closing as **Done** with any open Todo Threads always warns, listing the count and names, with Proceed/Cancel; this does not block closure or change thread states. No such warning for Cancelled or Unable to Complete; no separate system history event is necessary. Close/Reopen otherwise require no confirmation.

### 3.2 System-managed actual dates

- **Actual Start** is recorded when the task first enters In Progress, if absent, and preserved through interruptions and reopening.
- A task closed directly from Draft/Planned can legitimately have no Actual Start.
- **Actual End** is the most recent closure timestamp, cleared on reopen; earlier closure times/outcomes remain in immutable System Changes. **Actual Start** remains the original.
- Planned Start and Due survive closure and reopening unchanged and are never overwritten by actual timestamps.

## 4. Dates, scheduling and attention

### 4.1 Planned dates

- **Planned Start**: user-managed suggested commencement date.
- **Due** (planned completion/deadline): user-managed commitment date.
- Both support date-only, date plus a symbolic Time-of-Day (TOD) slot, or date plus exact clock time. Selected precision must always be visible to the user. Changing precision **replaces**, rather than adds to, the existing precision.
- Six **fixed nonconfigurable** symbolic slots (start-inclusive/end-exclusive, user's configured timezone): Late Night 00:00–05:00, Morning 05:00–08:00, Mid Morning 08:00–12:00, Afternoon 12:00–16:00, Evening 16:00–20:00, Night 20:00–00:00. They cover 24 hours without overlap; Task stores the symbolic slot.
- Interpret relative dates and slots in the user's configured timezone.
- **Planned Start calendar date ≤ Due calendar date** when both are set; compare dates, not TOD/exact times. Validate the completed pair on save, so both fields can be edited together.
- Scheduling and rescheduling use the **same planning workflow**. When shifting either planned date, the user may explicitly elect to shift the other by the same number of calendar days, preserving interval and retaining the corresponding clock precision. This option is **OFF by default** in both directions.
- Planned dates have no automatic effect on lifecycle.

### 4.2 Derived timing

- **Overdue is determined by Due, not Planned Start.** Date-only Due becomes overdue at the start of the next local calendar date. Date+TOD uses the selected slot's end boundary. Exact time uses the specified instant.
- Terminal tasks are excluded from operational overdue classification.
- Planned Start reaching/passing its window can inform planning or attention views, but does not itself constitute Overdue.
- Overdue and scheduling visibility must remain independent of attention deferral.

### 4.3 Paused Until

- A task may have **no pause**, a **timed pause**, or an **indefinite pause**; these three cases must be distinguishable in the data model.
- Wait, Block and On Hold workflows can manage deferral. A Blocked task qualifies for Resolve whether or not it is paused.
- A timed pause ceases active suppression when its time expires, but its recorded pause remains until the user explicitly acts. Indefinite pause remains until cleared/resumed.
- **Resume** atomically changes an interrupted task to In Progress and clears its pause. Clearing an expired pause on a task already In Progress does not require another lifecycle transition.
- Paused Until can extend beyond Due: give a nonblocking warning; Overdue remains derived from Due. Rescheduling planned dates does not automatically rewrite Paused Until.
- Closing to any terminal state **clears Paused Until**, retaining its previous value in System Changes; reopening returns to In Progress without restoring the pause.
- Execution-focused views may suppress deferred work, while planning/scheduling views preserve visibility of deadlines and overdue work. Fine-grained Focus/Resolve overlap is deferred to user testing.
- Reminder generation and its relationship to Snooze/Paused Until are deferred.

## 5. Task content and Todo Threads

- Each Task has two permanent threads: **Notes & Comments** (user content) and **System** (structured, immutable significant system changes).
- Optional user-created **Todo Threads** represent actionable work instead of independently browsable subtasks. A Task can have zero or many Todo Threads.
- Thread display order: Notes & Comments first; Todo Threads by creation order; System last. Open/Closed Todo status is displayed without moving or striking through threads.
- Todo Threads can be opened/closed/reopened. Close records system-managed `closed_at`; reopen clears it. Creating or renaming a thread does not initiate execution; closing a Todo Thread can initiate execution from Draft/Planned.
- Todo Thread rename is permitted only while its parent and the Todo Thread are editable; System records previous and new titles.
- Terminal/deleted parent Tasks and closed Todo Threads are read-only. To edit a terminal Task, the user must explicitly reopen it first.
- A Todo Thread can be deleted only if it currently contains no comments, file attachments, or external links; deletion is recorded in System Changes.
- Comments belong to their original thread; **attachments belong to thread headers**, not individual comments. In Task Detail, comments are compact chronological plain-text entries, composed and posted inline within Notes & Comments or the expanded Todo; editing is inline when permitted. Notes & Comments and open Todo Threads accept attachments; the System thread never does. A consolidated attachments section is deferred. Unified activity can show User/System entries with independent toggles.
- User comments can be edited/deleted within 30 minutes only when their parent Task/thread is editable; edited entries retain their original position/timestamp and show Edited. System events are immutable. Whether this client-enforced limit is security-critical remains a deliberate accepted limitation of the simplified approach.
- Exact storage representation, large-history behavior and cross-record transaction requirements need architectural verification.

## 6. Categories and task preferences

### 6.1 Categories

- Every task references exactly one Category; new tasks default to **Uncategorized**.
- Uncategorized is a permanent record with stable ID, fixed label/icon and no archival.
- Other starter and custom categories can be renamed, assigned a curated Material Symbols Rounded icon, reordered or archived; Categories are not deleted.
- Archiving a Category prevents new assignment while preserving all existing task references and task editability. Changing an existing task's Category uses an active Category.
- Category names: at most 30 grapheme clusters, Unicode NFC/trim normalization, case-insensitive uniqueness across active and archived categories.
- One global display order controls Category grouping in every query. Reset Alphabetical and insertion placement affect this single order. Uncategorized Top/Bottom placement is a view preference, not a separate global Category order.
- Details of initial starter catalogue are subject to final product-spec reconciliation.

### 6.2 Preferences

- Retain the user's **Important, Urgent, preferred Day-of-Week (DOW), and preferred Time-of-Day (TOD)** signals. Important/Urgent are tri-state (Yes/No/Unset); DOW/TOD are multi-valued (possibly empty). These are separate from scheduling TOD precision. See Issue 16 in §13.4.
- Urgent/Important are independently identifiable by icon/treatment in lists; a dedicated Eisenhower matrix is a separate presentation discussion.
- **Remove task-level Priority** as an unnecessary legacy collaboration/execution field.
- Category is task classification metadata, not a lifecycle or scheduling operation.

## 7. Query-first Inbox information architecture — Issue 12 amended by Issue 14

### 7.1 Shared query interaction contract

- Six fixed query destinations, not user-created saved views. **Home is a separate contextual workspace**; Global Search is a separate search workspace.
- Candidate eligibility belongs to the query. The user refines the returned population with applicable multi-select Category, Lifecycle State, Time, and five-class Important/Urgent filters; OR within each dimension and AND across dimensions. DOW/TOD modifiers are exposed where meaningful. The Important/Urgent filter is supported by all six Task views.
- **One Group By** dimension at a time: Category, Lifecycle State, an applicable task date, or **Important/Urgent classification**. The active Group By dimension is omitted from simultaneous filters; changing Group By clears conflicting filter selections. Important/Urgent grouping and filtering use the same five classes (§13.7) across all six Task views.
- All queries and Global Search use consistent **Group By / Filter / Sort** semantics and controls, **only offering applicable dimensions**. Search itself defaults to ungrouped results and can group by Category.
- **View-global sort**, chosen through sortable table column headers, applies to every accordion group; it does not change group order. Changing sort **preserves expanded/collapsed groups**. A view's remembered sorting preference applies at entry.
- Group order is user-defined global Category order, fixed lifecycle order (§3.1), calendar/time-bucket order, or fixed Important/Urgent classification order (§13.7). All group headers show matching counts; empty groups remain visible. On entry and filter changes, only the first nonempty group expands; Back from Task Detail restores exact expansion state.
- Time buckets support Older, Today, Near, Medium, Far, Later, Unspecified. Configure Near/Medium/Far boundaries **per view**; explicit **Remember** persists the choice, Reset restores that view's defaults. Display concrete date ranges.
- For **Paused Until** grouping, order is **Expired → chronological upcoming buckets → Indefinite → Unspecified**. A missing date is **Unspecified**, always last, for other date dimensions as well.
- Filter controls and table rows are shared across query views, with context-sensitive visible fields. **Omit the Group By field from individual task rows**, since the group header already supplies it. Keep fields relevant to the question each view answers.
- **Remember** saves supported Group By, filtering, global sort and time thresholds only when explicitly invoked. **Reset** returns to defaults. Temporary scroll/accordion state is never remembered across visits/devices.
- No automatic query refresh after task edits. An explicit **Refresh** reapplies eligibility, filters, group membership, sorting and counts and clears the edit indicator. See §7.4 for in-place edit feedback.

### 7.2 Six query contracts (Issue 14 supersession)

| Query | Eligibility | Default Group By | Default sort |
|---|---|---|---|
| **Focus** | Executable nonterminal, excluding Waiting/Blocked/On Hold and future/indefinite pauses; expired pauses ignored; Planned Start does not restrict eligibility. | Due | Planned Start ↑ |
| **Resolve** | Nonterminal Waiting/Blocked/On Hold OR any recorded pause, including expired. | Lifecycle | Paused Until ↑ |
| **Plan** | Draft/Planned regardless of dates. | Lifecycle | Created ↑ |
| **All Active** | All nonterminal nondeleted, expandable to terminal nondeleted Tasks. | Category | Due ↑ |
| **Closed** | **All** terminal nondeleted Tasks, latest Actual End. | Actual End | Actual End ↓ |
| **Trash** | **All** recoverable deleted Tasks, Deleted Date; lifecycle unchanged. | Deleted Date | Deleted Date ↓ |

- **Recently Closed and Archive merge into Closed.** There is no separate archived state, Archived Date, or Archive/Unarchive action. Closing enters Closed automatically; reopening exits it.
- **All** Closed and Trash Tasks appear by default, without 15-day horizons. Historical grouping uses **Today → Near → Medium → Far → Older**, with Unspecified last when needed. Each view has independent Remember-saved Near/Medium/Far boundaries.
- Focus/Resolve/Plan/All Active continue to load all eligible Tasks; the old 60-day staleness and 15-day historical limits are superseded. All Active retains its name when expanded.
- Query Quick Search is temporary, title-only within query filters and cleared on switching queries.

### 7.3 Task row and contextual actions

- The **task title is always a link to Task Detail**, regardless of view. Row columns/treatment are shared, omitting the current Group By field while showing contextually useful information.
- A **visible primary action** is chosen by **hybrid relevance**: the query ranks useful actions, and the task state limits which are valid. When no meaningful contextual action applies, use **Edit** as the generic primary action.
- An **overflow menu** shows up to **two other valid and relevant lifecycle actions**, then standard actions, with separators as appropriate; never duplicate the visible primary action.
- Standard actions where valid: **Edit**, **Change Category**, **Change Dates**, **Add Comment**, **Attach File**, **Close/Reopen**, **Delete**, plus **Restore/Permanently Delete** in Trash. Archive/Unarchive are removed. Lifecycle/deferral actions such as Resume, Extend and Clear Pause are contextual, not universal.
- **Resolve:** prioritize **Resume** where the state is interrupted, **Clear Pause** for already In Progress tasks with a recorded pause, and **Extend** where applicable. Extend supports a later Paused Until or a change to **Indefinite**, without changing lifecycle. Only valid actions appear.
- **Add Comment** targets Notes & Comments; **Attach File** targets that thread's header (or the header of an open Todo Thread when editing Task Detail). Successful content activity can promote Draft/Planned to In Progress; terminal/deleted Tasks and closed Todo Threads remain read-only.
- Closing either popover with unsaved content warns **Stay / Discard**; successful submission closes without warning.

### 7.4 Post-edit feedback and explicit refresh

- After a successful edit, **keep the task in its present row position** (do not immediately re-sort, regroup, or reapply filters) and highlight its background subtly. Only the latest edited task retains the highlight, until another edit or refresh.
- **Exception:** if the edited task is no longer eligible for the current workspace/filter, animate it vanishing. Update the affected group count immediately; otherwise **counts remain unchanged until Refresh**.
- No automatic repositioning, auto-scrolling to an updated row or background workspace refresh.
- Show a subtle actionable prompt, e.g. **“3 tasks changed. Refresh view”**. Count **distinct tasks changed since the last refresh**. Explicit Refresh reconciles rows/ordering/groups/counts and clears the counter and highlight.
- This interaction is user-controlled and distinct from **Home's automatic contextual refresh when returning to Home** (§8.6).

## 8. Home — HERE + NOW contextual workspace (Issue 12 decisions)

Home is a **contextual task-discovery workspace**, distinct from Focus's broader executable-work query. It has three permanently visible sections in this order:

1. **HERE + NOW** — tasks satisfying **both** the HERE and NOW matching rules.
2. **HERE** — tasks matching the selected location/proximity context, regardless of DOW/TOD.
3. **NOW** — tasks matching the current DOW/TOD context, regardless of location.

A task may appear in multiple sections. The sections do not consume or deduplicate one another. There is **no fixed 3–5-item cap**, and Taskify does not invent a relevance score.

### 8.1 Home eligibility and user controls

- **Initial lifecycle scope:** work in progress (In Progress, Waiting, Blocked, On Hold). **Do not exclude interrupted states**: blocked or waiting work can be contextually relevant.
- Users may expand lifecycle scope and refine **Category, dates and lifecycle status**. Changes are temporary unless explicitly saved through **Remember**; **Reset** restores Home defaults. The precise scope-expansion UI is still to be designed.
- DOW/TOD matching uses **user-set task preferences**, not inferred activity or Taskify-assigned priorities. Important/Urgent preferences remain available for task context; an Eisenhower Home presentation is not implied by these three sections.

### 8.2 HERE context

- HERE and HERE + NOW share a **single selected location and configurable proximity radius**.
- Start from the device's current location when permission is available; otherwise permit selection of a saved location or manual location choice.
- Support both coarse proximity matching and user-saved locations/places. A task needs matching location data to qualify for **HERE** or **HERE + NOW**.
- If no location context is available, both location-dependent sections stay visible with an empty state and a location-selection prompt. NOW remains independently functional.
- Match location/proximity at a **coarse resolution**; do not continuously relocate/recalculate the task list.

### 8.3 NOW matching and sorting

NOW uses the user's current local day-of-week and time-of-day slot.

Each Task may select multiple weekdays and multiple TOD slots. Within each dimension, values match using **OR**. Across DOW and TOD, use **AND when both are configured**:

- If both are selected: current weekday must match one selected DOW **and** the current slot must match one selected TOD.
- If only one dimension is configured: that dimension must match.
- If neither is configured: Task is excluded from NOW.

A matching weekday alone does **not** qualify a Task when a configured TOD fails to match (and vice versa). This explicitly **supersedes** Issue 12's earlier DOW-only fallback on TOD mismatch. For example, a Monday/Wednesday + Morning Task matches only Monday or Wednesday mornings.

NOW default order is **(1) DOW + TOD match, (2) TOD-only match, (3) DOW-only match, then Task Title A–Z** within each level.

### 8.4 HERE / HERE + NOW sorting

- **HERE:** Distance ascending → Task Title A–Z.
- **HERE + NOW:** Distance ascending → NOW match class (DOW + TOD, TOD-only, DOW-only) → Task Title A–Z.
- Distance is the primary sort for HERE + NOW even when NOW match classes differ. User-defined sort changes may be exposed through Home configuration and Remember; no automatic composite relevance scoring.
- NOW does **not** use distance, including for tasks without location.

### 8.5 Home sections and shared accordion rules

- Each section always appears, even if empty, and its header displays the matching task **count**.
- When Home opens, **expand only the first section containing tasks**, following HERE + NOW → HERE → NOW; collapse the remaining sections. If none contain tasks, all sections are collapsed with empty-state indicators visible.
- Users may manually expand/collapse sections. Expansion state is **not** saved with Remember.
- When Home filters change, reset expansion to the first nonempty section.

These same **count / visible empty groups / first-nonempty-expanded / filter-change reset** behaviors apply to query-view Group By accordions. **Whether sorting changes reset accordion expansion is deferred to the query-views discussion**, not determined by Home rules.

### 8.6 Home refresh and navigation

- While Home remains visible, the user **manually refreshes** results. Returning to Home triggers an **automatic refresh**.
- Context resolution is coarse for both location and DOW/TOD. Do not continuously poll GPS or rerank results while Home remains open.
- Show location and freshness **separately**, e.g. **“Current location · Updated 5 min ago”**, alongside Refresh. Do **not** show distance moved since last refresh.
- Further responsive navigation/persistence behavior is pending Issue 12 discussion.

## 9. Navigation, Search, Create and Task Detail (Issue 12)

### 9.1 Application navigation

- Use a **Gmail-inspired responsive navigation model**: a persistent, collapsible desktop sidebar and the same hierarchy in a mobile navigation drawer.
- **Home** is the contextual HERE + NOW workspace (§8); **Tasks** contains the six predefined query views (§7). Home is not an eighth query.
- **Calendar and Nearby are removed as separate workspaces.** Task scheduling dates and task locations remain supported, including Home's HERE contexts.
- **Potential future enhancement (not a current requirement):** a map presentation for Search results.
- **Global Search** is accessible from the application header and displays results in the main workspace.
- **Global Create** is prominent and independent of navigation, creating Tasks only; **Events are removed**.
- **Query Quick Search** searches titles within the current query, combines with its temporary filters, retains grouping, updates group counts, and clears on switching queries. It is not remembered.
- Settings is separated as application configuration; finer hierarchy is open.
- Eisenhower and other optional presentation concepts remain separate future design discussions, not a commitment to restore Calendar, Nearby, Events, or a View Builder.

### 9.2 Workspace retention versus navigation reset

The intended interaction is **choose a workspace, configure it, and work within it**.

- **Open Task from workspace → Back/Close:** restore the originating workspace's exact query, filters, sort, Group By, scroll position and manually expanded/collapsed groups.
- **Select a workspace using application navigation** (including a previously visited workspace): enter fresh using its explicitly **Remember**-saved configuration or product defaults. Do not restore temporary filters/scroll/expansion from a prior workspace visit.
- **New browser session:** initialize from remembered configuration or defaults; do not synchronize temporary workspace context across devices/clients.
- Remember saves eligible query/Home configuration, **not scroll position or accordion expansion**.
- A Task opened directly through a bookmark/external URL follows normal browser history and application navigation; do not invent a workspace-of-origin.
- Task Detail and workspaces should have stable, directly accessible routes. Browser Back and Taskify Back must behave consistently with the actual navigation origin.

### 9.3 Task Detail interaction

- **Mobile:** Task Detail opens full-page.
- **Desktop:** Task Detail opens as a **side panel** over the originating workspace, which remains visible for context, not simultaneous work. The user may **expand** to full page for intensive editing and optionally collapse back to the panel.
- **Working UX assumption, subject to usage validation:** most interactions are Workspace → side panel quick work → Back; full-page desktop usage is less frequent.
- Opening another task from the workspace while the panel is open switches the panel to that task **after handling any unsaved changes**. The panel is a focused task interaction; returning to the workspace closes it rather than encouraging concurrent workspace editing.
- Side-panel detail is **not** a different domain state or edit contract from full page. Every new desktop Task Detail entry starts in a side panel; prior expansion is not remembered.
- **Back/Close** from either side panel or expanded full-page detail returns directly to the origin workspace with exact context restored, rather than requiring an intermediate Collapse step.
- **Unsaved edits:** warn on leaving Task Detail, switching tasks, or returning to workspace. Offer **Stay** or **Discard Changes**; no automatic save. Stay cancels the navigation.
- Do not add next/previous task controls or nested task-to-task navigation without a demonstrated use case. Todo Threads are part of the parent Task.

### 9.4 Shared query accordion behavior

- Group headers always show matching task counts. **Empty groups remain visible.**
- On entering a query, expand **only the first nonempty group** in query group order; collapse all others. If every group is empty, keep all collapsed with visible empty-state indicators.
- Users can expand/collapse groups manually. **Changing filters** resets expansion to first nonempty; navigating to a workspace starts from this default. Opening a Task and returning via Back restores the exact existing group expansion.
- Accordion expansion is temporary and not remembered. **Behavior on sort changes remains open** for the query-views discussion.

### 9.5 Global Search — text only

Global Search uses the application-header Search entry, **not** a Text/Map switcher or geospatial search action. **Map Search is a possible future enhancement**, not current scope.

- **Explicit Search action**, no live query while typing; nonempty search text requires **at least 3 characters**. An empty text string is not a List search.
- **Cumulative depth selector**, labeled **Title** (default: task title), **Description** (adds task description and Todo Thread titles), and **All Content** (adds user comments and attachment filenames). Routine System Changes are excluded from full-text content.
- **Default scope:** nonterminal nondeleted Tasks; scope can explicitly expand to terminal Closed Tasks. Trash is separate. Deleted tasks stay within Trash/recovery workflows.
- A **Filter icon** opens a popover with the applicable shared Category/lifecycle/scope filters. Filtering is independent from Text depth. **Apply** commits the current mode's selections; **Clear** clears the pending draft and requires Apply; **Cancel** or outside click discards unapplied changes. Indicate when filters are active.
- Search results display as a **tabular List** with **Title, Category, Status, Planned Start, Due and Match**. Default sort is **Task Title A–Z**. Users sort by clicking column headers; one view-global sort column at a time (ascending/descending), also used within optional Category groups. Category Group By is optional and **off by default**; when enabled, order categories globally and omit repeated Category field in grouped rows.
- **Match** indicates where the query matched; show highlighted title text, a short description/comment excerpt, a matching Todo Thread title, or an attachment filename as applicable. Shared Task Detail navigation applies.
- **Explicit Load More**, initially **10 results**, loading 10 more each time while preserving scroll/sort. More than two additional loads used frequently is a **UX validation signal**, not a reason to adopt infinite scrolling.
- On mobile, use standard responsive compact results/cards preserving key data and matching context; offer a compact sort control rather than imposing horizontal scrolling as the only interaction.
- Global Search supports explicit **Remember / Reset** for its eligible configuration, consistent with query views. Fresh navigation starts from remembered options/defaults; Back from Task Detail restores exact search text, filters, depth, results, scroll and grouping.
- Global Search and query Quick Search serve separate intents: **Global Search** searches progressively deeper content; **Quick Search** searches titles within a selected query. The shared Group By/Filter/Sort model is used only where meaningful.

## 10. Remaining presentation work

- Grouped accordion/list remains the primary query presentation; rows expose state, scheduling and Important/Urgent cues.
- Alternative Eisenhower presentation remains to be considered separately; a stand-alone Calendar workspace and Nearby workspace are excluded from the revised scope.
- Task Detail's high-level hierarchy and action model are specified in §12 (Issue 15); responsive sizing/breakpoints, accessibility mechanics and usability validation remain. Search result refinements likewise remain for later design; do not infer Event or collaboration behavior from the legacy specification.
- Workspace-specific actions are projections of shared task-domain operations, not separate query implementations.

## 11. Attachments, Closed and Trash — Issue 14 scope decisions

### 11.1 Rich text and thread-level attachments

- Task descriptions use a WYSIWYG rich-text editor, with familiar formatting; users need not edit raw Markdown. Comments use short-form plain text and a compact inline composer, with no rich-text toolbar or hard character limit. Long-form content generally belongs in the Task description, but this is guidance rather than validation. Exact description storage/editor mechanics remain later design.
- The permanent **Notes & Comments** thread supports files, external links and comments even with zero Todo Threads. **Open Todo Threads** support attachments in their headers. Closed Todo Threads retain readable, noneditable attachments. The **System thread never supports attachments**.
- Files/links are attached to their owning thread header, independent of individual comments; no consolidated Task attachments section for now (future possibility). Each attachment has one owning thread.
- **Per-Task limits across all threads:** 5 MB per uploaded file; 25 MB combined uploaded files; 10 total file/link attachments. Upload one file at a time. Allow common images, PDFs, text, Office documents and archives; prohibit executables/scripts and dangerous file types. External links consume an attachment slot, not file bytes.
- Files open externally (browser or associated application), with no in-app preview; external links open in a new tab. URLs have optional display titles.
- **Rename** file display name or link title without confirmation; **replace** uploaded file or link URL/title and **remove** with confirmation. Replacement retains attachment slot/order/thread; failure preserves original. No moving attachments between threads. Record changes in System Changes.
- Removing a file immediately deletes its storage content **before** removing the database record; external-link removal deletes only the Taskify reference. System Changes retains name/action/time but not removed content. Safe retry/concurrency details are architecture work.
- Task-level **Download All** creates a ZIP using a sanitized Task title, containing uploaded files from all threads in **one flat folder** (disambiguate repeated filenames), optional `Task Description.txt` and `External Links.txt` (title, URL, owning thread), **no comments**. Generated text files are ZIP-only; uploaded files can also be downloaded individually.
- Download All is enabled on readable active/Closed/Trash Tasks when **any** description, uploaded file or link exists, even if no file exists. Otherwise disable it.

### 11.2 Closing and deletion

- Close/Reopen are lifecycle operations without ordinary confirmation. Done with open Todo Threads always warns with count/names but permits Proceed. Closure clears Paused Until, preserves planned dates, Actual Start and Todo Thread statuses; reopening clears Actual End, enters In Progress, and does not restore pauses. Previous closure outcomes/dates remain in System Changes.
- **Soft Delete** requires confirmation for any Task lifecycle. It changes **only deletion flag and deleted timestamp**, not lifecycle or other domain data. Deleted Tasks are readable but otherwise immutable in Trash.
- **Individual Restore** requires confirmation and clears only deletion metadata. Previously active Tasks return to their applicable query; terminal Tasks return to Closed. Record delete/restore in System Changes.
- **Permanent Delete** is allowed **only in Trash**, individually or via bulk purge, with explicit irreversible-deletion warning/confirmation but no typed DELETE. Permanently remove uploaded files **before** deleting associated database records. No Taskify recovery.
- Closed supports manual **Move to Trash older than N days/months**, using Actual End. Trash supports manual **Purge older than N days/months**, using Deleted Date. Each action retains an independent age threshold, separate from query time-bucket boundaries. These bulk actions apply to **all** qualifying Tasks regardless of view filters/grouping, remain located in their respective views (not Settings), show threshold and affected count, no preview, and require confirmation.
- Bulk actions may partially succeed; report success/failure counts, preserve completed changes, and leave failures for a subsequent **manual rerun** (no automatic retries or Retry Failed button). No scheduled cleanup or purge.

### 11.3 Legacy scope

- **Retain:** thread-level file and URL references, WYSIWYG descriptions/comments, Task locations and saved places, Important/Urgent/DOW/TOD.
- **Defer:** recurrence (independent new occurrence and use of Paused Until explored, but not designed or approved), reminders/notifications, related Tasks, possible Eisenhower and Map Search.
- **Remove:** Events, independent Calendar/Nearby, task collaboration/delegation/participant secure links, independent subtasks (Todo Threads replace them), Priority and View Builder.

## 12. Task Detail UX — Issue 15 closed (2026-10-13)

**Scope:** Approved product-level information hierarchy, responsive presentation and primary interactions. This is a specification decision, **not implemented or usability-verified**. Fine-grained forms, visual treatment, accessibility mechanics and technical contracts remain later work.

### 12.1 Shared hierarchy and navigation

Task Detail presents the same domain information and actions in a desktop side panel (expandable to full page) and mobile full page, following the already-approved origin-workspace restoration, direct-link navigation and unsaved-change protection rules in §9.3. Every new desktop entry starts in a side panel. Narrow screens wrap metadata badges and keep the action bar prominent; there are no mobile-only business workflows. These responsive choices are **subject to usage verification**.

Display sections, in order:

1. **Title**, clickable to edit inline with Save/Cancel when editable.
2. **Status and Dates**, displayed as clickable badges; show pertinent Planned Start, Due, lifecycle and Paused Until information contextually, without conflating planned and actual dates.
3. **Classification and User Preferences**, using clickable fields/badges for Category, Location and DOW/TOD; simple Important/Urgent preference changes can be direct labeled toggles.
4. **Task Action Bar**, with state-dependent primary action, secondary Close where applicable and tertiary **More** menu.
5. **Description**, initially a two-line **plain-text preview**; **More** expands to render the formatted description. **Edit** opens a WYSIWYG editing overlay with explicit Save/Cancel and unsaved-content protection.
6. **Notes & Comments**, expanded by default, showing compact thread-header file/link attachments and chronological plain-text comments.
7. **Todos**, displayed in creation order; each header shows Open/Closed status, and each Todo starts collapsed and can expand independently to show its own attachments/comments.
8. **+ Add Todo**, after existing Todo entries and before the log.
9. **Activity Log**, low prominence, collapsed by default and view-only.

**User-facing terminology:** **Todo** refers to an existing *Todo Thread*, not an independently browsable subtask or Task. **Activity Log** is the UI name for the immutable System thread/System Changes. These labels do not rename or alter their underlying domain semantics.

### 12.2 Task actions and contextual editing

The **Manage Task State** capability is a family of explicit business actions, not one unconstrained status setter. The interface chooses actions according to the Task's current persisted lifecycle:

| Current lifecycle | Primary action | Secondary |
|---|---|---|
| Draft | **Ready** (explicit Draft → Planned) | Close |
| Planned | **Start** (→ In Progress) | Close |
| In Progress | **Pause** (choose Waiting, Blocked or On Hold; manage Paused Until) | Close |
| Waiting / Blocked / On Hold | **Resume** (→ In Progress and clear Paused Until) | Close |
| Done / Cancelled / Unable to Complete | **Reopen** (→ In Progress) | None |

- **Ready** is an action label, **not a lifecycle state**. Setting or editing Planned Start/Due does **not** imply Draft → Planned; the transition remains explicit. Previously established implicit execution promotions from substantive Notes/Todo activity (§3.1) remain in force.
- **Pause** coordinates interruption status and Paused Until in the same workflow. In interrupted states, Resume remains immediately available; status and Paused Until badges can open contextual editing. Extending or clearing a pause may leave lifecycle unchanged. Pause expiry alone never resumes the Task.
- **Close** selects a terminal outcome (Done, Cancelled, Unable to Complete), retaining existing closure rules and the open-Todo warning for Done. Read-only restrictions apply to terminal/deleted Tasks.
- The tertiary **More** menu contains only valid **secondary Task-level actions** (such as Download All or Delete); it does not duplicate metadata edits or actions already exposed as primary/secondary controls.
- Most editing actions appear as **overlays over Task Detail**, preserving its context. Simple Title editing is inline; Category/Location may be inline fields, and non-interruptive add/remove preference changes may be labeled toggles. Context determines which inputs and actions are visible. An overlay action uses Save/Cancel as applicable; there is no universal Edit Task page requirement.
- Task Detail retains explicit-save and Stay/Discard protection for unsaved changes. A completed direct toggle is an individually committed action rather than a persistent unsaved form.

### 12.3 Notes, Todos, attachments and activity

- **Notes & Comments** is expanded on entry. Plain-text comments use a short, compact, tweet-like inline composer with explicit Post; no character limit is imposed. Entries display chronologically and support inline edits within the existing 30-minute edit/delete window, subject to editability. Comment content has no WYSIWYG/Markdown formatting. The previously specified WYSIWYG **comments** rule from Issue 14 is **superseded**; WYSIWYG **Task descriptions** remain.
- Files and external links display compactly in the owning Notes & Comments or Todo **header**, separate from comments. **+ Attach** opens an overlay for File or Link. Existing Task-wide attachment quotas, editability and ownership contracts (§11.1) apply unchanged.
- Existing Todos are ordered by creation; Open/Closed appears without reordering, and individual contents start collapsed. **+ Add Todo** opens a lightweight title-entry overlay with Add/Cancel, appends an initially collapsed Todo and **does not itself start execution**. Creating a Todo is not creating an independent Task.
- Activity Log is the read-only presentation of immutable System Changes and remains collapsed by default.

### 12.4 Deliberately left for later design

Precise form composition, per-transition comment requirements, exact badge layouts, responsive breakpoints, accessibility behavior, detailed attachment failure handling, storage/API contracts and usability-driven refinements are not settled by Issue 15. Issue 15 is **closed at product-specification level**, not implementation or UX-validation level.

## 13. Domain business rules — Issue 16 in progress (2026-10-13)

These are agreed specification rules, **not implementation evidence**. Issue 16 remains open for domain-invariant reconciliation. Todo and Activity Log are user-facing names for Todo Thread and immutable System Changes.

### 13.1 Interruption states

- **Waiting:** External time-based dependency.
- **Blocked:** Conflict, obstacle or unavailability.
- **On Hold:** User intent not to proceed for now.
- Transitions directly among these three states are permitted, require an explanation and are logged, without resuming execution. Preserve original Actual Start and current Paused Until unless explicitly changed.
- Paused Until is optional for all three states (no value, timed or indefinite). Expiry does not change lifecycle. Resume returns to In Progress and clears the pause.

### 13.2 Transition explanations

The natural path is **Draft → Planned → In Progress → Done**. Explicit deviations require an explanation unless they return to that path. An explanation is stored on the same immutable Activity Log entry as the lifecycle transition, not as a separate user comment. Every lifecycle transition has an Activity Log entry; explanations may also be supplied optionally.

| Transition | Explanation |
|---|---|
| Draft → Planned (Ready), Planned → In Progress (Start), In Progress → Done | Not required |
| Nonterminal → Waiting / Blocked / On Hold | **Required** |
| Waiting ↔ Blocked ↔ On Hold | **Required** |
| Waiting / Blocked / On Hold → In Progress (Resume) | Not required |
| Nonterminal → Cancelled / Unable to Complete | **Required** |
| Draft / Planned → Done directly | **Required** |
| Done / Cancelled / Unable to Complete → In Progress (Reopen) | **Required** |

Previously approved implicit promotions from meaningful comments/attachments or closing a Todo do **not** require an additional comment. The full transition matrix remains part of the open invariant review. Existing actual-date and closure rules are unchanged.

### 13.3 Planned Start, Due and Paused Until

- Provide **relative-date shortcuts** (e.g. Tomorrow, Next Monday, In 10 Days, In 2 Weeks) and a conventional date/time picker for all three. Resolve relative choices at confirmation in the configured timezone, keeping existing date-only, TOD-slot and exact-time precision. Free-text natural-language input is deferred. Indefinite is additionally available for Paused Until.
- Adding, modifying or clearing dates/pause requires **no explanation**, but permits an optional explanation; the Activity Log records old and new values and any explanation. Changing Paused Until need not change status.
- Planned date changes alone do **not** transition Draft → Planned. Ready remains explicit.

### 13.4 Classification and preferences

- **Category:** Single required classification; empty/default/reset assignment is the protected **Uncategorized**, not a null or new Unclassified Category. **Location:** Optional; missing/cleared displays **Unspecified**. Both use contextual single-value editing.
- **Important** and **Urgent** are independent tri-state user preferences: **Yes**, **No**, **Unset** (the default). Unset is distinct from No. A Task is Eisenhower **Unclassified** whenever **either** value is Unset; only two explicit values place it in a quadrant. The matrix UI remains deferred.
- **DOW** supports zero or more of seven weekdays; **TOD** zero or more of the six fixed slots. Within each dimension, selected values match using **OR**; empty means **no preference**, not all days/times. When both dimensions are configured, **both must match** (AND). When only one is configured, it alone determines a NOW match. Neither configured excludes the Task from NOW. This supersedes the earlier DOW-match override of TOD mismatches; see §8.3.
- Important/Urgent may use labeled tri-state tag controls, DOW/TOD add/remove tags. Category, Location, preferences changes require **no comments and no Activity Log entries**.

### 13.5 Ordinary content and activity recording

| Business operation | Explanation required | Activity Log |
|---|---|---|
| Change Task title or description | No | No |
| Change Category, Location, Important, Urgent, DOW or TOD | No | No |
| Post/edit/delete ordinary comment | No | No separate entry |
| Create Todo | No | No required entry |
| Rename Todo | No | Yes: old/new title |
| Close/reopen Todo | No | Yes: transition |
| Delete eligible empty Todo | No | Yes: deletion |
| Add/rename/replace/remove attachment or link | No | Yes: operation |
| Soft Delete / Restore Task | No | Yes: action |
| Permanently Delete Task | No | Task and its history removed |

- Ordinary comments retain their own timestamp/Edited presentation and 30-minute edit/delete window. If posting a comment implicitly promotes Draft/Planned to In Progress, log the resulting **lifecycle transition**, not a duplicate comment action.
- Todo creation does not start execution; closing a Todo may do so. Todo deletion remains restricted to Todos with no comments, uploaded attachments or external links. Parent/closed read-only restrictions stay in effect.
- Existing attachment ownership, quotas, confirmation rules, Task Delete/Restore confirmations and permanent file-before-record deletion remain unchanged.

### 13.6 Confirmed domain invariants and autonomy principle

- **Personal autonomy:** The user is accountable only to themselves. Taskify is a working repository of activity, history and knowledge, **not a compliance audit system**. Enforce logical invariants with minimal friction. Retain the specifically agreed mandatory lifecycle explanations as useful historical context.
- **Actual Start:** System-managed, assigned on the **first** entry to In Progress, including Reopen from a terminal Task that never previously started. Once assigned, preserve through Resume, Close and Reopen; a Task closed directly from Draft/Planned may have no Actual Start.
- **Actual End:** System-managed, assigned upon each closure as the latest closure timestamp, cleared on Reopen. Prior outcomes/times remain in Activity Log. Actual Start/End are **not directly editable, clearable or backdateable** by the user.
- **Planned Start and Due:** User intentions, not lifecycle gates. Task may begin before/after Planned Start or close before/after the planned dates; lifecycle actions do not modify them. The existing Planned Start calendar-date ≤ Due calendar-date validation remains. Paused Until may exceed Due (including when already overdue), with a nonblocking warning; overdue remains independent of pause.
- **Task versus Todos:** Only the user decides when a parent Task is Done. Closing all Todos never closes the Task automatically; closing a Task with open Todos retains the existing warning. Todo states persist on Task Close/Reopen. A closed Todo can reopen while its parent is nonterminal and nondeleted; a terminal parent must first be Reopened, and a deleted parent Restored.
- **Todo creation/deletion:** Adding a Todo is valid in any nonterminal, nondeleted parent state and does not change lifecycle. Keep the prohibition on deleting a Todo with comments, files or links.
- **Implicit execution promotion:** Adding a comment or file/link attachment in the relevant editable thread, or closing a Todo, moves Draft/Planned to In Progress and assigns Actual Start if absent; record the lifecycle transition without an extra required comment. Creating/renaming Todos alone does not promote, and content activity never automatically resumes Waiting/Blocked/On Hold.

### 13.7 Important/Urgent grouping and filtering (Issue 16)

- **One combined five-class dimension** is available as **Group By** and **multi-select Filter** across **all six Task views** (Focus, Resolve, Plan, All Active, Closed, Trash). Existing default groupings remain unchanged. The same dimension cannot simultaneously group and filter.
- Fixed, **nonconfigurable** bucket order and user-facing labels:

| Order | Label | Important | Urgent |
|---|---|---|---|
| 1 | **Do First** | Yes | Yes |
| 2 | **Schedule** | Yes | No |
| 3 | **Delegate** | No | Yes |
| 4 | **Eliminate** | No | No |
| 5 | **Unclassified** | Unset in either dimension | Unset in either dimension |

- Unclassified means **either** preference is Unset, including both Unset; every Task maps to exactly one bucket.
- Multi-select filter uses OR within the five classes and AND with other applicable filter dimensions. Same five buckets, counts, empty-group display, global sorting, Group By filter exclusion, and Remember/Reset contract as existing grouping (§7.1). The ordering remains fixed unlike user-defined Category order.
- **Delegate** and **Eliminate** are names of preference classifications, **not** operations to delegate work or delete Tasks. No collaboration, deletion, lifecycle or scheduling effects. Eisenhower Matrix UI remains deferred.
- **Architecture direction (proposal to validate):** Favor one configuration-driven query-view implementation with shared filtering, grouping, sorting and presentation mechanics, while retaining per-view eligibility and domain-operation differences. This is not an implemented or approved technology/API design. The five-class dimension can be hidden in a view later if needed without changing its underlying semantics.

### 13.8 Issue 16 closure

**Issue 16 is closed at the product/business-rule specification level (2026-10-13).** Fine-grained transition availability, Appwrite/data model, authorization, concurrency, immutable event atomicity, query execution strategy, timezone/DST specifics and actual implementation validation are **not** claimed complete. These are next-stage domain/architecture reconciliation and design tasks.

## 14. Remaining non-IA design and implementation questions

Issue 12 IA is closed, but Issues 13–14 **supersede its conflicting archive, historical-view, terminal-edit and deletion rules**. These are specification decisions, not implementation evidence.

1. Fixed TOD timezone/DST behavior; reminders/notifications and recurrence details deferred.
2. Task Detail visual/accessibility/usability verification and unresolved rich-text/attachment implementation details; Issue 15 high-level interaction hierarchy is closed.
3. Design and verify storage/query contracts (including multi-valued DOW/TOD and the five Important/Urgent classes), safe file-before-database deletion, partial failure and concurrency, ZIP export and query performance; product-level Issue 16 decisions are closed.
4. Appwrite permissions, integrity, atomic multi-document activity, identity linking, backup and migration.
5. Related Tasks, Eisenhower, Map Search and other deferred features subject to separate decisions.

## 15. Logical data model — Issue 17 closed (2026-10-13)

**Status:** Owner-approved logical model and data ownership relationships; **not** a verified physical schema or implemented storage system. Physical embedding, schema capabilities and operational constraints remain under Issue 18 feasibility review.

### 15.1 Task-centric data and progressive content retrieval

- **Task** is the primary document, holding its own identity, title/description, lifecycle, dates, location/category references and single-user Important/Urgent/DOW/TOD preferences.
- **Threads** are logically composed within Task and preferred as **embedded typed subdocuments**: one permanent Discussion (user-facing Notes & Comments), zero or more Todo, and one permanent Activity Log. Types define which operations are valid. Thread state and attachment metadata live with the owning Thread.
- **Entry** is a shared model for plain-text user comments and immutable system-generated Activity Log events. Entries are **separate documents** cross-referencing the owning Task and Thread. System events can carry optional structured metadata as well as display text. Comments and system events follow distinct editing/immutability rules despite reusing Entry.
- **Attachment metadata** is included in the owning Thread rather than a standalone Attachment entity; actual uploaded files are in object storage. External links are likewise thread-owned metadata. Attachment limits from §11 remain.
- **Read strategy thesis:** Task Detail's Task read can supply primary attributes, description, Thread headers/status and attachment metadata; Comments and Activity Log Entries are fetched on demand, while uploaded file contents are opened/downloaded only when needed. Since Notes & Comments expands by default, its Entries may begin loading on Task Detail entry. Full-content Global Search requires querying Entries separately; this is not assumed solved by a single Task read.
- The physical single-document capability and consistency of embedded Thread edits require validation against the chosen document database; a *logical aggregate* is not a guarantee of one physical read.

### 15.2 User-owned data and per-view configuration

- User has a stable internal identifier and logically owns Task, profile, settings, categories, saved locations and view configurations. User Profile is the logical ownership root, **not a mandate for one huge profile document**.
- **Categories** are separately identifiable, user-owned records with protected Uncategorized, both default and custom Categories under the same model and global ordering. Tasks reference one Category ID; Category rename, reorder or archive preserves references. The exact simplified starter Category names remain to be reconciled, rather than inherited automatically from legacy.
- **Saved Locations** are independently identifiable, user-owned records with a name and optional coordinates. Three workflows are recognized: named place without coordinates, save current position as a new named place, or update coordinates on an existing named place. Tasks reference a Location ID; changing its name/coordinates affects all referencing Tasks. Location absence is allowed.
- **User Settings** holds global preferences such as configured timezone. Per-Task Important/Urgent/DOW/TOD preferences live directly in Task, not a User–Task join document.
- **View Configuration:** one logical document per user/workspace for all six Tasks views, Home and Global Search. Store only explicitly Remember-saved settings. Product-controlled View Definitions and temporary session state (including search text, scroll, accordion expansion, temporary filters and navigation context) are separate concepts; no additional persistent saved-view entities are implied.

### 15.3 Identity, composition and references

- Every Task, embedded Thread, Entry, Category, Location and attachment has a stable identity. Editing labels does not change identity. Embedded Thread IDs must be stable because Entries reference them.
- **Composition** applies to Task → Threads → Entries/attachment metadata (and owned uploaded file content), even where Entries or file bytes are stored separately. Permanent Task deletion removes its entire composed hierarchy, including entry history and stored files; soft deletion preserves the hierarchy for Restore. Existing restricted Todo deletion applies.
- **References** apply to Task → Category and Task → Location. These records have independent identities/lifecycles, and changes do not cascade into Task deletion. Referenced entities remain the source of truth for shared names/coordinates/order.
- User is the ownership/authorization boundary. Single-user scope has no collaborative Task participant entities.

### 15.4 Separated client-architecture discussion

A subsequent, **separate architecture issue** should cover the agreed direction of hybrid database/client query execution, centralized application-scoped normalized Task store, shared selectors/views and business mutators, Taskify-owned data-access adapter, and demand-driven loading with reusable caches. Cloud remains authoritative, and no offline writes are supported. Cache freshness and query-snapshot coordination remain unresolved. Do **not** treat these as settled physical schema rules or implemented features.

### 15.5 Next: Issue 18 feasibility

**Issue 18 decision (2026-10-13):** Appwrite Cloud DocumentsDB is **not feasible for the PoC/beta under the owner's ongoing-cost constraints** after DocumentsDB provisioning was unavailable on the free plan. This is a cost/scope decision, not a technical impossibility finding or a final ban on revisiting Appwrite. **Evaluate MongoDB Atlas Free next** for PoC and beta, without treating it as an approved production architecture. Validate nested updates, document/query/index limits, six Task views and Home, full-content search over separate Entries, atomicity, authorization and free-tier operating limits. Atlas requires a separately designed trusted API and authentication. The approved feasibility workspace convention is `poc/` with documentation under `docs/feasibility/`; no PoC execution is claimed. Binary-attachment deferral has been discussed but is not yet an approved replacement of existing product rules.

## 16. Specification governance

- This document is the **current working simplified product baseline**, grounded in explicit owner discussion decisions, and may be refined by later decisions.
- `docs/project_status.md` is the canonical entry point for actual project state and implementation status.
- `docs/product_spec_legacy.md` is **historical source material only** and must not override this document.
- Detailed data, architecture and security specifications remain to be written and approved. Previous Firebase verification does not certify the revised product.
- Updating this document does **not** authorize code changes, database migration, cloud configuration or deployment.

## 17. Major owner-agreed redesign — 2026-10-19 (controlling revision)

**Status:** Owner-approved discussion decisions, not implemented or verified. **This section supersedes conflicting requirements in preceding sections.** Earlier issue narratives remain historical context; nonconflicting rules still apply.

### 17.1 Scope, date entry, navigation

- No existing beta or production migration; previous environments will be abandoned. Remove DOW/TOD Task preference fields/matching and contextual HERE/NOW Home and all GPS/proximity UX. Retain Location as optional classification; coordinates remain optional latent data, with no coordinate editing, maps, GPS or proximity UI.
- Date inputs: Today, Tomorrow, N Days/Weeks/Months, Choose, exact time and fixed TOD shortcuts. TOD shortcuts resolve immediately to exact timestamps, not symbolic stored values. **Planned Start and Paused Until use the START of the chosen calendar day/TOD slot; Due uses its END**. Exact time uses the explicitly selected timestamp. Date-only Due expires at the end of its selected calendar day (equivalently the following day's 00:00 exclusive boundary). A slot ending at 00:00 resolves to **the next calendar day's midnight**. Existing fixed TOD slots remain; custom slot boundaries are future-only.
- Relative date calculations use **calendar-day offsets** for N Days and **7 × N calendar days** for N Weeks. N Months targets the same day of month N calendar months from the context date; when unavailable, use the **last valid day of that target month** (e.g., January 31 + one month → February 28/29). Preserve the local clock time and original date-only versus exact-time precision. Interpret calculations in the user's configured timezone: if the resulting local clock time does not exist due to DST, advance to the first valid local time; when ambiguous, use the earlier occurrence. These rules apply to Planned Start, Due, Paused Until, and relevant calendar-age cleanup thresholds.
- Navigation: Home (default Dashboard), All Tasks (shared Task View), Settings including Preferences, Views, Categories, Locations, Profile and Sign Out. Retain header Global Search and Create. Remove fixed six-view navigation.

### 17.2 Lifecycle, Pause, actions and closures

**Only three lifecycle states: Draft, In Progress, Closed.** Old Planned, Ready, Waiting, Blocked, On Hold, Paused, Done, Cancelled and Unable to Complete are not lifecycle states. Draft is initial. Pause is an **independent open-Task condition**; closure outcome and soft deletion are also separate dimensions.

- Start is an explicit immediate action: Draft → In Progress and set Actual Start if empty. **Start is also available when In Progress and Actual Start is empty**; it sets Actual Start to the current timestamp without changing lifecycle. If Actual Start already exists, Start is unavailable. An In Progress Task may legitimately have empty Actual Start after Schedule or Reopen; lifecycle entry alone need not establish work commencement.
- Pause activates without altering Draft/In Progress. Requires Until timestamp or Indefinitely, fixed reason Waiting/Blocked/On Hold/Other, and a user-written Activity Log comment on the first pause of each episode. Scheduling's Pause Until Start uses exception: system-generated comment "Waiting to start". Edit Pause adjusts reason, date or indefinite duration, with no required new comment. Record edits; expiry never auto-resumes.
- Resume clears active pause without altering lifecycle or automatically setting Actual Start. Pauses can coexist with Draft or In Progress. Qualifying activity while paused does not clear pause.
- Start while Paused: warn, default selected resolution **Start & Resume**, alternative **Start Only** preserving pause, or Cancel. Start with no pause executes without dialog. Resume with Actual Start absent: warn, default selected **Resume & Start**, alternative **Resume Only** preserving empty Actual Start, or Cancel. Resume with Actual Start present executes without dialog. No double-action without confirmation.
- Done from any open Task → Closed, outcome Done, no comment form. Warn if Actual Start empty and/or open Todo Threads exist, combining warnings with Todo names/count; user may Complete Anyway. Does not modify Todo states or invent Actual Start.
- Close from any open Task → Closed, mandatory failure outcome Cancelled, Unable to Complete, No Longer Applicable, Duplicate or Other; optional comment. No open-Todo warning. Done/Close set latest Actual End and clear active pause; history preserved.
- Reopen from Closed → In Progress with one click/no comment or dialog; clears active closure outcome and Actual End; preserves original Actual Start if recorded, Todo Thread states and prior closure history. Reclosing is allowed, each event logged. Closed remains otherwise read-only. Deleted remains independently read-only except Restore.

### 17.3 Actual Start and implicit activity

- Actual Start and Actual End are system-managed. Actual Start records the first explicit Start or qualifying activity **only if currently empty**: adding comment, adding attachment, or closing Todo Thread. Creating Todo, editing metadata, Schedule and date arrival never independently set Actual Start.
- Qualifying activity on an **unpaused Draft** promotes it to In Progress and sets Actual Start if empty. **Draft + Paused is an explicit exception**: comments, attachments and Todo Thread completion neither change Draft nor set Actual Start; the user must explicitly use Start to begin work (and resolve the pause conflict). Qualifying activity on **In Progress + Paused** can establish Actual Start if empty without clearing pause.
- Direct Done/Close without Start leaves Actual Start empty ("Never Started"). Latest Actual End clears on Reopen. **Reopen never sets Actual Start**: if previously recorded, preserve it; if empty, keep it empty until explicit Start or qualifying activity.

### 17.4 Schedule and Reschedule

- Draft Task displays distinct **Start** primary quick action and **Schedule** secondary form action. Schedule does not show a status selector. Missing Planned Start defaults to **Tomorrow**.
- Schedule with **Pause Until Start unchecked**: Draft → In Progress (not Paused), Actual Start stays empty until separately set by Start/qualifying activity.
- Schedule with **Pause Until Start checked**: remains Draft, becomes Paused, Paused Until = Planned Start, reason Waiting, system Activity Log comment "Waiting to start"; no automatic Resume at Planned Start.
- Reschedule is a tertiary action for open Tasks, including paused Tasks: edit dates and optionally pause settings, preserve pause by default, never implicitly Resume or reset Actual Start. **Editing Planned Start never automatically adjusts Paused Until**, even if Pause Until Start originally copied Planned Start into Paused Until. Paused Until may precede Planned Start without warning; retain the existing nonblocking warning when Paused Until exceeds Due. Closed requires Reopen first.
- Maintain planned date ordering and optional paired-date-shift rules where not superseded.

### 17.5 All Tasks and Saved Views

- One shared Task View workspace. All Tasks opens open, nondeleted Tasks by default, mandatory **Group By Category**. Opening a Saved View loads its query settings into the same workspace and displays its saved name as page title.
- **Group By mandatory** for every normal Task View; None is not selectable. Filters/Sort support Category, Location, lifecycle, paused condition, closure outcome, Important/Urgent, dates, Include Closed and Include Deleted as applicable. OR within a dimension, AND across dimensions; grouped dimension not simultaneously filterable.
- Category and Location groups follow globally user-defined orders; pickers and table sorts alphabetical. Optional Location has Unspecified group. Locations support stable IDs, rename, reorder, icons, archive, case-insensitive Unicode NFC-trimmed unique names, max 30 graphemes. No required starter Location list. Latent coordinates have no UI.
- All Tasks: **Save As... only** and Reset to system defaults. Saved View: **Save** to update, **Save As...** to create, and Reset to last saved definition. Unsaved setting changes visibly indicated; current workspace configuration retained during session until navigation.
- Navigating away from a modified Task View **to any destination including Task Detail** warns by default with Discard & Continue / Cancel and **"Do not show this warning again"**. Per-user warning preference persists across clients; if disabled, navigation discards changes immediately. Back from Task Detail restores origin view identity, saved/default configuration and applicable navigation context but never discarded configuration edits. Task data edits are never discarded by this view warning.
- Settings → Views manages rename, Dashboard inclusion, reorder and deletion of ordinary Saved Views. Saved Views are stored queries, not Task owners. Deletion requires named confirmation, removes Home section, and **never deletes Tasks**. One global cross-device order, with newly created Views appended; reorder in Settings only, not Home. New user-created Saved Views have Show on Home enabled by default.
- **Provision exactly six ordinary editable Saved Views automatically for new users**, in default order: **Focus**, **Scheduled**, **Priority**, **Local**, **Completed**, **Deleted**. Users may rename, reconfigure, hide from Home, reorder or delete these ordinary Saved Views. All six initially have Show on Home enabled.
- **All Tasks is a special protected system View**, automatically present with immutable name and persisted default query definition. It cannot be renamed, updated, deleted or hidden from Home. Its working query can still be edited temporarily, Reset to system defaults, or saved through **Save As...**; **Save** is unavailable. Include All Tasks in the same global ordering list, **last by default** after the six ordinary Views. Users may reorder it in Settings → Views and the order is retained across sessions and clients. All Tasks keeps its permanent navigation entry.
- **Provisioned definitions and default per-group sort:** Focus = all open nondeleted Tasks, Group By Due Date, Due ascending. Scheduled = all open nondeleted Tasks, Group By Planned Start, Planned Start ascending. Priority = all open nondeleted Tasks including paused, Group By Important/Urgent, Due ascending. Local = all open nondeleted Tasks, Group By Location, Due ascending. Completed = nondeleted Closed Tasks with outcome Done, Group By Actual End, Actual End descending. Deleted = all soft-deleted Tasks, Group By Deleted Date, Deleted Date descending. All Tasks = all open nondeleted Tasks, Group By Category, Due ascending. Sorting defaults are accepted pending later UI review; this does not reopen current domain decisions.
- **All seven Views appear on Home initially**, including protected All Tasks whose inclusion is permanently on. Home follows their global ordering; the first section defaults expanded. Users can hide any ordinary Saved View while All Tasks remains visible.
- **Group partition invariant:** Every matching Task belongs to exactly one mutually exclusive group. The sum of group counts equals the View's Task count. Date range buckets must not overlap; missing grouping dates are assigned to **Unspecified**, always ordered last, including when empty. Zero-count groups remain in Task Views and Dashboard legends but have no pie slices. Deleted Date grouping can use non-overlapping relative buckets (Today, Yesterday, 2–7 days ago, 8–30 days ago, Older); specific Windows Explorer-like visual treatment is deferred to UI design. Applied analogously for Completed and other time groupings. All date boundaries use configured timezone.
- **Deleted View access:** Deleted Tasks appear and count normally in its Home section; opening them is read-only, with only permitted Restore, Permanent Delete and applicable bulk operations under existing authorization/confirmation requirements. Deleted Tasks remain excluded from global burn-rate.
- **Closure Reason discovery is filter-only, not Group By.** Every Task View exposes a multi-select Closure Reason filter, with values Done, Cancelled, Unable to Complete, No Longer Applicable, Duplicate and Other. Selected values use OR within this filter and AND with other dimensions. No additional default Closed View is provisioned; unsuccessful closures are discoverable by explicitly enabling Include Closed and filtering by Closure Reason.
- **Include Closed is the prerequisite:** when disabled, Closure Reason selection is unavailable and any selections are retained but inactive. Re-enabling Include Closed reactivates them. Choosing a reason never automatically enables Include Closed. Saved Views retain both the scope control and selected reasons.
- **Include Closed and Include Deleted are independent scope-expansion controls**: both off = open nondeleted; Closed only on = all nondeleted; Deleted only on = open including deleted; both on = all Tasks including deleted Closed Tasks. Other applicable filters/grouping/sorting apply equally to all eligible Tasks. Deleted Tasks remain read-only wherever encountered.
- **Deleted Date is the single source of truth for soft deletion**: populated means deleted, empty means not deleted; soft deletion sets it and Restore clears it. There is no separately stored deletion-state Boolean or dedicated Deletion Status attribute. The query model supports Deleted Date **Is Set** / **Is Not Set** and appropriate date-range conditions. The provisioned Deleted View enables both Include Closed and Include Deleted and restricts results to Deleted Date Is Set; it does not require a special query engine or separate Deleted dataset.
- Important/Urgent fixed order: Do First (Yes/Yes), Schedule (Yes/No), Delegate (No/Yes), Eliminate (No/No), Unclassified (either Unset). These are grouping labels, not actions.

### 17.6 Home Dashboard

- Home is default landing. Global burn-rate plus collapsible sections for Dashboard-enabled Saved Views. No embedded Task lists; Saved View links open the shared Task View. Home refreshes on navigation to it.
- Each Saved View section shows a **pie chart** grouped by that View's mandatory Group By, with legend labels and counts **including zero-count groups**. Zero groups have no slice but remain accessible through the corresponding group in the linked View. **Selecting a nonzero chart segment or a legend group opens the unchanged Saved View and scrolls to and expands that group section**; it **does not** apply a temporary filter, replace Group By, modify sorting, or mark the View as unsaved. The same target-group navigation is available for zero-count groups, with an informative empty group and Open View link rather than blocking reconfiguration.
- If a whole Saved View matches **zero Tasks**, its Dashboard section remains visible in its global position and exposes an **empty-state message plus Open View link**, without a pie chart; the linked View remains fully configurable. All Tasks follows the same empty-state navigation but its system default cannot be overwritten. Grouped sections do not duplicate counts in a separate summary card. Defensive missing/invalid Group By fallback shows total count and link only.
- Dashboard group counts derive from the **entire matching Task population**, regardless of which Task View groups happen to be expanded/collapsed; each Task counts in exactly one group. Expansion is presentation state, not a query filter.
- First Saved View section expanded on new session; other sections collapsed. Expansion retained within session, refreshed data does not reset it. Order reflects global Saved View order controlled in Settings; no Home drag-and-drop.
- Burn-rate chart: **two clustered bars** (New and Closed), no Net Change. Desktop/tablet vertical; mobile horizontal, fixed-height vertically scrollable, current partial period initially visible.
- Global, unfiltered by Saved Views, excludes deleted Tasks. New series counts distinct nondeleted Tasks by Created Date; Closed counts only **currently Closed** distinct nondeleted Tasks by their current latest Actual End. Evaluate as of today: reopen removes from Closed series until reclosed. Repeated historical closure events never inflate counts.
- Period selector Last N Days/Weeks/Months: Days **3/7/10**, Weeks **4–12**, Months **3–36**, representing N complete calendar periods **plus current partial**; current bucket visually distinguished. Configurable week start (Monday default), user timezone. Remember last selected N/unit across sessions/clients. **Initial default is Last 7 Days** (seven completed calendar days plus today).

### 17.7 Reactive Task-data and View consistency (functional requirement)

- The application maintains current Task data in a shared **store/state** abstraction. Successful Task mutations update this state; affected Task rows, grouping membership and aggregate counts update reactively and locally without requiring manual Refresh.
- If an updated Task remains eligible in the same group, update its row. If it moves to another matching group, relocate its row. If it ceases to qualify, remove it from the current View. If it newly qualifies, add it to the appropriate group. Update matching group counts and Home chart aggregates from the same authoritative client state.
- This **explicitly supersedes** the historical requirement to keep edited rows stationary, defer membership/count/sort updates until Refresh, and display a distinct edited-Task Refresh counter (§7.4 and earlier Issue 12 records). Manual refresh may remain useful for recovering stale external data; it is not necessary after local successful mutations.
- **Implementation design deferred to each vertical slice:** choice of state-management library, optimistic versus acknowledged mutation ordering, query invalidation, concurrency, cache reconciliation, offline behavior and cross-client synchronization. Do not infer a particular technology or atomicity guarantee from this product behavior.

### 17.8 Post-closure amendment: Reference and lightweight Global Search (approved 2026-10-19)

**Task Reference**
- A Task has **one optional Reference** field: ordinary user-editable free text, maximum **255 characters**, no uniqueness constraint, no modeled external relationship. Reference belongs to the Task, not to a Category, Location or user-level setting.
- Reference is ordinary metadata: editing it does not implicitly Start a Task or create an Activity Log event; normal Closed/Deleted read-only constraints apply.
- Reference is searchable along with Task **Title**, current **Category name**, and current **Location name**.

**Header Global Search: temporary Task View text filter**
- Global Search is **not a separate search workspace**. On explicit Submit of **nonempty** text, search the currently open Saved View or All Tasks using that View's eligible Task population. If no Task View is open, open **All Tasks** and apply the search; submitting empty text without an open View does **nothing** and must not navigate.
- Match a **single contiguous phrase** (not separately tokenized words), after trimming leading/trailing whitespace, as a **case-insensitive substring** of any one of Title, Category name, Location name, or Reference. Field matches combine with **OR**; the overall text condition combines with the View's structured filter conditions using **AND**. This is a simple metadata match, not description/full-text/deep-content search. No three-character minimum is carried forward.
- Search text is **temporary client-side workspace state**, **never part of a Saved View definition** and never captured by Save or Save As. It does **not** mark the View as modified or itself trigger an unsaved-View warning.
- Search preserves the View's Group By, global group order, sort keys/directions, and all group sections **including zero-result groups**. Counts show the current search result population. No relevance ranking, special grouping or search-specific View.
- Changing the current View's filters, Group By or Sort while Search is active retains the text filter and reevaluates matches; these configuration edits retain their normal unsaved-change semantics. Empty Submit clears the active search and restores results under the current View configuration.
- Navigation away from Task View (including Home, Settings or another Saved View) **clears** search. **Task List → Task Detail → Back** is an exception: restore the search phrase, result context and list/scroll position as part of returning to the same workspace.
- The selected View's entire eligible Task population must be available to the client-side text filter; searching only rows currently rendered/paginated is **not** a valid complete result. Exact fetching/caching/reactivity mechanisms are decided in the relevant implementation slice.
- **Future scope only:** description/comments/Todos/Activity Log/attachment content search, full-text/deep search, rich ranking, and any separate search experience. Historical §9.5's separate Global Search workspace, Title/Description/All Content depth modes, three-character minimum, remembered Search configuration and old Quick Search distinction are superseded. Header Search entry remains.

### 17.9 Account-wide manual Cleanup (replaces fixed Closed/Trash bulk actions)

- Bulk cleanup belongs to **Settings → Cleanup**, not to Saved Views or the Task View workspace. This is an account-wide maintenance operation: it evaluates **all qualifying Tasks** regardless of the user's current Saved View, filters, grouping or sorting.
- **Move Closed Tasks to Trash:** select nondeleted Closed Tasks whose current Actual End is older than the chosen threshold and soft-delete them.
- **Permanently Delete Deleted Tasks:** select soft-deleted Tasks whose Deleted Date is older than the chosen threshold, irrespective of their underlying open/Closed lifecycle.
- Each operation retains its own **N Days / N Months** age setting, remembered across sessions and clients. Execution is **manual only**; no automatic or scheduled cleanup.
- Eligibility is **strictly older than** the full configured calendar-age threshold: equality at the cutoff is not eligible. Evaluate calendar days/months in the user's configured timezone, using the §17.1 calendar-offset and month-end clamping rules, preserving relevant local clock times and DST disambiguation.
- Both operations show count of qualifying Tasks, require explicit confirmation and honor existing irreversible-deletion warnings. Existing storage-before-record permanent deletion order, partial-success/failure reporting and manual rerun behavior are retained.
- Cleanup acts on Tasks and their stored content/history as dictated by deletion policy; it never deletes or rewrites Saved View definitions.

### 17.10 Major revision closure, retention and deferred design

Remain valid unless explicitly superseded: Todo Thread ownership/states, attachment limits and lifecycle, plaintext comments, WYSIWYG Task descriptions, Activity Log immutability, soft deletion/restore/Trash, Important/Urgent tri-states, responsive Task Detail, and unsaved Task content protection.

**Major-changes product discussion closed (2026-10-19), with approved post-closure Reference/Search amendment in §17.8:** The owner directed closure of the functional redesign and transition to design-first, slice-by-slice implementation. §17 controls wherever historical §§1–16 disagree. Historic Issue 12–17 texts are retained as chronology, **not** competing executable requirements. Contradiction audit below identifies explicit supersessions; do not revive old behavior from the earlier sections.

**Final supersession audit / traceability:**
- Old nine-state lifecycle, interruption microstates, standalone Ready/Planned and archived-terminal status → **three states plus independent Pause and closure outcome** (§17.2–17.4).
- Old mandatory Resume/Reopen explanations and non-Done closure explanations → **noninteractive Resume/Reopen when no conflict, required Pause episode comment, Close reason with optional comment** (§17.2).
- Old DOW/TOD Task preferences, symbolic TOD stored precision, HERE/NOW proximity and GPS → **no preference matching/proximity; TOD is a timestamp-resolving date-entry convenience** (§17.1).
- Old fixed query routes and Remember per preset, fixed Home sections → **one workspace, saved/system Views, Dashboard** (§17.5–17.6).
- Old Trash/Closed bulk actions attached to fixed views → **account-wide Settings → Cleanup** (§17.9).
- Old standalone/deep Global Search and per-view Quick Search → **one temporary client-side metadata text filter within the active Task View; new Task Reference** (§17.8).
- Old edited-row stationary/Refresh counter → **reactive store and immediate row/group/count updates** (§17.7).
- Old Dashboard chart temporary segment filter → **navigate to unchanged View and scroll/expand target group** (§17.6).
- Old Pause Until TOD end boundary → **start boundary for Pause Until and Planned Start; Due end boundary** (§17.1).

**Deferred to design-first implementation slices, not blockers to closure:** conflict-dialog copy/layout; dense chart legend appearance; fine-grained filter combinatorics and date-group presentation; client state management/concurrency/cache contracts; authorization and persistence APIs; architecture and backend feasibility. These must be reconciled with the functional invariants before implementation. Any newly discovered **material domain conflict** requires a separately approved specification decision, not silent implementation choice.

**Delivery status:** Major-changes **product specification discussion closed**, not application implementation or design verified. No beta/production migration and no approved backend. MongoDB Atlas Free remains an Issue 18 feasibility candidate. **Do not edit or delete docs/product_spec_legacy.md.**


## 18. Firebase Spark PoC/beta architecture and high-level data design (owner-approved direction, 2026-10-19)

**Authority / status:** This section records the owner's agreed PoC/beta platform, corrected ownership model and high-level transaction requirements. It supersedes conflicting historical §15 logical/physical direction, §17 references to a pending backend, and earlier hosted-API / direct-Google-OAuth proposals. **Firestore collection layout is a proposed design, not a deployed or tested physical schema. Security-rule feasibility and deletion safety are explicit gates.** Do not interpret platform approval as approval to provision or deploy cloud resources.

### 18.1 Platform, application boundary and high-level navigation

**Environment amendment (owner, 22 October 2026):** Firebase project
`taskify-dev-dpdhole` (number `243252492098`) is the verified, active PoC/testing
project with billing disabled. The owner subsequently instructed a clean start,
superseding legacy preservation: the old Firestore database/data/indexes, Rules,
custom-domain binding and browser API key were removed. See
[clean-start results](slices/firebase-clean-start.md). No legacy data migration is planned.
Project identity and the empty, non-deletable default Hosting container remain.
The [Hosting-only checkpoint](hosting_deployment_plan.md) now has a verified
expiring preview, update and saved-artifact restoration; see
[deployment results](slices/hosting-deployment.md). Live publication and new
product Auth/Firestore provisioning have not occurred.

- **PoC/beta platform:** Firebase **Spark (no-cost)** capabilities only: Firebase Authentication with Google sign-in, Cloud Firestore, and static Firebase Hosting. No separate hosted Taskify API, server-managed Taskify sessions, Cloud Functions, Firebase App Hosting or Blaze upgrade in this release baseline. No runtime service requiring payment is an approved dependency.
- **Client architecture:** web UI → client-side application/domain services and shared normalized Task store → provider-independent persistence ports → Firebase/Firestore adapter. The browser is **not** trusted: Firebase Auth supplies identity and Firestore Security Rules enforce per-user access and any expressible cross-document constraints. Provider independence applies to application code/contracts, not to the deployed Firebase security policy; one provider adapter is needed initially.
- Cloud writes are authoritative. Successful mutations update shared client Task state so rows, group membership and counts react without a mandatory manual refresh. Offline write sync is out of scope. Google sign-in session persistence is managed through supported Firebase Auth mechanisms, not a custom server session.
- **High-level layout direction:** Gmail-inspired navigation, with Dashboard replacing Inbox, a shared Saved View results workspace and Task Detail as the conversation-like detail view; left navigation contains Dashboard, All Tasks and Saved Views. Profile/Settings access moves to top-right; global Create/Search actions are at the bottom with scroll-related hiding. The detailed responsive layout/scroll rules are deferred to slice design. Global Search remains the temporary View-scoped filter of §17.8; its approved semantics are unchanged by repositioning its control.
- **Link-only attachment scope for PoC/beta:** Discussion supports external-link references only. Binary file uploads, file-object storage and associated file download/ZIP functionality are deferred beyond PoC/beta, not deleted from later product scope.

### 18.2 Corrected Task aggregate and ownership model

- **Task:** one user-owned aggregate root storing identity, owner, title, description, optional Reference (≤255 characters), category/location references, Important/Urgent values, Draft/In Progress/Closed lifecycle, independent Pause, current closure outcome, Created/Planned Start/Due/Actual Start/Actual End/Deleted Date and concurrency metadata. Do not persist obsolete DOW/TOD Task preferences, an independent deletion Boolean, or View grouping as Task-owned state.
- **Discussion:** one permanent Task-owned conversational component. **Only Discussion supports user-authored comment Entries and external-link attachments** in this release. Link metadata belong to Discussion, not to a Todo or Activity Log entry. Discussion comments remain subject to the approved comment edit/delete window and Task editability rules.
- **Todo:** zero or more Task-owned checklist records with stable ID, title, open/closed state, order and timestamps. **Todo has no Entries, no comments and no attachments.** It is not a general-purpose Discussion Thread and needs no embedded Thread hierarchy. Retain parent Task closure behavior, Todo close/reopen and their approved effects on Actual Start/lifecycle. Historical Todo-specific attachment/comment restrictions no longer apply because such content cannot exist.
- **Activity Log:** permanent Task-owned chronological record of structured **system event Entries**. It conceptually **extends the entry structure used by Discussion** with event type, operation metadata, before/after or changed-field details where applicable, reason/comment when required, timestamp and actor identifiers. Activity Log events are append-only/immutable; users cannot edit/delete them independently. Activity Log has no attachments and is not itself a user-comment discussion thread.
- **Categories, Locations, Saved Views and Settings:** separate user-owned logical records. Category and Location IDs are referenced by Task; their names remain authoritative on the referenced entities. Saved Views are independently identifiable saved query definitions with ordering and Home visibility, never owners of Tasks. All Tasks is the protected system definition; Search text, scroll and navigation context are ephemeral and never saved as View definitions.
- **Read model:** list/Dashboard/search loads all eligible lightweight Task metadata (plus classification labels needed by client text matching), not all Discussion comments or Activity events. Load Task Detail's discussion entries, Todo data and history on demand. Defer caching/query mechanics to implementation design.

### 18.3 Proposed Firestore physical arrangement — not yet schema approval

A candidate user-scoped collection layout (where uid is Firebase Auth UID) is:

```text
users/{uid}                        # profile/settings; view order and user preferences
users/{uid}/tasks/{taskId}         # Task metadata; bounded Discussion link metadata possible
  /todos/{todoId}                  # Task-owned checklist items only
  /discussionEntries/{entryId}     # editable plain-text user comments
  /activityEvents/{eventId}        # append-only structured system events
users/{uid}/savedViews/{viewId}    # independent query definitions
users/{uid}/categories/{categoryId}
users/{uid}/locations/{locationId}
```

Paths and data boundaries are **candidates**. Consider Task document size, efficient eligible-Task queries, security-rule access budgets, index/read cost, and the limits of atomic related-document checks before approving physical structure. A user UID in a path does not by itself authorize reads/writes; Security Rules must validate authenticated ownership. Do not duplicate Derived View membership or search indexes as Task state.

### 18.4 Atomic mutation boundaries and integrity requirements

- **Approved invariant:** an operation that must update Task state and record a required Activity Log event commits both atomically, or neither. Applies to Start/Schedule/Pause/Edit Pause/Resume/Done/Close/Reopen, audited date changes, Delete/Restore and other audited Task mutations. Store sufficient stable operation/event identifiers and concurrency metadata to detect conflicting or incomplete actions; the exact representation is deferred.
- **Discussion post:** create the comment Entry and, when qualifying activity changes Draft/In Progress or Actual Start, include corresponding Task change and any required system event in the **same atomic operation**. Editing/deleting an ordinary comment follows existing permissions and audit policy.
- **Discussion link mutation:** link metadata updates and any required Task state change plus required Activity event constitute one atomic database write set.
- **Todo creation:** create checklist record, with no implicit Start; any approved audit event must be included if required by the final operation contract. **Todo close/reopen:** atomically persist Todo status, any affected Task lifecycle/Actual Start fields, and any required Activity event.
- **Saved View and ordinary non-audited Task metadata edits:** independent single-document writes where no cross-record invariant applies. Any required multi-record reordering or dependent data changes must be modeled as atomic operations if needed.
- **Firestore mechanism:** transactions or atomic write batches from the client; Firebase Auth and Firestore Security Rules independently enforce ownership, permitted fields/state transitions and feasible cross-document checks (including getAfter where useful). **Atomicity of a batch does not prove correctness**: the direct-write adversarial/rules test must verify no permitted path updates lifecycle without its required event or forges prohibited state. Treat authenticated-user-authored event history as app-enforced records, not independently tamper-proof server evidence.
- **Hard feasibility gate:** If Firestore Rules cannot enforce an essential domain invariant without a trusted server, **do not weaken it silently**. Present options requiring explicit approval (e.g., schema/operation redesign, deferring functionality, or changing infrastructure/cost constraints).

### 18.5 Permanent deletion and free-tier feasibility gates

- Soft deletion marks **Deleted Date** and retains Task hierarchy; Restore clears it. Closed/Deleted read-only semantics and Cleanup eligibility remain as specified in §17.
- Deleting a Firestore Task document does **not** cascade to subcollections. An arbitrarily large Task with Todos, Discussion entries and Activity events cannot be assumed removable in a single bounded client transaction. **Permanent deletion requires an explicitly validated idempotent, recoverable multi-step deletion design**, including partial failures, authorization, and ensuring inaccessible orphaned subcollections are handled. Do not claim an atomic Task-and-all-children purge on Spark.
- No binary file cleanup is required in the PoC/beta link-only scope; file-first deletion rules remain relevant if uploads are introduced later.
- Before implementing domain slices, validate Firebase Spark availability/quotas, rule size/access limits, atomic Task+event mutation and conflict rejection, and client metadata loading/cost. **Owner scope amendment (22 October 2026): user-driven backup/export/recovery is a required future capability, with implementation deferred to FUTURE. PoC/beta may proceed without user backup/recovery; its implementation or demonstration is not a PoC/beta prerequisite.** Exceptional trusted-owner manual recovery remains the accepted operational approach, not a guaranteed backup service. This supersedes the earlier prerequisite for a usable manual backup/export/recovery method; ordinary write recovery, integrity and interrupted-purge safety remain required. No new successful test or provisioning is claimed.

### 18.6 Explicit supersessions and retained decisions

- Historical §15's generic Task → Thread → Entry/attachments model is corrected: **Discussion alone owns comments/links, Todos are checklist records, Activity Log owns immutable structured event Entries.**
- Historical separate hosted API, direct Google OAuth, Taskify-managed server sessions, Appwrite/Atlas-first approach and deep content search are **not** the PoC/beta baseline. Firebase Spark is the selected provider; MongoDB remains a historical evaluated alternative.
- This high-level design remains consistent with §17 lifecycle, Saved View, Dashboard and lightweight Search rules; only the conflicting Todo/Discussion/Activity Log ownership and PoC/beta attachment delivery scope are superseded. Detailed UX, exact field types, collection indexes, Security Rules and backend adapter contract belong to slice-level design.


## 19. Mobile-first application shell and navigation (owner-agreed UX direction, 2026-10-21)

**Authority and scope:** Owner explicitly authorized documenting the mobile shell discussion. This section records agreed high-level UX behavior, not implementation, final visual design, or detailed slice action definitions. It refines and supersedes §18.1's older bottom Create/Search placement and top-right Profile/Settings entry for the **mobile shell**. The desktop layout remains to be designed. Existing §17 Task View, Search, Dashboard, Task Detail and domain rules remain authoritative.

### 19.1 Header and navigation contexts

- **Standard mobile header** on Home/Dashboard and all Task Views (All Tasks and ordinary Saved Views): hamburger on left, **left-aligned contextual page/View title**, Search icon on right. Long titles truncate. For Saved Views, the title area may expose an edit/configuration entry point; exact interaction is deferred. Do not use a permanent centered Taskify brand as the standard header title.
- **Contextual mobile action header** on Task Detail and Settings/subpages: **Back on the left**, context-appropriate primary icon actions where useful, followed by a three-dot overflow for other available actions. The header itself is **icon-only**; page title and contextual metadata are placed **below** the action header. Do not force a fixed number of actions; 0–3 may be appropriate depending on context, lifecycle and available operations. Exact action set, authorization, placement and overflow hierarchy are slice decisions.
- Task Detail and Settings use **Back-only navigation**: no hamburger in their contextual header. Back returns to the actual originating navigation context and restores the applicable workspace state according to the existing Task Detail/Task View contracts; direct-linked Task behavior follows browser history without inventing an origin.
- Home is a **task-navigation context** for drawer expansion, although it remains a distinct Dashboard destination.

### 19.2 Mobile navigation drawer

- Hamburger opens a **left-side overlay drawer** above the main content, with a dismissible backdrop; opening it does not resize or reflow the underlying workspace. Mobile destination selection closes the drawer.
- **Home remains permanently visible** outside collapsible sections. The two accordion sections are **Task Views** and **Settings**, with **at most one expanded** at a time; users may toggle sections manually while the drawer is open.
- On opening the drawer, **Task Views expands** from Home, All Tasks, Saved Views, Task Detail or Task View search context. **Settings expands** from Settings or any Settings subpage. Expansion follows the active application context, rather than merely the section most recently opened. The other section collapses.
- Task Views lists ordinary Saved Views and protected All Tasks in the **same global user-defined order** used by Home/Dashboard and Settings → Views. All Tasks defaults **last**, but users can reorder it; this does **not** make its system definition editable. Views are directly listed, not hidden behind a second navigation layer. A secondary **Manage Views** link at the end of this section opens the same Settings → Views management destination.
- Settings expands inline to: **Views, Categories, Locations, Preferences, Cleanup, My Account**. The destination remains part of Settings, not a second management implementation. The exact account/sign-out placement is deferred to the Settings slice.
- The drawer should support independently scrollable content on small devices or with many user-created Views. Detailed accessibility, gesture and focus behavior are deferred to the navigation slice.

### 19.3 Search

- The standard header Search icon opens an **expandable, header-anchored text form**, with explicit Submit, rather than navigating to a separate Search screen.
- Search operates **in place** in the currently open Task View, including **All Tasks**. With no open Task View, a nonempty submission opens All Tasks and searches there. Empty submission and clearing, temporary state, matching fields, grouping, sorting, counts and navigation semantics remain exactly as specified in §17.8. Popup sizing, keyboard/focus and dismissal details are deferred.

### 19.4 Create and adaptive floating action button

- Global **Create** is a **bottom-right anchored floating action button (FAB)** on Home and Task Views, including All Tasks and Saved Views. It is **absent** from Task Detail and Settings/subpages. A duplicate Create entry at the top of the drawer was considered but **not adopted**; revisit only if usage warrants it.
- **Initial/idle state:** extended, right-aligned FAB with icon and **Create** label. **Normal scrolling:** label slides/collapses inward, leaving the icon fixed at the same bottom-right position; icon size/emphasis may reduce. **Sustained or rapid scrolling:** retain the icon at approximately **20% opacity** rather than hiding it. On scroll reversal/idle, restore prominence and then the label. Keep the icon's position and effective touch target stable through transitions.
- The faded icon remains actionable, not disabled; avoid stealing scrolling gestures. Precise scroll thresholds, transition timings, hit-area behavior and accessibility require validation in the UI slice. FAB is not shown while the Create sheet is active.
- Create opens a **bottom quick-create sheet** containing **Title, Category and Location**; Category and Location are prepopulated with their applicable defaults. **More** expands the **same form** to full-screen mobile detailed creation, retaining entered values. Exact default selection rules, required fields, validation and additional form fields remain slice decisions.

### 19.5 Desktop and implementation status

- **Desktop:** preserve the established responsive Task Detail direction (side panel by default, expandable to full page) and the high-level Gmail-inspired navigation concept. **Do not infer that the mobile accordion, FAB animation, icon-only contextual header or drawer behavior applies unchanged to desktop.** Desktop shell/sidebar/header specifics remain open for dedicated design.
- These are **documented owner-agreed mobile UX directions**, not proof of coded, tested or deployed UI. Exact responsive breakpoints, visual styling, screen action lists, accessibility and implementation mechanics are deferred to vertical slices.


## 20. Larger-screen and desktop application shell (owner-agreed UX direction, 2026-10-21)

**Scope:** This section refines §19 for larger screens, desktop and touch tablets. These are approved discussion-level UX directions, not implemented or usability-verified behavior. Responsive breakpoint values, animation thresholds and exact per-screen actions remain deferred.

### 20.1 Navigation rail, overlay preview and persistent sidebar

- Replace the mobile floating Create action with a **Create action at the top of desktop/tablet navigation**; no FAB in this layout.
- A burger control toggles the sidebar's **persistent expanded/collapsed state**. Persistent expansion **pushes/resizes the main content**; collapse returns to a narrow icon rail and restores workspace width.
- When the pointer **hovers over the collapsed rail**, the full navigation drawer opens as a **temporary overlay over main content**, without resizing it. On **mouse-out**, the preview closes back to rail mode. Hover preview is distinct from persistent expansion.
- A **Close icon** returns the persistently expanded sidebar to rail mode; it is particularly necessary for touch/tablet devices without mouse hover. It does not imply navigation away.
- On larger screens the **Task Views and Settings sections are always open**, rather than mutually exclusive mobile accordions. The navigation content is independently scrollable.
- In collapsed rail mode, display the available navigation/section icons (including Create, Home, Task Views and Settings) **at the same natural vertical positions they occupy in the expanded navigation**. Preserve expanded layout spacing and alignment; hide labels rather than collecting icons into a separate toolbar. Individual Saved View entries are not required to become separate icons in the rail; exact icon treatment for nested items remains a visual design detail.
- Preserve the same global Saved View/All Tasks ordering and protected system-View distinction specified in §17.5 and §19.2.
- **State retention:** persistent expanded/collapsed preference survives application navigation and remains stable within the current browser session; on a **new browser session**, initialize in **collapsed rail mode**. Temporary hover expansion is not retained.

### 20.2 Header, Search and contextual pages

- Larger-screen **standard workspace header**: burger, **Taskify branding and contextual page/View title**, then a **single-line Search form**. Search remains explicit-submit and temporary/View-scoped per §17.8; this is a control-placement difference, not a new search experience.
- **Task Detail** retains its own contextual top action bar with **Back**, exposing **more available primary/secondary actions before the overflow menu** than mobile width permits. **Title and context remain below** the action bar. Existing desktop Task Detail side-panel-by-default / expandable-to-full-page behavior remains governed by §9.3 and §12 as not superseded by §17–19.
- **Settings and subpages** use a contextual header with **Back, title and overflow only** in the larger-screen layout. This is intentionally distinct from the mobile icon-only Settings header, where title/context are below the bar (§19.1).
- Detailed command availability, action ordering, panel geometry, responsive thresholds, accessibility and touch/hover coexistence remain slice-level design work.

### 20.3 Explicit cross-device distinctions

- **Mobile:** overlay drawer with context-dependent mutually exclusive accordion expansion; bottom-right adaptive Create FAB; contextual Task Detail/Settings headers are icon-only with title/context below (§19).
- **Desktop/tablet:** collapsible rail and expanded sidebar, always-open navigation sections, top-of-navigation Create action, branded workspace header and inline Search. Hover preview is available only when a hover-capable pointer exists; persistent expansion and explicit Close support touch.
- **No domain divergence:** the same Task, View, Search, Dashboard and navigation-origin semantics apply across layouts. No implementation, tests or deployment are claimed.


## 21. Responsive screen patterns and account experience (owner-agreed UX direction, 2026-10-21)

This section supplements §§17–20 and supersedes conflicting presentation-only provisions below. It records approved high-level UX direction, not implementation. Exact fields, permissions, breakpoints, error behavior and accessibility remain slice-level.

### 21.1 Home Dashboard
- Burn-rate chart uses full available content width; retain §17.6 metrics, period controls, orientation and data rules.
- Dashboard-enabled Saved View charts form a responsive one-, two-, then three-column grid in global View order, left-to-right then top-to-bottom. Protected All Tasks remains included.
- **All Dashboard charts remain expanded at all widths.** This supersedes §17.6's collapsible sections, initial first-only expansion and session expansion retention. Cards grow with legends.
- Pie slice or legend selection opens the unchanged View, expands and scrolls to the corresponding group, including zero-count groups. No additional filter is applied.

### 21.2 Shared All Tasks / Saved Views workspace
- Present Tasks as a grouped table with collapsible group-divider rows displaying label and matching count. Counts are independent of expansion. Preserve mandatory Group By and within-group sorting (§17.5).
- **All groups default collapsed** on ordinary View entry; independently toggleable. Wider screens show additional table columns; narrow screens wrap/stack each Task row into labeled value pairs. Responsive visibility never changes query or sort semantics.
- Dashboard drill-down expands and scrolls to its target group; other groups remain normally collapsed unless restoring navigation context.
- Task View → Task Detail → Back restores originating View, expanded groups, search and scroll/list position, subject to existing unsaved-View navigation semantics. Normal entry to another View starts collapsed.
- Column selection, stacked-field order and row actions are slice-level.

### 21.3 Create
- Mobile: adaptive Create FAB opens Quick Create bottom sheet with Title, defaulted Category and Location. More expands the same form to full-screen Advanced Create, retaining entered values.
- Desktop/tablet: top-of-navigation Create opens centered Quick Create modal. More expands the same form to a **large centered Advanced Create modal**, not full-screen or a separate page. Retain entered values; modal content may scroll.
- Both modes share Task defaults, validation and submission. Detailed fields, dimensions, dismissal and unsaved-change behavior remain slice-level.

### 21.4 Settings management and forms
- Views, Categories and Locations share an ordered-record management pattern: narrow screens use sortable vertical lists with drill-down details/actions; wide screens use sortable tables with visible relevant details/actions. Manual order is authoritative, not column sort order.
- Desktop reorder via drag/drop; small-screen reorder via Move Up/Down. For entity types permitting creation, positional (+) before/between entries inserts at that logical position, with end-of-list Add. Desktop positional affordances appear on hover/focus. Reuse existing ordering sequence rules.
- Ordering changes remain provisional until **explicit Save Order**. Leaving with unsaved ordering prompts Save / Discard / Stay. Non-order edits can persist separately.
- Settings → Views does **not** directly Create/Insert Saved Views. §17.5 Save As remains the creation route. Existing rename, Dashboard inclusion, reorder, delete and protected All Tasks rules remain. Clone → rename → edit is a candidate workflow for slice evaluation, not an approved feature.
- Archive is the domain concept where supported; muted/transparent presentation does not introduce a separate Hidden domain state. Dashboard Show-on-Home is distinct from archive. Entity-specific delete/archive dependencies and confirmation remain slice-level.
- Preferences: simple responsive single-form interaction, mobile stacked and desktop width-constrained. Additional drawer entries only if justified later.
- Cleanup: simple form for selecting and executing the §17.9 manual account-wide operations, with processing/progress feedback, success/partial-failure, and retry/recovery. Do not assume precise progress or background/resumable execution without §18 Firebase Spark feasibility validation.
- My Account: responsive user-info form including name/photo, identity/linked providers, possibly core account preferences, Logout and a separated Delete Account action. Delete/recovery semantics deferred. Profile data and authentication identity are distinct.

### 21.5 Login, identity and workspace initialization

**Owner amendment, 23 October 2026:** Google and Microsoft are the active Slice 3
sign-in providers. Apple authentication is deferred, including feasibility,
configuration, implementation and validation; it is not a Slice 3 acceptance
blocker. This supersedes the Google/Apple delivery scope below. Persistent device
authentication and proof-based linking policy remain unchanged; provider
feasibility remains unverified. See [Slice 3 detailing](slices/03-provider-sign-in.md).

- Shared branded hero and centered Google/Apple sign-in controls across all screen widths. Authentication persists on device until Logout or invalidation.
- First access displays workspace-provisioning status/progress; returning access displays loading while fetching initial Task population. Provisioning must be idempotent and safely retryable; detailed recovery remains slice-level.
- Initialize display name and photo from available social profile data; do not assume values always exist or overwrite user edits automatically.
- Verified identical email across providers should resolve to the same Taskify account through secure account resolution/credential linking. Firebase does not guarantee automatic linking; Apple private relay can produce different email addresses. Never trust an unverified email claim as authorization. Exact linking UX and security deferred.
- Email OTP is a candidate alternative, not an active approved login channel. Google + Apple extends §18's earlier Google-only Firebase Spark PoC/beta baseline; provider feasibility must be validated.

### 21.6 Task Detail responsive sections
- Retain contextual Back/action bar (§§19–20), mobile full-page and desktop side-panel-by-default expandable presentation where compatible.
- **Mobile order:** action bar; Title/Reference; status and planning dates; Task preferences; description preview with Show All; Todo CRUD checklist; Discussion latest five complete entries with More and new-entry field; external-link Attachments list with Add; Activity Log.
- **Desktop/wider:** action bar and Title/Reference span width, then two columns. Left: longer description preview, Todo management, external-link attachment management. Right: status/planning, Task preferences, Discussion management, Activity Log viewer.
- Section content can grow; precise description/history expansion deferred. Visual placement does not change ownership: Todo Task-owned; Discussion entries and their attached external links Discussion-owned; Activity Log immutable structured system history.
- Attachments presentation aggregates Discussion-owned external links and **independent Task-associated external links**. The independent link ownership/record contract is deferred to the slice; do not create fake Discussion entries. No binary uploads in PoC/beta.

### 21.7 Scope
All decisions above are high-level UX direction, not implemented/tested state. Slice-level work includes responsive breakpoints, actions, field definitions, authorization, accessibility, errors, Firebase Rules/data feasibility and persistence. No code, infrastructure or migration change is authorized by this section.

## 22. High-level architecture policy consolidation (owner-agreed, 2026-10-22)

The owner reviewed and accepted the policies consolidated in [architecture.md](architecture.md).
This section refines §§17–21 without claiming implementation, deployment or overall
platform acceptance. Detailed interfaces, schemas, tools and interactions remain
for slices. These decisions govern conflicting earlier assumptions:

- **Stack/boundaries:** TypeScript UI/application/domain/adapters, static browser
  delivery and provider-independent ports. Keep business logic separate from UI
  and provider SDKs for possible future server reuse; no server tier is approved.
  Choose framework/build/store together in the first implementation slice.
- **Compatibility:** authoritative checks use inclusive minimum/maximum app releases,
  understood contract format, matching environment, readable retained schemas and
  permitted write schemas. Server release is traceability, not a separate support
  range. Check at boot and resume/reconnect; observe contract changes while open.
  Mutations honor revocable readiness without a network fetch per write. Rules
  independently enforce integrity against modified clients and deployment races.
- **Release/schema evolution:** coordinate client/Rules/indexes/contract/schema
  versions; stage compatible readers before new writers. Retire support only when
  retained data and clients permit. Roll back only to a build compatible with current
  data/policy; otherwise use a forward fix or separately approved recovery. Version
  independently evolving record families separately from concurrency counters.
  Explicit decoders and deliberately invoked, tested, transactional/idempotent,
  meaning-preserving upgrades retain semantics. Reads do not implicitly write;
  immutable events are not rewritten for schema modernization.
- **Identity:** stable authenticated-ID ownership and proof of both identities for
  linking. Verified matching email is a resolution hint, not merge authorization.
  No automatic duplicate-account/data merge; provisioning is retryable/idempotent.
- **Read state:** shared eligible metadata drives Search/Views/charts. Required
  metadata/labels load and validate before complete results; cached/partial results
  are not authoritative. Reconcile on reconnect and isolate state on account changes.
  Detail payloads remain on demand; completeness does not mandate refetch on every
  navigation or imply an atomic cross-collection snapshot.
- **Conflicts/writes:** offer Reload latest, Apply my changes where safe, or Cancel.
  Reapplication preserves unrelated edits and never supersedes integrity/consistency,
  current version checks or lifecycle/event invariants. Prevent accidental duplicate
  submissions; no offline queue. Lost acknowledgement means unknown outcome:
  reconcile before safe retry. Success requires cloud confirmation.
- **Quota/validation:** benchmark limits/optimizations in slices, including retained
  and Trash volume; no speculative cap. Provide useful failure/recovery behavior.
  Validate domain, adapters/Rules, browser flows and release compatibility separately.
  Diagnostics exclude Task content, credentials and tokens. Emulator results alone
  do not establish release readiness; live provider/index/quota evidence remains open.
- **Backup/recovery:** user-driven mechanics are deferred to **FUTURE**; PoC/beta
  can operate without them (§18.5). Write recovery and safe interrupted deletion remain required.

No exact production schema, independent-link model, deployment project/region, new
dependency, migration or implementation slice is selected by this consolidation.

## 23. Starter Tasks and documentation delivery (owner-agreed, 2026-10-22)

Account initialization provisions three ordinary user-owned Tasks demonstrating
different levels of Taskify usage:

| Task | Content |
|---|---|
| Learn usage | Full description with related Todo/checklist items and completion instructions |
| Explore settings | Medium description; no Todos |
| Find Documentation | Short description with relevant user-manual links |

Create them once, idempotently, with safe resumption of interrupted initialization.
They are ordinary editable Draft Tasks, unpaused, without imposed due dates, using
applicable defaults and normal View/count/lifecycle/delete/restore semantics.
Checklist items are manually completed; detailed instructions belong in the Task
description rather than extending Todo fields. Explain ordinary lifecycle effects.

Documentation is part of feature implementation. Update manual guidance and
provisioning templates as slices progress, teaching available features only and
using real links. Templates serve new provisioning; do not overwrite existing
user content/checklist progress, backfill automatically or recreate deleted examples.
Description URLs may precede independent external-link support; do not invent fake
Discussion entries to supply links.

The [agreed slice plan](implementation_plan.md) stages descriptions/manual pages,
then Todo checklists and dedicated links with their features. Early provisioning
does not depend on completing the whole app. Small feature-focused end-to-end
slices are the core delivery theme; broad rows split further during detailing.
Each applicable slice includes responsive behavior, integrity/compatibility,
recovery, tests, user guidance and template updates. See the plan for order and
dependencies, not a blanket authorization to implement, commit or deploy.
