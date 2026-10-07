# Taskify IT — Project Status

## Purpose

This file is the single authoritative record of Taskify IT project state.

Chat history is not authoritative unless a decision or change is explicitly approved and recorded here.

## State Model

Use the following states consistently:

- **Discussion** — Being explored; not authoritative.
- **Proposal** — Concrete option awaiting approval.
- **Approved** — Explicitly accepted and part of the project baseline.
- **Implemented** — Built, but not necessarily verified.
- **Verified** — Tested or validated against the approved specification.
- **Superseded** — Previously approved but replaced by a later decision.

Material state transitions require explicit project-owner approval.

## Project Governance

**Status:** Approved

- The project owner is the sole decision-maker, developer, and operator.
- ChatGPT acts as technical product partner, architect, and development assistant.
- No material assumptions should be made when missing information affects a decision.
- No project action should be taken without explicit approval.
- Facts, requirements, proposals, assumptions, decisions, and implemented state must remain distinct.
- Approved decisions remain the project baseline until explicitly changed.
- Responses should be brief, precise, and actionable by default.
- Unnecessary internal reasoning or step-by-step thinking should not be exposed unless explicitly requested.
- New scope, technologies, dependencies, or processes must be identified as proposals before adoption.

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
- Users may edit categories and restore category defaults.
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
- Direct client-editable after creation: `title`, `description_md`, `category_id`, `priority`, `start`, `due`, `end`, scalar date projections, and `updated_at`, subject to Security Rules validation.
- Backend-controlled: `lifecycle`, `availability`, hierarchy fields, archive/delete/recovery/completion timestamps, and any automatic Start/End changes caused by lifecycle actions.
- Identity/participation fields are immutable in Milestones 1–3 after creation; collaboration-era mutation semantics are deferred.
- `type` and `created_at` are immutable.

**Physical deletion**
- Ordinary clients may never physically delete a Task document.
- Permanent purge is a trusted backend/operations process after `purge_after`, with dependent-data cleanup defined by the approved soft-delete model.

**Validation policy**
- Security Rules validate type, allowed-field changes, ownership, enum/domain values, lifecycle creation state, nullability, category ownership, and any date synchronization constraints practical to enforce safely.
- Backend handlers revalidate all invariants material to trusted actions.
- If exact rich TaskDate ↔ scalar projection validation is too complex or brittle in Rules, date writes move behind a trusted backend mutation rather than allowing inconsistent direct writes.
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
- Client create/update may edit `name`, `normalized_name`, `display_order`, and archive state only where the Security Rules and operation semantics can enforce consistency safely.
- `owner_email`, `created_at`, and default provenance semantics are protected.
- If normalized-name uniqueness or reset/reactivation semantics cannot be enforced robustly through direct client writes, those mutations move behind trusted backend operations rather than weakening the invariant.
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
- Collection group `preferences`: collection-group-scoped index on `user_email` — per-user preference enrichment.

Index policy:
- Create indexes for preset-defining retrieval, not for every Category/Status/Priority/custom-sort combination.
- Final view grouping and user-selected sort remain client-side over the bounded candidate set.
- Validate the exact generated index set with emulator/integration tests and Firestore Query Explain before treating index ordering as operationally final; remove redundant indexes where an existing compatible index serves the query.
- Pagination/page-size policy is deferred until measured candidate-set behavior warrants it; view-level date/staleness bounds are the primary Milestone 1–3 read-control mechanism.

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
- Ordinary client creation is allowed only for a root Task owned by the authenticated user.
- Required create invariants:
  - `type == "task"`.
  - `owner_email == executor_email == created_by_email == me`.
  - `consultant_emails == []` and `informed_emails == []` for the Milestone 1–3 individual flow.
  - `parent_task_id == null` and `root_task_id == null` for direct root creation.
  - `lifecycle.macro == "upcoming"` and `lifecycle.micro == "planned"`.
  - `availability == "working"`.
  - `archived_at == null`, `deleted_at == null`, `purge_after == null`, and `completed_at == null`.
  - referenced `category_id` belongs to the current user and is valid for assignment.
  - scalar query dates and richer TaskDate values satisfy the approved synchronization/validation contract.
