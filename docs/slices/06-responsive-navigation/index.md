# Slice 6 — Responsive navigation

**24 November update:** Main `ab4ce18` records Slice5A accepted and closed for
supervised test-account reuse. This satisfies the earlier Slice6 commit-hold
condition. Continue with combined validation and real signed-in workspace checks
under the [current readiness assessment](readiness.md). Earlier dated restrictions
below describe the parallel-work period before dependency closure.

Status: **detailing accepted 2 November 2026; parallel local implementation
authorized 6 November 2026; local implementation under verification**.
The owner accepted the proposed scope and all twelve detailing recommendations,
then authorized documentation updates. On 6 November the owner authorized parallel
local implementation and required holding all commits until Slice5A is completed.
This supersedes the start-work prerequisite only: Slice5A acceptance/release gates
remain outstanding. See [local implementation](implementation.md); no deployment
or final Slice6 acceptance is claimed.

Authority: [product specification §§19–21](../../product_spec.md),
[architecture](../../architecture.md), [slice plan](../../implementation_plan.md),
[workspace provisioning](../05-workspace-provisioning/index.md) and
[account deletion](../05A-delete-account/index.md).

## Objective and delivery boundaries

Deliver the responsive shell, mobile drawer, desktop rail/sidebar, contextual
headers and safe routing between available destinations. Use authenticated
workspace readiness and provisioned global View ordering; do not implement query
execution, Dashboard charts, Task editing/creation, Search or management forms.

The reconciled main baseline `d48470e` contains Slice5 provisioning and Slice5A
account-deletion implementations. Slice5 is owner-accepted and closed; Slice5A
is deployed to dev and promoted to qc. UAT now records removal, distinct-UID
registration and live blocking/reload recovery; safety evidence and final
acceptance remain pending. Implementation presence does not establish acceptance. The
T1–T8 requirement now gates Slice6 acceptance/release rather than local work,
under the owner's explicit parallel implementation authorization.
See [implementation readiness](readiness.md) for evidence and integration gaps.
Slice4 linking remains open/on hold; preserve its existing surface and limitations
without claiming acceptance. No synthetic workspace fixture may be shipped as a
real provisioned account.

## Destination availability

| Destination/control | Slice6 behavior |
|---|---|
| Home | Default honest shell with working links to available destinations; no fake charts/counts or Task completeness claims |
| All Tasks | Named shell until Slice7 supplies its explicitly limited list |
| Ordinary Saved Views | Named shells explaining unavailable Task functionality; do not run every query through Slice7's limited All Tasks list |
| Manage Views and Settings management | Non-actionable entries labeled Not available yet until their slices implement them |
| My Account | Minimal implemented account surface only: sign-in methods, Logout and Delete Account request/status as available |
| Search | Reserve structure; expose actionable control/form only with Slice13 |
| Create | Reserve layout placement; expose actual button/FAB only with Slice7 creation |
| Task Detail | Contextual shell/routing contract only; no fake detail feature before Slice8 |

Do not make an unavailable entry a link or keyboard-focusable action. Convey its
status accessibly without relying on color or tooltip alone. Do not show disabled
Search/Create controls merely to fill the shell. As features arrive, use their
real behavior without changing the agreed navigation hierarchy.

## Mobile layout — below 960 CSS pixels

Use a left overlay drawer with dismissible backdrop. It never resizes/reflows the
underlying workspace. Its content scrolls independently, including long View lists.
A successful destination selection closes the drawer; a blocked navigation does
not discard the user's current context.

Home remains visible outside the Task Views and Settings accordions. At most one
section is expanded. On each opening, select Task Views from Home, a View, Task
Detail or View-search context; select Settings from Settings or a Settings subpage.
Users can toggle sections manually while open; reopening derives expansion from
the current context rather than the last manual accordion state.

