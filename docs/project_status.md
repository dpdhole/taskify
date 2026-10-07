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
- **Tasks** — primary task workspace using preset and user-saved views.
- **Nearby** — ephemeral location-context query answering "what can I do here now?".
- **Calendar** — date-oriented projection of tasks/events.
- **Search** — free-text retrieval across accessible tasks, with Advanced Search launching the View Builder wizard.
- **Settings** — profile, categories, notifications, defaults, and integrations.

`My Tasks` and `Shared With Me` are not separate top-level information spaces; their semantics are expressed through preset/user-saved views in **Tasks**.

#### Tasks and Saved Views

- A saved view is a stored query definition over the user's accessible task universe.
- Product-defined preset views are **global system-defined saved queries** with a fixed product-controlled order; users do not reorder presets.
- New or revised preset definitions apply globally without per-user copies or migration.
- Users may create, name, save, edit, duplicate, and delete their own views when the View Builder is exposed in Milestone 3.
- A view definition contains task filters, one grouping field, and sort order.
- Saved views store query semantics, not materialized task IDs.
- Views may filter by task-definition and relationship fields such as ownership/role, lifecycle, category, priority, relative date conditions, and participants. Location is a runtime working-context modifier rather than a persisted View Builder filter. Recurrence is not currently a View Builder filter.
- DOW, TOD, Important, and Urgent are not persisted as fixed filters in the saved-view definition; they are runtime system-tag modifiers applied to a view.
- DOW/TOD modifiers are evaluated against the system clock at runtime.
- All system-tag view modifiers are preference-aware: absence of the relevant system tag does not exclude a task; a conflicting assigned tag may exclude it while the modifier is active.
- The View Builder is intentionally constrained to task filters, a single grouping field, and sort order rather than arbitrary nested boolean/query expressions.

#### Nearby

- Nearby is not a saved view and has no system tag.
- It is an ephemeral context query using the user's current or selected location against task locations.
- Its product intent is **"What can I do while I'm in this area?"** It is map-first, using pins for relevant task/event locations rather than presenting a generic task list on a map.

#### Search

- General Search provides free-text retrieval across accessible tasks.
- General Search covers at least title, description, human comments/conversations, attachment metadata, participant names/emails, and participation-role labels. Routine `System Changes` audit entries are excluded from general free-text search.
- **Advanced Search** launches the same View Builder wizard used by Tasks.
- Advanced Search may run ad hoc, be refined, and optionally be saved as a named view.
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
- The sidebar/drawer exposes **Home, Tasks, Nearby, Calendar**, and a bounded set of pinned/recent **My Views** under Tasks. **Settings** is visually separated as configuration.
- **Search is global** from the application header rather than primarily a peer destination in the mobile navigation hierarchy. Search results occupy the main workspace.
- A prominent global **Create** action remains independent of navigation.
- Tasks remains the canonical place for all My Views, Preset Views, and view management; sidebar My Views are shortcuts only.
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
- Task `priority` is a boolean task-global Owner-controlled field and remains distinct from per-user Important/Urgent preferences.
- Event-specific date semantics are deferred to **Milestone 5 — Events & Time** and are not part of the current Task architecture pass.

#### Category

- Category remains part of the shared Task definition.
- Exactly one primary category applies to a task.
- Only the Owner may set or change the task category.
- Category configuration is user-owned and may be archived rather than destructively removed while referenced.

#### User Timezone

- Each user profile stores an IANA timezone identifier.
- The timezone is initially derived from the device/browser timezone and may later be editable in Settings.
- Relative date semantics, date buckets, DOW, and TOD evaluation use the user's stored timezone rather than the executing device's transient local timezone.

#### User-Task Data Separation Rule

User ↔ Task-specific values remain separate from the shared Task document but are stored as **Task subcollections**, reflecting their task-scoped nature and expected small participant counts. They are not embedded directly in the Task document.

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

#### Saved Views

- The saved-query model exists from the outset even though the user-facing View Builder is introduced later.
- Global preset views are system-owned saved-query definitions with fixed product-controlled ordering; users do not reorder them.
- User-created Saved Views are user-owned documents containing name, structured filter definition, one grouping field, sort definition, and timestamps.
- Global presets and later user-created views use the same query-definition semantics.
- Dynamic system-tag modifiers are not persisted as fixed saved-view filters.
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
| DEC-027 | 2026-10-07 | Preset Saved Queries | Use the saved-query model from the outset. Global preset views are fixed-order, system-defined saved queries; users do not reorder presets. Initial order: Focus, Resolve, Prioritize, Plan, Follow Up, All Active, Recently Closed, Unarchive, Recover. | — |
| DEC-028 | 2026-10-07 | Preset Grouping | Freeze preset grouping: Focus by Due bucket; Resolve by lifecycle state; Prioritize by Due bucket/date; Plan by Created-date bucket; Follow Up by hidden-until bucket; All Active ungrouped; Recently Closed/Unarchive/Recover by their respective date buckets. For date-based groups, Category is the secondary ordering key. | — |
| DEC-029 | 2026-10-07 | Plan Preset | Plan contains active tasks with no Due date and groups them by Created-date bucket: Today, Previous 7 Days, Previous 30 Days, Older. Within each bucket, order by Category then Created date. | — |
| DEC-030 | 2026-10-07 | User Timezone | Store an IANA timezone on the user profile, initially derived from device/browser timezone. Relative dates, date buckets, DOW, and TOD are evaluated using that stored timezone. | — |

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
- Snooze / `hidden_until`.
- Basic Search, initially focused on title/description retrieval.
- System Changes activity.
- Archive/delete/restore behavior needed for a coherent lifecycle.

### MVP Reduced

- Event type.
- Calendar.
- Recurrence.
- Saved Views.
- View Builder / Advanced Search.
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
   - Snooze.
   - Basic Search.
   - External-link attachments.

3. **Milestone 3 — Saved Views**
   - Saved Views.
   - View Builder.
   - Advanced Search integration.

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
- Exact date-bucket definitions for View Builder grouping remain a detailed UX decision.
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