- Subtask creation is not a direct client document create; it uses the trusted `createSubtask` business action so hierarchy/depth/permission invariants are atomic.

**Ordinary Task update**
- Direct client updates are allowed only on an owned, non-deleted Task and only for approved ordinary fields.
- Owner-editable ordinary fields for Milestones 1–3 are:
  - `title`
  - `description_md`
  - `category_id`
  - `priority`
  - `start`, `due`, `end`
  - `start_date`, `due_date`, `end_date`
  - `updated_at`
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
- Date edits must preserve the approved rich-date/scalar-date synchronization invariant. If Security Rules cannot robustly validate the exact synchronization without excessive complexity, date mutation must move behind a trusted backend action rather than weakening the invariant.
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
- Promotion must be idempotent and re-check current lifecycle/start conditions before mutation.
- Each successful automatic promotion updates the Task and writes the corresponding System Changes entry atomically.
- Exact scheduler/queue implementation and polling cadence remain an implementation choice; semantics are fixed.

**Direct client writes remain outside callables**
- Root Task creation, approved ordinary Task edits, category management, per-user system-tag preferences, and remembered view preferences remain direct Firestore client operations protected by Security Rules, unless the date-synchronization fallback requires date edits to move behind backend validation.
- Business-action callables must not become a generic Task-update endpoint.

**Stable backend error codes**
- `UNAUTHENTICATED`
- `TASK_NOT_FOUND`
- `NOT_AUTHORIZED`
- `INVALID_ARGUMENT`
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
- A user may create/update/delete only their own preference document and only when the parent Task is readable.
- Collection-group reads require `user_email == me`.

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
- Collection-group reads require `user_email == me`.

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

#### Activity and Threads

- Activity/conversation data is stored under the containing Task: `/tasks/{taskId}/threads/{threadId}/entries/{entryId}`.
- An activity thread contains subject, thread type, creator, and timestamps; task containment is established by the Firestore path.
- Activity entries contain actor email, timestamp, entry type, content, and structured system-change payload where applicable.
- Every task has a default `System Changes` thread.
- Structured system-change data is canonical; human-readable rendering is derived from it.
- Firestore Security Rules v2 is used from the outset so later collection-group queries remain available.

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

## Approved Decisions

