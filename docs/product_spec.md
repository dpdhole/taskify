# Taskify Product Specification

> Authoritative product requirements and UX/product baseline. Load through `docs/project_status.md`.

## Current Product Baseline

**Status:** Approved

### Product Vision

Taskify is a mobile-first, lightweight task management application for individuals, with optional informal family collaboration for coordinating shared responsibilities and tasks.

### Product Principles and Boundaries

- Individual task management is the primary use case.
- Informal family collaboration is a secondary, additive capability.
- Family collaboration must not make personal task management unnecessarily complex.
- Taskify remains a lightweight task/workflow tool.
- Project management concepts and heavyweight workflow orchestration are out of scope.
- Core flows are mobile-first with desktop support.

### Participation Model

Taskify has one primary persona: the **Taskify User**. Collaboration is modeled through task-level participation roles rather than fixed family/team personas.

RACI concepts are used internally as the conceptual model, but the UI will use plain-language terminology. Current conceptual roles are:

- **Owner** — accountable for the task outcome.
- **Executor** — performs the task or a substantial part of it.
- **Consultant/Reviewer** — provides advice, review, approval, or domain input.
- **Informed** — has visibility but no execution responsibility.

Participants may be connected family members or external participants/consultants. An individual-owned task may still involve external consultation; family collaboration does not require the task owner to execute the work.

### Functional Requirements

**Status:** Approved

#### Identity & Access

- Register/login via social authentication or Firebase email-link authentication.
- Maintain a single user profile.
- User profile supports an optional `profile_picture_url`; it is populated only from supported social-login provider data in the current scope.
- Do not maintain family/member relationships at identity level.
- Task participation and access are established by assigning an email address to a task role.
- Personal tasks remain private unless another participant is explicitly added.
- Owner must be a registered Taskify user.
- Executor must be a registered Taskify user. If an unregistered email is assigned as Executor, account creation is required before execution actions are available.
- Consultant/Reviewer may remain external and use a secure task-specific link for limited review/comment actions.
- Informed participants may remain external with read-only secure-link access.
- External-participant communications include a Join Taskify CTA. If the invited email later registers, existing participation binds to that account.

#### Task Structure

Each task supports:

- Short title/objective.
- Detailed markdown description.
- Category.
- Priority.
- Start date with optional time.
- Due date with optional time.
- End date with optional time.
- Optional reminder(s), each represented by a date/time.
- Optional recurrence.
- Optional attachments/links.
- Optional participants.
- Optional structured location.

Taskify currently supports two task types: **Task** and **Event**. **Task** represents actionable work; **Event** represents a scheduled occurrence. The type model is intentionally extensible for a future **Todo** type, but Todo semantics are deferred and are not part of the current product scope.

For **Task**, Start, Due, and End retain task-work semantics: Start represents when work begins/becomes relevant, Due represents the commitment/deadline, and End represents expected/actual conclusion. For **Event**, Start and End define the scheduled period and Due is not applicable.

Task status is internal system state. User actions and task conditions imply state changes rather than exposing a generic editable status field.

A subtask is a normal `Task` entity with a parent relationship. It is independently browsable and participates throughout the product like any other task, including Home, Tasks, Search, Calendar, Nearby, lifecycle, permissions, preferences, reminders, attachments, conversations, and business actions. Parent Task Detail retains a Subtasks section for hierarchy/progress context. Initial product behavior remains limited to one subtask level.

#### Task Organization