Task Views lists ordinary Saved Views and protected All Tasks directly, using the
same persisted global order as Home and View management. Dashboard visibility
never removes a View from navigation. Include the secondary Manage Views entry,
non-actionable until implemented. Settings contains Views, Categories, Locations,
Preferences, Cleanup and My Account, with availability as above.

Home/View headers show hamburger and left-aligned contextual title; truncate long
visual titles without losing the accessible full name. Search appears when its
feature arrives. Task Detail and Settings headers use Back rather than hamburger,
with available contextual icon actions and title/context below the action header.
Do not implement future Task actions or an overflow menu with no usable actions.

## Desktop/tablet layout — at or above 960 CSS pixels

Start with a collapsed navigation rail when no valid per-tab state exists. Burger
expands persistently and resizes/pushes main content; explicit Close returns to the
rail and restores workspace width. Both Task Views and Settings sections remain
open. Navigation content scrolls independently.

On a hover-capable pointer, entering the collapsed rail previews expanded
navigation as a temporary overlay without resizing content; leaving closes the
preview. Never require hover for access: explicit expansion works for keyboard,
touch and mixed-input devices. Escape closes a temporary preview and returns
focus appropriately. Keyboard focus within navigation must not be hidden merely
because the pointer leaves; reconcile preview/focus without losing an active item.

Keep available navigation/section icons at their natural expanded vertical
positions, hiding labels rather than compressing icons into a separate toolbar.
Individual Saved Views need not each have a rail icon; expand navigation to access
them. Do not render unavailable Create as an actionable icon. When Slice7 arrives,
Create belongs at the top of navigation with a centered modal, never a desktop FAB.

The standard larger-screen header has burger, Taskify branding/contextual title
and, once implemented, single-line explicit-submit Search. Settings/subpages use
Back, title and useful contextual overflow only. Future Task Detail retains its
side-panel/full-page direction; this slice does not implement its content/layout.

## Navigation state and retention

Persist desktop expanded/collapsed state per tab and account using session-scoped
storage where available; preserve it through routes and reloads. Reset on Logout
or account switch. No cross-device preference or persistent profile field. If
storage fails, use safe in-memory state without blocking navigation.

A fresh tab/session without valid retained state starts collapsed. Browser session
restoration can preserve session storage, so do not promise every browser restart
resets it. Hover previews and mobile overlays are transient and not restored.

At the 960px boundary switch layouts without changing destination. Close temporary
overlays, remove focus traps/background locks and restore sensible focus. Preserve
desktop expansion separately from mobile drawer state. Validate the proposed
breakpoint under zoom, long names and touch devices; a necessary material behavior
change returns for review rather than silently changing the accepted interaction.

## Routing, Back and navigation guards

Use stable View IDs in routing, not mutable names. Record actual in-app origin for
contextual Back and honor browser history without inventing a Task origin. A
directly opened Settings destination may expose a separately labeled Home link
when no safe in-app return exists. Do not implement Back as unconditional Home or
send users to an assumed View.

Establish a shared navigation-guard boundary for link navigation, contextual Back
and browser Back; feature-specific dirty-state prompts arrive with their slices.
Do not invent unsaved state or claim future forms are protected before integration.
Existing Task View discard semantics and Task Detail save protection remain their
respective contracts, not one generic destructive discard action. Do not push
history entries repeatedly just to trap Back.

Refresh/deep links must resolve valid available destinations after readiness checks.
Unknown/unavailable routes show clear guidance and a safe Home link without
creating phantom records. A removed active View shows an explanatory state and
an All Tasks choice; do not silently substitute another View or pretend its query
is still valid. Accepted destination changes announce/update title and move focus
to the destination heading where appropriate.

## Metadata, security and lifecycle

Read View ID/name/order from validated UID-owned workspace metadata. Reconcile
rename/order/deletion updates authoritatively, preserving focus by identity where
possible. Missing/invalid required ordering or protected All Tasks is a workspace
recovery problem, not permission to reseed defaults. Do not show invented counts.