| ID | Date | Area | Decision | Supersedes |
|---|---|---|---|---|
| DEC-001 | 2026-10-05 | Governance | Taskify IT is a single-person project. The project owner retains explicit approval authority over all material decisions and actions. | — |
| DEC-002 | 2026-10-05 | Project State | Project state will be maintained in one unified authoritative file named `project_status.md`. | — |
| DEC-003 | 2026-10-05 | Product Vision | Taskify is individual-first, with secondary informal family collaboration, and remains a lightweight task/workflow tool with project management explicitly out of scope. | — |
| DEC-004 | 2026-10-05 | Personas / Participation | Taskify uses one primary user persona. Collaboration is represented with task-level RACI-inspired roles, supports family and external participants, and uses layman-friendly UI terminology rather than literal RACI labels. | — |
| DEC-005 | 2026-10-06 | Functional Requirements | Approved the functional requirements covering identity/access, task structure, task-scoped participation, delegation, lifecycle taxonomy, unified activity/history, notifications, search/location, recurrence, attachments, and explicit non-requirements. Detailed micro-state transition rules are deferred to Task Lifecycle. | — |
| DEC-006 | 2026-10-06 | Task Lifecycle | Approved the macro/micro lifecycle model, transition constraints, role-based action authority, consultant/reviewer approval/rejection during review, and System Changes capture of transition reasons/history. | — |
| DEC-007 | 2026-10-06 | Task Preferences / System Tags | Approved per-user system tags for DOW, TOD, Important, and Urgent; retained Category and Priority as task-definition fields; roles remain Owner-managed relationships; Nearby remains an ephemeral location query. | — |
| DEC-008 | 2026-10-06 | Information Architecture | Approved primary navigation, Tasks saved-view model, runtime system-tag modifiers, ephemeral Nearby behavior, Search/Advanced Search behavior, role search fields, and task-detail hierarchy. | — |
| DEC-009 | 2026-10-06 | Data Model | Approved the logical data model: email-based domain identity; self-referencing Task hierarchy with initial one-level product constraint; direct Owner/Executor/creator fields; Consultant/Reviewer and Informed email arrays; Owner-controlled category; separate top-level user-owned User↔Task preference/state/reminder documents; recurrence linkage; activity/thread collections; object-storage-backed attachments; external secure access; and archive/soft-delete/purge semantics. | — |
| DEC-010 | 2026-10-06 | Permission Model | Approved task-scoped role permissions, trusted Owner/Executor editing, read-only Informed access with attachment download, feedback-only Consultant/Reviewer access, secure-link external review permissions, Owner-only delegation/governance controls, and one-way parent-to-subtask visibility. | — |
| DEC-011 | 2026-10-06 | UX Navigation | Approved the consolidated UX Navigation model covering Home, Tasks, View Builder, Task Detail, Calendar, Nearby, Search, Settings, creation, responsive Gmail-inspired navigation, and deep-navigation behavior. | — |
| DEC-012 | 2026-10-06 | Task Hierarchy | Subtasks are normal Tasks with a parent relationship and are independently browsable throughout the product; parent/subtask context remains visible in Task Detail. | DEC-005/DEC-008 restrictions that subtasks were parent-context-only/non-independent |
| DEC-013 | 2026-10-06 | Task Type | Introduced extensible Task Type with current values Task (actionable work) and Event (scheduled occurrence). Todo is anticipated for future quick/straightforward items but remains deferred. | DEC-005 event date semantics |
| DEC-014 | 2026-10-06 | Calendar | Calendar uses explicit Event and Task layers. Events render Start→End; Tasks are projected by remembered Tasks-by Start/Due/End selection, with distinct visual representation and in-calendar summary before Task Detail. | Earlier generic Calendar projection |
| DEC-015 | 2026-10-06 | Event Lifecycle | Events use Draft → Scheduled → Completed, with Cancelled as terminal alternative. Passing End time does not auto-complete an Event. | — |
| DEC-016 | 2026-10-06 | Navigation | Adopted Gmail-inspired responsive navigation: desktop sidebar/mobile drawer, global Search, prominent Create, and bounded My View shortcuts under Tasks. | Earlier six-peer primary-navigation presentation |
| DEC-017 | 2026-10-06 | MVP Scope | Approved individual-first MVP classification: core individual tasking is MVP Required; Events/Calendar/recurrence, Saved Views/View Builder, location/Nearby, external-link attachments, registered-user collaboration, and human conversations are MVP Reduced; binary file/image uploads and external secure-link participation are Post-MVP. | — |
| DEC-018 | 2026-10-06 | Implementation Sequencing | Frozen implementation sequence: Core Individual Tasking → Personal Productivity → Saved Views → Location → Events & Time → Registered Collaboration, followed by Post-MVP capabilities. External-link attachments are in Personal Productivity. | — |
| DEC-019 | 2026-10-07 | Identity Architecture | Use Firebase email-link authentication alongside social login. User profile includes optional `profile_picture_url`, populated only from supported social-provider identity data in the current scope. | DEC-005 email OTP wording |
| DEC-020 | 2026-10-07 | Task Date / Priority Architecture | For Task, Start/Due/End are optional; no Due means Someday. Start/End may be auto-populated by lifecycle actions when absent. Task priority is boolean. Scalar nullable `start_date`/`due_date`/`end_date` query fields mirror richer date values. Event date semantics are deferred to Milestone 5. | DEC-009 requirement that every Task has Start/Due/End |
| DEC-021 | 2026-10-07 | Firestore Task Containment | Store user-task preferences, user-task state, reminders, and activity threads/entries as subcollections under Task. Rules v2 is the baseline. Derived cross-task query projections may be added later but are non-authoritative. | DEC-009 top-level User↔Task document placement |
| DEC-022 | 2026-10-07 | Task Write Boundary | Use a hybrid write model: approved ordinary Task fields may be edited directly under Security Rules; lifecycle, archive/delete, hierarchy/governance, and audit-relevant business actions execute through trusted backend transactions that also write System Changes. | — |
| DEC-023 | 2026-10-07 | Task Creation Lifecycle | Normal user-created Tasks start at `Upcoming:Planned`. `Upcoming:Draft` is reserved for future trusted-backend/import creation such as email forwarding. | — |
| DEC-024 | 2026-10-07 | Milestone 1 Lifecycle Contract | Milestone 1 uses explicit business-action transitions. Completion is valid only from In Progress; Waiting/Blocked/On Hold must Resume first. Planned/Ready tasks may be cancelled directly. Due dates never transition lifecycle automatically. | — |
| DEC-025 | 2026-10-07 | System Tag Persistence | Store per-user system tags in a structured `system_tags` map under Task preference documents. Current dimensions are Importance, Urgency, DOW, and TOD; explicit negative vs unclassified semantics are preserved. | — |
| DEC-026 | 2026-10-07 | Hide Until Semantics | Keep shared lifecycle states Waiting/Blocked/On Hold separate from private per-user Hide until. Hide until suppresses surfacing only, does not change lifecycle, and is discoverable through Search and Follow Up. | — |
| DEC-027 | 2026-10-07 | Preset Views | Initial preset order is fixed and product-controlled: Focus, Resolve, Prioritize, Plan, Follow Up, All Active, Recently Closed, Unarchive, Recover. The earlier saved-query-document implementation model is superseded by DEC-033. | DEC-033 supersedes saved-query-document implementation |
| DEC-028 | 2026-10-07 | Preset Grouping | Freeze preset grouping: Focus by Due bucket; Resolve by lifecycle state; Prioritize by Due bucket/date; Plan by Created-date bucket; Follow Up by hidden-until bucket; All Active ungrouped; Recently Closed/Unarchive/Recover by their respective date buckets. For date-based groups, Category is the secondary ordering key. | — |
| DEC-029 | 2026-10-07 | Plan Preset | Plan contains active tasks with no Due date and groups them by Created-date bucket: Today, Previous 7 Days, Previous 30 Days, Older. Within each bucket, order by Category then Created date. | — |
| DEC-030 | 2026-10-07 | User Timezone | Store an IANA timezone on the user profile, initially derived from device/browser timezone. Relative dates, date buckets, DOW, and TOD are evaluated using that stored timezone. | — |
| DEC-031 | 2026-10-07 | View Customization Direction | Prefer opinionated global presets with configurable parameters/presentation, runtime modifiers, Search, and temporary filters. User-created Saved Views and a standalone View Builder are deferred pending demonstrated recurring retrieval needs. If persistence is later justified, prefer Save current view over an independent query-builder workflow. Milestone 3 becomes View Refinement. | DEC-008/DEC-011/DEC-017/DEC-018 requirements for an upfront standalone View Builder and Saved Views |
| DEC-032 | 2026-10-07 | Per-View Preference Persistence | Persist a full resolved preference snapshot per explicitly remembered view. No document exists until Remember; temporary changes remain client-side. Reset deletes the preference document and returns to current product defaults. Preference documents are per-user/per-view and schema-versioned. | — |
| DEC-033 | 2026-10-07 | Preset Query Architecture | Remove user-created Saved Views and standalone View Builder from the product baseline. Preset views are application-defined, client-parameterized query strategies and may be tuned independently rather than forced through a generic saved-query DSL. | DEC-027 saved-query-document model; DEC-031 deferred Saved Views/View Builder direction |
| DEC-034 | 2026-10-07 | View-Specific Time Thresholds | Near/Medium/Far time boundaries are configured per view, not globally. Buckets are Older, Today, Near, Medium, Far, Later with `0 < near < medium < far`; remembered values are part of the full per-view preference snapshot. | Earlier global Near/Medium/Far preference direction |
| DEC-035 | 2026-10-07 | View Retrieval Extent | Retrieval is view-based, not group-based. Time-bounded views default to `max(30, 2 × far_days)` on the view-relevant date field and may expand on explicit user action. Grouping remains client-side presentation. | — |
| DEC-036 | 2026-10-07 | View Staleness | `updated_at` may define view-specific staleness without changing task lifecycle. All Active defaults to a 60-day staleness threshold, rememberable per view; stale tasks remain available through explicit inclusion/access. Views such as Resolve may ignore staleness where completeness is intrinsic. | — |
| DEC-037 | 2026-10-07 | Preset Retrieval Contracts | Freeze per-view retrieval semantics for Focus, Resolve, Prioritize, Plan, Follow Up, All Active, Recently Closed, Unarchive, and Recover. Apply staleness only where it supports the view's intent: All Active defaults to 60 days; Plan defaults to 60 days; Focus/Prioritize/Follow Up and retrospective recovery/history views do not exclude on staleness; Resolve never hides stale unresolved work. | — |
| DEC-038 | 2026-10-07 | Task Availability Projection | Add derived Task field `availability = working | archived | deleted` for retrieval. It is maintained by trusted backend archive/delete/restore actions and is non-authoritative relative to archive/delete timestamps. | — |
| DEC-039 | 2026-10-07 | Unspecified Date Bucket | In date-organized views, Tasks without the relevant date are placed in an **Unspecified** bucket at the end of the view. No synthetic date is assigned. Presets whose defining semantics require the date may still exclude missing-date Tasks. | — |
| DEC-040 | 2026-10-07 | Lifecycle Query Fields | Query lifecycle directly through nested Firestore fields `lifecycle.macro` and `lifecycle.micro`. Do not duplicate lifecycle into top-level query fields unless later measurements justify a projection. | — |
| DEC-041 | 2026-10-07 | Firestore Preset Query Contract | Freeze Milestone 1–3 view-level candidate query shapes and minimum index strategy. Preset-defining predicates execute server-side; grouping, presentation filters/modifiers, and final sort remain client-side. Prioritize uses separate dated and null-Due branches merged client-side. Follow Up and per-user enrichment use Rules-v2 collection-group queries. | — |
| DEC-042 | 2026-10-07 | Firestore Security Rules Contract | Freeze Milestone 1–3 Rules-v2 authorization boundaries: owner-scoped Task reads, invariant-checked root creation, narrow ordinary Task updates, backend-only lifecycle/archive/delete/hierarchy/audit actions, own-only preferences/view preferences, backend-managed Hide Until/reminders, immutable System Changes, identity-constrained collection-group access, and mandatory emulator rule tests. | — |
| DEC-043 | 2026-10-07 | Backend Callable / Transaction Contract | Use 2nd-generation Firebase callable functions for Milestone 1–3 trusted business actions. Task actions use optimistic concurrency via `expected_updated_at`; lifecycle/archive/delete mutations and System Changes are atomic; subtask creation is transactional; Hide Until and reminders have dedicated callables without touching Task `updated_at`; automatic Planned→Ready is trusted/idempotent; stable backend error codes are defined. | — |
| DEC-044 | 2026-10-07 | Physical Task Schema | Freeze the Milestone 1–3 `/tasks/{taskId}` document schema, required/null fields, TaskDate structure, lifecycle/availability/date/hierarchy invariants, field ownership, timestamp semantics, and validation policy. | — |
| DEC-045 | 2026-10-07 | User Profile Schema | Freeze the Milestone 1–3 `/users/{uid}` schema, own-only access, canonical identity fields, editable display name/timezone, provider-derived profile picture semantics, and timestamp ownership. | — |
| DEC-046 | 2026-10-07 | Category Schema | Freeze the Milestone 1–3 `/categories/{categoryId}` schema, normalized-name uniqueness intent, archive/reference behavior, stable IDs, and trusted reset-to-default reconciliation semantics. | — |
| DEC-047 | 2026-10-07 | Preference / State / Reminder Schemas | Freeze the Milestone 1–3 physical schemas for Task preferences, per-user Task state, and reminders. Preference enums/cardinality are fixed; Hide Until clear retains the state document with `hidden_until = null`; reminders are backend-managed with scheduled/delivered/cancelled/failed states. | — |

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