- Preset categories suitable for individual/family use.
- At account registration, provision Family, Finance, Friends, Growth, Hobbies, Household, Leisure, Partner, Self, Social, Spirituality, Wellness and Work in alphabetical order (DEC-075).
- Default Category names/archive state are fixed, but their order may be changed. Custom Categories remain editable and are initially appended after the last Category. Category names support Unicode, are trimmed/NFC-normalized, and have a 15-character maximum; duplicate matching ignores case.
- Users may edit categories under their approved mutation permissions. Category Reset restores alphabetical order across all owned Categories, including custom and archived entries; it preserves archive state and does not restore names or recreate default Categories (DEC-074).
- Taskify registration completes after authenticated `completeRegistration({})` succeeds; Firebase Auth account creation alone can leave initialization pending/retryable (DEC-078). The 15-character name limit counts grapheme clusters; alphabetical reset uses deterministic normalized-name Unicode code-point ordering (DEC-079).
- Categories remain lightweight and do not become projects.
- Tasks can be filtered/sorted by relevant attributes including category, lifecycle state, priority, dates, participation role, and location.

#### User Task Preferences / System Tags

- Category remains a single primary classification and part of the task definition.
- Priority remains part of the task definition and represents the Owner's overall priority for the task.
- Day-of-week (DOW), time-of-day (TOD), Important, and Urgent are system-defined tags managed by each user as part of that user's relationship to the task.
- TOD system tags include at least Early Morning, Midmorning, Afternoon, Evening, and Night.
- DOW/TOD/Important/Urgent are not task-definition fields and may differ by participant.
- System-tag view modifiers are preference-aware: absence of a relevant system tag does not exclude a task; a conflicting assigned tag may exclude it while the modifier is active.
- DOW and TOD are dynamic view modifiers evaluated against the system clock at runtime. They are not stored as fixed filters in a saved view definition.
- Important/Urgent use the same per-user system-tag model and may be applied as dynamic view modifiers.
- Participation roles are not system tags; they are Owner-managed task participation relationships.
- Nearby is not a system tag and not a saved view. It is an ephemeral location-context query answering whether tasks are relevant to the user's current or selected location.

#### Participation & Collaboration

Per task or subtask:

- Exactly one Owner.
- Exactly one Executor; defaults to Owner when unspecified.
- Zero or more Consultants/Reviewers.
- Zero or more Informed participants.

UI terminology remains plain-language rather than literal RACI labels.

#### Delegation

- Owner may delegate execution without transferring ownership.
- Executor may act on the task according to permissions.
- Owner retains accountability.
- A user may participate in tasks owned by another person.
- The UI should distinguish tasks the user owns, tasks assigned to the user, tasks where the user advises/reviews, and tasks the user follows.

#### Progress / Lifecycle Taxonomy

Lifecycle macro states and current micro-state taxonomy are:

- **Upcoming** — Draft, Planned, Ready.
- **Active** — In Progress, Waiting, Blocked, On Hold, Review.
- **Completed** — Done, Cancelled, Unable to Complete.

Attention conditions such as Overdue, Due Soon, Review Pending, prolonged blockage, and parent/subtask inconsistencies are overlays/flags rather than lifecycle states.

Parent/subtask lifecycle is not strictly enforced. Taskify may warn, highlight, or suggest status implications, while the Owner decides the parent task outcome. Detailed micro-state transition rules are explicitly deferred to the Task Lifecycle design step.

#### Comments, Activity & History

- Comments and system activity form one unified task timeline.
- Entries maintain metadata including author, timestamp, entry type, related task/subtask, and optional structured system-change data.
- Replies to comments form conversation threads anchored by the top-level comment; its subject acts as the thread topic.
- Material task changes are written as structured system entries under a default thread such as **System Changes** rather than maintained as a separate history feature.

#### Notifications & Reminders

Support notifications for personal reminders, assignment/delegation, relevant task changes, upcoming/overdue tasks, and review/consultation requests. Notification preferences are user-configurable.

#### Search & Retrieval

- Search task title and description.
- Find active and completed tasks.
- Filter by ownership/participation role, category, lifecycle state, priority, dates, and location.
- Provide a Nearby Tasks feature/filter.

#### Location