Authentication, compatibility, initialization and deletion status gate shell access.
Do not mount ordinary navigation for incomplete initialization or a deletion-fenced
account. Revoke access and dispose/clear user-scoped subscriptions on Logout,
account change or blocking state. Deletion status/request recovery remains available
through its established minimal surface; an operator-run job is not cancelled by
closing navigation. Compatibility recovery and Logout must remain reachable.

No mutation of View definitions/order is introduced by navigation. No new broad
Rules access or backend tier. Reuse a shared workspace read state rather than
attach duplicate listeners per drawer/header component. Bind async results to
account/session generation and gate admission; do not publish late old-account
labels after switching accounts. Diagnostics exclude profile and Task content.

## Accessibility and interaction

Mobile drawer is a labeled modal navigation surface: focus enters appropriately,
Tab/Shift+Tab remain within it, background is inert and background scrolling locked.
Escape, backdrop and explicit Close dismiss it, returning focus to the opener when
still present. Persistent desktop navigation is not a modal and must not trap focus.
Avoid double focus traps when later feature dialogs arrive; coordinate overlays.

Use semantic navigation, actual links for destinations, buttons for toggles,
current-page indication and expanded state on accordion/sidebar controls. Provide
accessible names/tooltips for icon-only actions and an appropriate main-content
skip link. Keep navigation actions usable with touch, keyboard, screen reader and
reduced motion. Avoid pointer-only dismissal, hover-only destination access,
flashing resize transitions and clipped content under zoom.

Use the approved Material Symbols Rounded family, consistent with Slice5. Entity
icon mappings follow provisioned metadata; exact shell icon tokens and styling
are routine implementation choices within the approved family, checked for clear
labels and consistency. No icon package or dependency is selected by this document.

## Acceptance and evidence

| Area | Required validation |
|---|---|
| Responsive | Below/at/above 960px, portrait/landscape, zoom, long names and touch/mixed pointer |
| Mobile | Backdrop/Close/Escape, context-selected accordion, independent scrolling and destination-close behavior |
| Desktop | Rail placement, resize only on persistent expansion, overlay hover, explicit keyboard/touch expansion |
| Focus | Focus trapping/restoration, skip link, route announcements, no focus loss on metadata/resize |
| State | Routes/reload, valid per-tab retention, storage failure, fresh state and account-switch reset |
| Data | Global View order, Home-hidden Views still navigable, rename/reorder/deletion and invalid metadata recovery |
| Routing | Valid/invalid deep links, refresh, contextual/browser Back and guard boundary |
| Availability | Honest shells, non-actionable future management entries, no inert Search/Create or fake workspace counts |
| Isolation | Logout, stale callbacks, compatibility revocation, incomplete setup and deletion-fenced access |
| Regression | Existing sign-in, linking where implemented, provisioning/deletion recovery and protected definitions |

Use focused state/component checks plus browser flows at narrow/wide sizes.
Screen-reader/manual touch and actual browser-history behavior need appropriate
verification, not merely DOM assertions. Local tests do not certify real provider
or hosted routing behavior. Any hosted checkpoint requires explicit destination
and authorization under [Hosting policy](../../hosting_channels.md).

Update current feature guidance without teaching unavailable features or inventing
manual URLs. There are no provisioning-template changes beyond consuming approved
View metadata. Record listener/request costs for initial shell load and repeated
navigation; no speculative performance/account limit. See the
[implementation checkpoint](implementation.md) for local passing checks and their
limits; no hosted release readiness or final acceptance is claimed.

## Next checkpoint

Continue local validation under the [readiness checklist](readiness.md).
Slice5A's 24 November supervised-test closure satisfies the commit-hold condition.
Prepare the implementation commit with its local evidence. Acceptance/release still require
dependency evidence and the appropriate owner authorization. Frozen experiments/
legacy specification remain unchanged; overall platform feasibility remains
INCONCLUSIVE.