## Open Questions

- Exact Nearby coarse-proximity distance bands/resolution/query implementation remains deferred to Firebase Architecture.
- Exact autosave-versus-unsaved-change warning behavior remains a detailed interaction-design decision.
- Search implementation details beyond the approved baseline (fuzzy/semantic search, stemming, ranking technology) remain deferred to Firebase Architecture.
- Todo field, lifecycle, and date semantics remain deferred.
- Attachment file-size/type limits remain an implementation/operational decision.

## Implementation Status

No implementation has been formally recorded as started, implemented, or verified.

## Known Issues / Technical Debt

None formally recorded yet.

## Change Log

| Date | Change | Approval |
|---|---|---|
| 2026-10-07 | Frozen physical Preference, State, and Reminder schemas, including stable state-document identity with `hidden_until = null` on clear. | Approved |
| 2026-10-07 | Frozen physical User Profile and Category schemas, including ownership, normalization, archival/reference rules, and reset-to-default reconciliation. | Approved |
| 2026-10-07 | Frozen the physical Milestone 1–3 Task document schema, TaskDate model, nullability, derived-field invariants, field ownership, and validation boundaries. | Approved |
| 2026-10-07 | Frozen Milestone 1–3 backend callable/API and transaction boundaries, optimistic concurrency, stable errors, reminder/Hide Until actions, and automatic Ready promotion semantics. | Approved |
| 2026-10-07 | Frozen Milestone 1–3 Firestore Security Rules contract, including direct-write allowlists, backend-only business state, per-user subcollection isolation, collection-group constraints, and mandatory emulator tests. | Approved |
| 2026-10-07 | Frozen Milestone 1–3 Firestore preset candidate queries, expansion behavior, per-user collection-group enrichment, and minimum composite-index strategy. | Approved |
| 2026-10-07 | Approved nested lifecycle query fields (`lifecycle.macro` / `lifecycle.micro`) with no top-level duplication. | Approved |
| 2026-10-07 | Added derived Task availability projection and standardized Unspecified date buckets at the end of date-organized views. | Approved |
| 2026-10-07 | Frozen per-view retrieval contracts and extended staleness semantics where appropriate; Plan and All Active default to 60-day staleness while deadline/unresolved/recovery views preserve completeness. | Approved |
| 2026-10-07 | Approved view-based retrieval extent and updated-at staleness semantics; All Active defaults to a 60-day stale threshold without lifecycle side effects. | Approved |
| 2026-10-07 | Removed Saved Views/View Builder from the product baseline; adopted client-parameterized preset queries with independently tunable, per-view Near/Medium/Far thresholds. | Approved |
| 2026-10-07 | Approved full per-view preference snapshots persisted only through explicit Remember; Reset returns the view to current defaults. | Approved |
| 2026-10-07 | Shifted customization direction to configurable presets + temporary filters; standalone View Builder/user-created Saved Views deferred pending demonstrated need; Milestone 3 renamed View Refinement. | Approved |
| 2026-10-07 | Approved Plan created-date buckets and user-profile IANA timezone semantics for relative date/DOW/TOD evaluation. | Approved |
| 2026-10-07 | Frozen preset grouping and presentation ordering; date-based groups use Category as the secondary ordering key. | Approved |
| 2026-10-07 | Approved structured system-tag persistence, private Hide until semantics, and no mandatory userTaskIndex for Milestones 1–2. | Approved |
| 2026-10-07 | Frozen global fixed-order preset saved queries: Focus, Resolve, Prioritize, Plan, Follow Up, All Active, Recently Closed, Unarchive, Recover. | Approved |
| 2026-10-07 | Revised Firebase architecture: Task-scoped preference/state/reminder subcollections, Task-contained activity threads, Rules v2 baseline, and scalar date query fields. | Approved |
| 2026-10-07 | Approved email-link authentication, social-provider profile picture URL, hybrid Task write boundary, Task-only optional date semantics, boolean priority, Planned creation default, and Milestone 1 lifecycle transition constraints. | Approved |
| 2026-10-06 | Approved individual-first MVP scope classification and Post-MVP boundaries. | Approved |
| 2026-10-06 | Frozen implementation sequence: Core Individual Tasking, Personal Productivity, Saved Views, Location, Events & Time, Registered Collaboration; external-link attachments placed in Personal Productivity. | Approved |
| 2026-10-06 | Consolidated approved UX Navigation: Gmail-inspired responsive navigation, Home Eisenhower matrix, Tasks workspace/View Builder, Task Detail, Calendar layers, Nearby map, Search, Settings, and creation UX. | Approved |
| 2026-10-06 | Superseded parent-only subtask browsing: subtasks are independently browsable Tasks with parent linkage. | Approved |
| 2026-10-06 | Added Task Type: Task = actionable work; Event = scheduled occurrence; Todo anticipated but deferred. | Approved |
| 2026-10-06 | Approved Event reduced lifecycle and Event Start/End date semantics; Due is not applicable to Event. | Approved |
| 2026-10-06 | Approved UX Navigation Home design: Eisenhower matrix, Unclassified summary, Category/Status/Role filters, explicit DOW/TOD toggles, per-user quadrant movement, and compact mobile counts/drill-down. | Approved |
| 2026-10-06 | Deferred Related Tasks/See Also concept; explicitly excluded from current scope due to project-management misuse risk. | Discussion note |
| 2026-10-05 | Established `project_status.md` as the unified project-state record. | Approved |
| 2026-10-05 | Approved product vision: individual-first, optional informal family collaboration, lightweight workflow, no project management. | Approved |
| 2026-10-05 | Approved persona/participation model: single Taskify user persona with task-level RACI-inspired roles, external participants, and plain-language UI terminology. | Approved |
| 2026-10-06 | Approved Functional Requirements, including task-scoped access, external-participant rules, lifecycle taxonomy, Google Maps/Places location semantics, recurrence, attachments, and unified comments/activity/history. Micro-state transition rules deferred to Task Lifecycle. | Approved |
| 2026-10-06 | Approved Task Lifecycle, including state constraints, role-to-transition authority, consultant/reviewer approval/rejection, and System Changes capture of reasons/history. | Approved |
| 2026-10-06 | Approved system-tag model: DOW, TOD, Important, and Urgent are per-user task preferences; Category and Priority remain task-definition fields; Nearby remains an ephemeral location query. | Approved |
| 2026-10-06 | Approved Information Architecture: Home/Tasks/Nearby/Calendar/Search/Settings navigation, saved views and View Builder, runtime system-tag modifiers, Advanced Search, role search fields, and task-detail hierarchy. | Approved |
| 2026-10-06 | Approved Data Model covering email-based domain identity, Task hierarchy, direct Owner/Executor/creator fields, participant email arrays, Owner-controlled category, separate user-owned User↔Task documents, recurrence, activity/thread collections, attachment/object-storage lifecycle, external secure access, and archive/soft-delete/purge semantics. | Approved |
| 2026-10-06 | Approved Permission Model covering Owner/Executor trust, read-only Informed access, feedback-only Consultant/Reviewer permissions, secure-link external review, Owner-only delegation/governance controls, and subtask creation/visibility rules. | Approved |

## Next Actions

- Define Firebase / System Architecture aligned to the approved MVP scope and frozen implementation sequencing. **Status:** Next design stage.

No subsequent material action is considered approved unless explicitly authorized by the project owner.