- Optional structured task/subtask location integrated with Google Maps / Places.
- Location may contain place ID, display name, formatted address, latitude/longitude, and optional user-friendly label.
- Support place search/autocomplete and opening the location in Google Maps/navigation.
- Nearby Tasks uses the current or selected location.
- One primary location per task/subtask.
- Geofencing/location-triggered automation is not part of the current approved requirement.

#### Recurrence

- Support daily, weekly including selected weekdays, monthly, yearly, and custom intervals.
- Optional recurrence end: never, on date, or after N occurrences.
- Each occurrence is an independent task instance with its own progress, comments/activity, participants, and dates.
- Editing supports at least **This occurrence** and **This and future occurrences**.
- Past occurrences remain unchanged.
- An overdue occurrence does not block creation of the next occurrence.

#### Attachments

- Tasks, subtasks, and conversation threads may contain files, images, and external links.
- Task-level attachments belong to the task context; thread attachments belong to the specific conversation entry.
- Attachment metadata includes uploader, timestamp, filename/type, and storage reference.
- Access follows the containing task/thread permissions.
- No document editing or version-control capability is required; replacement can be represented as a new attachment/activity entry.

### Task Lifecycle

**Status:** Approved

Lifecycle state is system-managed and derived from business actions and task conditions rather than direct editing of a generic status field. Each task/subtask has exactly one current `Macro:Micro` lifecycle state.

#### States

- **Upcoming** — Draft, Planned, Ready.
- **Active** — In Progress, Waiting, Blocked, On Hold, Review.
- **Completed** — Done, Cancelled, Unable to Complete.

Attention conditions such as Overdue, Due Soon, Review Pending, prolonged blockage, and parent/subtask inconsistencies remain orthogonal overlays rather than lifecycle states.

#### Core Transition Semantics

- Users perform business actions; they do not directly edit status.
- `Upcoming:Planned` may automatically become `Upcoming:Ready` when its start date/time arrives.
- Dates do not imply completion; due/end dates may generate attention indicators only.
- `Active:Waiting` means progress depends on expected external input/event.
- `Active:Blocked` means a specific obstacle requires resolution/intervention.
- `Active:On Hold` means the task is intentionally paused.
- `Active:Review` is conditional rather than universal.
- Completion is explicit.
- Reopening a completed task preserves prior history and returns it to an appropriate active state.
- Parent/subtask state changes do not force one another; Taskify may warn or highlight inconsistencies.

#### Role Constraints

- Owner controls planning/intent-level transitions such as planning, rescheduling, on-hold, cancellation, reopening, and final owner-level decisions.
- Executor controls execution-progress actions such as start, waiting, blocked, resume, and submit for review.
- Consultant/Reviewer may approve or reject a task in `Active:Review` when assigned that role. Approval moves the task to `Completed:Done`; rejection returns it to `Active:In Progress`.
- Informed participants cannot trigger lifecycle transitions.
- Executor must be a registered Taskify user before execution-state actions are available.
- Owner and Executor may be the same person; this is the default.

#### System Changes History

Every lifecycle transition creates a structured entry in the **System Changes** activity thread containing at least actor, timestamp, previous state, new state, action, and relevant metadata. Where a transition requires or accepts a reason, that reason is stored in the same System Changes entry rather than as a separate lifecycle field.

Reasons are required for Mark Blocked, Put On Hold, Cancel Task, Mark Unable, and Review rejection/request rework. Reasons are optional for Reopen Task, Wait for Input, and Submit for Review.

Completed-task history is not rewritten when a task is reopened or otherwise changed later.

#### Explicit Non-Requirements

- Projects.
- Project-management Kanban boards.
- Sprints.
- Resource planning.
- Timesheets.
- Budgets.
- Gantt charts.
- Complex task dependencies.
- Custom workflow designers.
- Organization/team administration.
- Enterprise RBAC.

### Information Architecture

**Status:** Approved

#### Primary Navigation

Taskify uses the following primary navigation areas:

- **Home** — contextual overview of what needs attention now.
- **Tasks** — primary task workspace using product-defined preset views with per-view customization.
- **Nearby** — ephemeral location-context query answering "what can I do here now?".
- **Calendar** — date-oriented projection of tasks/events.
- **Search** — free-text retrieval across accessible tasks. Richer filtering may refine results, but a standalone View Builder is no longer an approved baseline requirement.
- **Settings** — profile, categories, notifications, defaults, and integrations.

`My Tasks` and `Shared With Me` are not separate top-level information spaces; their semantics are expressed through preset views and filters in **Tasks**.

#### Tasks and Preset Views

- Taskify does **not** provide user-created Saved Views or a standalone View Builder.
- Product-defined preset views have a fixed product-controlled order; users do not reorder presets.
- Each preset is implemented as an application-defined, client-parameterized query strategy rather than a persisted saved-query document.
- Presets may be tuned independently; they are not required to share one generic query-definition DSL.
- Each view supports contextual customization using dimensions meaningful for that view. Current core dimensions are Time, Category, and Status; the selected primary organization controls grouping while the other applicable dimensions remain filters.
- Temporary working filters may refine fields such as Category, Priority, lifecycle/status, and later participation role/person. Category and Status support multi-select where applicable. Location remains a runtime working-context modifier.
- DOW, TOD, Important, and Urgent remain runtime system-tag modifiers applied after the preset candidate set is resolved.
- DOW/TOD modifiers are evaluated against the system clock in the user's stored timezone.
- All system-tag view modifiers are preference-aware: absence of the relevant system tag does not exclude a task; a conflicting assigned tag may exclude it while the modifier is active.
- Per-view customization is persisted only through explicit **Remember**; otherwise changes remain temporary client state.
- Visual/layout treatment must distinguish product defaults, remembered customization, and temporary modifications so the user can tell what will persist.

#### Nearby

- Nearby is not a saved view and has no system tag.
- It is an ephemeral context query using the user's current or selected location against task locations.
- Its product intent is **"What can I do while I'm in this area?"** It is map-first, using pins for relevant task/event locations rather than presenting a generic task list on a map.

#### Search

- General Search provides free-text retrieval across accessible tasks.
- General Search covers at least title, description, human comments/conversations, attachment metadata, participant names/emails, and participation-role labels. Routine `System Changes` audit entries are excluded from general free-text search.
- Search may be refined with the same supported temporary filters used in Tasks.
- There is no separate Advanced Search / View Builder workflow in the approved baseline; Search may be refined with supported filters.
- Role/participation criteria are first-class search fields, including My Role, Owner, Executor, Consultant/Reviewer, Informed, and participant name/email.

#### Home

Home is a curated operational overview rather than merely another saved view. Its primary interaction is the approved per-user Eisenhower matrix defined in UX Navigation.

#### Calendar

Calendar is a date-oriented projection of the shared task model. **Task** and **Event** are types of the same underlying entity rather than separate entity models. Calendar presents Events as scheduled Start→End periods and Tasks as a selectable Start/Due/End projection.

#### Task Detail Information Hierarchy

A task detail view contains, as applicable:

- core task summary/details,
- dates and recurrence,
- category and priority,
- location,
- participants and roles,
- lifecycle actions,
- current user's system-tag preferences,
- attachments,
- subtasks,
- unified activity/conversation threads, including **System Changes**.

Subtasks use the same Task Detail experience and are independently browsable. When a task has a parent, Task Detail shows parent context/navigation; parent Task Detail also retains a Subtasks section for hierarchy/progress context.

### UX Navigation

**Status:** Approved

#### Navigation Model

- Taskify uses a **Gmail-inspired responsive navigation model** as an interaction reference, without copying Gmail's UI literally.
- Desktop/wider screens use a persistent/collapsible sidebar. Mobile uses the same hierarchy in a navigation drawer.
- The sidebar/drawer exposes **Home, Tasks, Nearby, Calendar**, with the fixed preset-view hierarchy available under Tasks. **Settings** is visually separated as configuration.
- **Search is global** from the application header rather than primarily a peer destination in the mobile navigation hierarchy. Search results occupy the main workspace.
- A prominent global **Create** action remains independent of navigation.
- Tasks remains the canonical place for preset views and their contextual customization.
- Navigation back from Task Detail should restore the originating workspace context (view, filters/modifiers, calendar position, map area, or search results as applicable).
- Task Detail and major workspaces use stable/deep-linkable routes; navigation history and canonical resource URLs are separate concerns.
- Persistent preferences and temporary session UI state must be distinguished explicitly rather than persisting arbitrary frontend state.

#### Home — Eisenhower Matrix

- Home's mental model is **"find things to do"**.
- Home is organized around a four-quadrant Eisenhower matrix using the current user's per-task Important/Urgent preferences.
- The quadrants are Important + Urgent, Important + Not Urgent, Not Important + Urgent, and Not Important + Not Urgent.
- **Unclassified** means neither Important nor Urgent has been assigned and is displayed separately, not as a fifth quadrant.
- Users may move tasks between quadrants and to/from Unclassified; this updates only the current user's Important/Urgent preferences.
- Home supports Category, lifecycle Status, Role, and Location working-context controls. Role includes **Any** and defaults from user Settings/Preference.
- DOW and TOD are always explicit toggles and are never automatically activated.
- Overdue receives strongest emphasis. **Due Next** means due within the next 3 calendar days, excluding overdue, and receives secondary emphasis.
- On small screens, Home presents a recognizable 2×2 matrix summary. Each quadrant shows **Overdue | Due Next | Total** counts and drills down to its matching list. Unclassified appears below with the same summary model.

#### Tasks Workspace

- Tasks' mental model is **"I know what I want to work with"**.
- A compact current-view selector is used instead of horizontal tabs. **My Views** precede **Preset Views**, followed by New View / Manage Views actions.
- The last-used view is remembered; first-time/default fallback is **All Active Tasks**.
- Small screens use compact rows showing approximately the first 5–8 words of title, truncated as needed. Wider screens progressively expose full title and useful key columns.
- A view's grouping clause renders as collapsible sections with group label and matching count. Collapse/expanded state is per-user/per-view UI state, not part of the saved query definition.
- Direct row interactions include DOW, TOD, Important, Urgent, Reminder, Snooze, and only lifecycle business actions valid for both current state/conditions and current user permissions. Invalid/unauthorized actions are absent rather than disabled. Compact mobile uses overflow/row actions where necessary.
- DOW, TOD, Important, and Urgent remain explicit runtime modifiers above the list.
- Tasks includes a temporary **title-only Quick Search within the current view**. It combines with the current view and runtime modifiers, preserves grouping, updates counts, hides empty groups, clears when switching views, and is not persisted into the saved view.

#### View Builder

- View Builder is a constrained wizard rather than an arbitrary Boolean expression builder.
- **Context:** My Role/participation, Category, Lifecycle state, Participants. Location and Recurrence are excluded.
- **Priority & Time:** Priority plus relative date filters independently applicable to Start, Due, and End. Supported date conditions are **Past, Past N days, Today, Next N days, Future**, with at most one condition per date field.
- **Organize:** Group by none/one field plus Sort field/direction on one screen.
- Multiple selected values within the same field use **OR**; different fields combine with **AND**.
- Grouping may use Category, lifecycle state, Priority, My Role, Owner, Executor, Start date bucket, Due date bucket, or End date bucket. Exact date-bucket definitions remain a detailed UX decision.
- Sorting may use Title, Priority, lifecycle state, Start, Due, End, Created, or Updated. Lifecycle sorting uses centrally defined business rank, not label/alphabetical order. Current canonical order is Draft → Planned → Ready → Blocked → In Progress → Review → Waiting → On Hold → Done → Unable to Complete → Cancelled; descending reverses it. Attention overlays do not alter lifecycle sort.
- **Run** executes ad hoc. **Save & Run** persists a My View. Ad-hoc results expose Save View.
- **Edit Filters** opens the same wizard prepopulated. Keeping the name confirms update/overwrite; changing the name creates a new My View and leaves the original unchanged.
- **Copy View** opens the same wizard prepopulated, with an empty name field whose placeholder is `New View`; Save remains disabled until a non-empty trimmed name is entered. Copy always creates a new My View and applies to both My Views and Preset Views.
- View names support full UTF-8/Unicode including emoji; emoji is part of the name and there is no separate icon field.

#### Location Working Context

- Saved locations are managed in **Settings**, similarly to Categories. The simplest workflow is **Save Current Location as a name**; users may also search/select a place and save it under a name.
- Saved locations retain structured place information underneath the user-facing name and may be renamed or removed.
- Location is a runtime working-context modifier, not a persisted View Builder query field. Options include **All**, **Use Current**, and saved named locations.
- Location matching uses **coarse proximity**, not exact place-ID equality and not geofencing. Exact distance bands/resolution/query implementation are deferred to Firebase Architecture.

#### Task Detail

- Task Detail section order is: **Header / Actions → Core Details → Activity / Conversations → Attachments → My Preferences → Subtasks → People**.
- Header shows title, lifecycle/attention state, and only role/state-valid business actions, with secondary actions in overflow.
- Core Details contains markdown description, Category, Priority, Start/Due/End as applicable, recurrence, and location, editable according to permissions.
- Activity/Conversations initially shows **thread headings**, not the full stream. Each heading shows subject, last message/activity preview, count, and recency. Normal threads are sorted most-recently-active first. **System Changes is always pinned at the bottom** regardless of recency. Selecting a heading drills into the thread.
- Attachments on Task Detail shows **task-level attachments only**. Thread-level attachments remain in their conversation/thread. External links are supported alongside file upload with URL plus optional user-editable display title and a compact domain/site indicator where practical.
- My Preferences provides inline DOW/TOD/Important/Urgent editing plus focused controls for multiple Reminders and Snooze/`hidden_until`. These are explicitly personal/current-user settings.
- Subtask Detail is the same Task Detail screen. A task with a parent shows parent context/navigation; a parent retains a Subtasks section for hierarchy/progress context.
- People uses email-style comma-separated chips/bubbles displaying **email only**. Selecting a registered user's chip may show user details; unregistered/external participants have email/participation context only.
- Final user-facing participation labels are **Owner**, **Assigned To** (Executor), **Helpers** (Consultant/Reviewer), and **Following** (Informed).

#### Task and Event Types

- Current supported types are **Task** and **Event**. Task means **actionable work**; Event means **scheduled occurrence**.
- A future **Todo** type is anticipated for quick/straightforward items, but its fields, lifecycle, and date semantics are explicitly deferred.
- Task/Event share the same underlying entity model; Type is a behavioral/UX discriminator rather than a separate entity family.
- Event uses a reduced lifecycle: **Draft → Scheduled → Completed**, with **Cancelled** as a terminal alternative. Passing End time does not automatically complete an Event; a past scheduled Event may receive a temporal/attention indicator while lifecycle remains action-driven.
- Task uses Start, Due, and End task-work semantics. Event requires scheduled Start and End; Due is not applicable.

#### Calendar

- Calendar's mental model is **"what happens or needs attention when?"**
- Calendar uses explicit content layers: **Events** on/off and **Tasks** on/off.
- When Tasks are enabled, **Tasks by: Start | Due | End** controls only Task placement and the last selection is remembered.
- Events always render according to their scheduled **Start → End** duration and are not distorted by the Task projection selector.
- Task and Event representations are visually distinguishable using both **icon and color/treatment**; color is never the sole discriminator. Task items also make clear whether placement represents Start, Due, or End so users need not infer meaning only from filter values.
- Mobile primarily uses **Agenda** with compact date navigation. Wider screens support **Month / Week / Agenda**. Day view is not currently required.
- Calendar filters include **Category, Role, and Location**. DOW/TOD/Important/Urgent are not Calendar modifiers. Separate Type filtering is unnecessary because the Event/Task layers provide that control.
- Selecting a calendar item expands a compact **date summary + Task/Event overview** in Calendar rather than navigating immediately. The summary exposes relevant dates/time, type, lifecycle/attention, useful category/priority context, and an explicit **Open Task / Open Event** action to Task Detail.
- Selecting a date exposes that date's chronological item summary; item selection then expands the overview.
- Recurring occurrences appear independently and open the specific occurrence. Recurrence-series editing semantics remain owned by recurrence UX rather than Calendar.

#### Nearby

- Nearby's mental model is **"What can I do while I'm here/in this area?"**, including the location-centric use case **"Do this when you are in that neighbourhood."**
- Nearby is a **map-first view with pins** centered on current or selected location.
- Task and Event pins use distinct icon + color/treatment consistent with Calendar. Multiple items at effectively the same location are grouped under one location pin; broader zoom levels may use geographic clustering.
- Selecting a pin opens a compact summary/overview similar to Calendar, emphasizing what to do and where, with approximate distance/proximity secondary and an explicit **Open Task / Open Event** action.
- Map movement uses an explicit **Search this area** action rather than continuously changing results during panning. Current and saved locations may provide quick recenter actions.
- Nearby uses coarse proximity and does not imply precise geofence behavior. It remains user-invoked; proactive location-triggered notifications are not part of the current requirement.
- Nearby remains intentionally focused rather than becoming the full Tasks/View Builder experience.

#### Search

- Search's mental model is **"find something I remember about a task/event"**.
- Global Search is immediately accessible from the application header and searches all accessible Tasks/Events.
- Results are relevance-ranked rather than grouped like Tasks. Title matches should receive strong weighting.
- Results expose title, Task/Event visual identifier, lifecycle/attention, relevant date, Category, a short matching excerpt where useful, and the source of a non-obvious match (for example Description, Activity, Attachment, Participant).
- Selecting a Search result opens Task Detail directly; the result itself serves as the intermediate summary.
- Search should be case-insensitive and support partial-word/prefix matching where technically reasonable. Typo tolerance, fuzzy matching, semantic/vector search, stemming, and sophisticated ranking are deferred to search/Firebase architecture decisions.
- Routine System Changes audit content is excluded from general free-text search; human comments/conversations remain searchable.
- **Advanced Search** launches View Builder. Current free-text search text is not automatically inserted into the View Builder definition.

#### Settings

- Settings contains configuration/defaults rather than routine task operations.
- **Account & Identity:** profile/account/authentication controls and sign-out.
- **Task Configuration:** Categories and Saved Locations.
- **Defaults & Preferences:** cross-session defaults explicitly defined by the product, including the default Home Role filter.
- Full My Views management remains in Tasks rather than being duplicated in Settings.
- Global notification/reminder configuration is deferred until notification delivery channels/preferences are defined.

#### Creation UX

- Taskify uses one prominent global **Create** action with a prominent type selector at the top of the creation surface.
- Current selector is **Task | Event**, with Task selected by default for global creation. The model is designed to scale later to **Todo | Task | Event** without separate entity-specific creation systems.
- The creation form adapts to Type. Task emphasizes actionable-work fields. Event emphasizes Title, Start/End date/time, Location, Description, Recurrence, and People; Category/Priority remain available but secondary.
- Event creation uses business actions such as **Save Draft** and **Schedule**, not a generic lifecycle selector.
- Contextual creation may prepopulate visible/editable values (for example Calendar date/time, Nearby location, or a Tasks-view Category). Contextual Calendar creation may default Type to Event. The global Create action remains Task-default even while the user happens to be viewing Calendar.
- Type may be switched during creation. **Type is immutable after creation for the current scope**; post-creation Task↔Event conversion is deferred because it requires explicit lifecycle/date/recurrence migration semantics.
- After successful creation, Taskify opens the newly created Task/Event Detail rather than assuming the originating view will contain it.

#### Unsaved Work

- Navigation must not casually destroy meaningful unsaved work. Exact autosave-versus-warning behavior is deferred to detailed interaction design and must be defined consistently rather than independently per screen.

### Deferred Idea — Related Tasks

**Status:** Deferred / Not in current scope

A lightweight task-to-task reference concept was discussed under labels such as **See Also** and **Related Tasks**. The intended semantics were purely navigational/contextual: no lifecycle propagation, no dependency semantics, no ownership inheritance, no automatic completion behavior, and no implied ordering.

The idea is intentionally deferred because it could be misused to model project-management-style dependencies or work breakdown structures, which conflicts with Taskify's approved lightweight product boundary. Reconsider only if a clear non-project-management user need emerges.

## MVP Scope

**Status:** Approved

MVP scope is defined around coherent end-to-end user workflows, with individual task management prioritized before family/friends collaboration. MVP product scope is distinct from implementation sequencing.

### MVP Required

- Authentication/profile.
- Create/manage Task.
- Task lifecycle/business actions.
- Categories, priority, and dates.
- Subtasks.
- Home / Eisenhower matrix.
- Tasks workspace.
- Preset Views.
- Per-user DOW/TOD/Important/Urgent preferences.
- Reminders.
- Hide until / `hidden_until`.
- Basic Search, initially focused on title/description retrieval.
- System Changes activity.
- Archive/delete/restore behavior needed for a coherent lifecycle.

### MVP Reduced

- Event type.
- Calendar.
- Recurrence.
- Richer view refinement beyond the core preset customization/filtering baseline, if later justified.
- Advanced Search beyond normal Search + supported temporary filters.
- Structured location.
- Nearby.
- External-link attachments.
- Registered-user collaboration.
- Human comments/conversations.

Reduced MVP capabilities retain the approved underlying product/data semantics and must not be implemented using incompatible shortcuts that would require redesign when expanded.

### Post-MVP

- Binary file/image uploads.
- External secure-link participation.
- Richer versions of capabilities intentionally reduced for MVP.

### Approved Implementation Sequencing

Implementation sequencing is frozen separately from MVP product classification:

1. **Milestone 1 — Core Individual Tasking**
   - Authentication/profile.
   - Task CRUD and core fields.
   - Lifecycle/business actions.
   - Categories.
   - Subtasks.
   - System Changes.
   - Archive/delete/restore.

2. **Milestone 2 — Personal Productivity**
   - Home / Eisenhower matrix.
   - Tasks workspace + preset views.
   - DOW/TOD/Important/Urgent.
   - Reminders.
   - Hide until.
   - Basic Search.
   - External-link attachments.

3. **Milestone 3 — View Refinement**
   - Expand contextual preset customization and Tasks/Search filters where justified.
   - Refine per-view Remember/Reset behavior, presentation options, and client-side sorting.
   - No user-created Saved Views or standalone View Builder.

4. **Milestone 4 — Location**
   - Structured task/event location.
   - Saved locations.
   - Google Maps/Places integration required for location workflows.
   - Nearby.

5. **Milestone 5 — Events & Time**
   - Event type.
   - Calendar.
   - Recurrence.

6. **Milestone 6 — Registered Collaboration**
   - Assigned To.
   - Helpers / Following.
   - Permission enforcement.
   - Shared-task retrieval.
   - Conversations/comments.
   - Collaboration notifications.

7. **Post-MVP**
   - File/image uploads.
   - External secure-link participation.
   - Richer versions of intentionally reduced MVP capabilities.
