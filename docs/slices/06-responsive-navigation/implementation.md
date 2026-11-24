# Slice 6 — Parallel local implementation

**24 November update:** Local source is restored over main `ab4ce18`. Slice5A's
[supervised-test closure](../05A-delete-account/closure.md) satisfies the earlier
commit-hold condition. Next is validation of the combined baseline and real
signed-in navigation/account checks. The original authorization below records
the conditions in force during the parallel implementation period.

6 November 2026, main baseline `d48470e`. Owner authorized local implementation
while Slice5A verification continues, with **all commits held until Slice5A is
completed**. This changes the start-work prerequisite; it does not close Slice5A
or authorize Slice6 acceptance, publication, cloud changes or fence retirement.

## Implemented behavior

- Mobile modal drawer below 960 CSS px: independent scrolling, contextual single
  accordion, backdrop/Close/Escape dismissal, focus trap, inert background and
  scroll lock. Successful routing closes it; a rejected guard leaves context intact.
- At/above 960 px: collapsed rail by default, explicit persistent expansion pushes
  the workspace, hover preview overlays it. Focus within a preview survives pointer
  exit; Escape dismisses it. Hidden View rows retain vertical section placement.
- Desktop expansion is retained per account/tab using session storage with an
  in-memory fallback. Mobile/hover state is transient. Logout/account changes clear
  the prior account's retention; breakpoint changes release modal state/locks.
- `/` is Home; `/views/:viewId` uses stable encoded IDs; `/settings/account` reuses
  the implemented sign-in methods and Delete Account surface. Settings headers use
  contextual Back or a labeled Home fallback for a direct link. Unknown/unavailable
  routes and removed Views explain their state without substituting records.
- React Router's shared blocker covers links, contextual Back and browser Back.
  Future editors can register a synchronous leave decision through
  `NavigationGuardContext` and clear it when leaving. No real dirty form or generic
  discard prompt is introduced. Route changes update title, announce destination
  and move focus to its heading; keyed metadata rows preserve identity on updates.
- Home displays only Home-visible Views; navigation includes every ordinary View
  and protected All Tasks in validated global order. Future management entries are
  non-actionable text; Search/Create and Task/query functionality remain absent.
- Four self-hosted navigation icons use the existing pinned Material Symbols
  Rounded revision/style, with source URLs/SHA-256 recorded in
  `config/navigation-icons-source.json` and checked by the icon verification tool.

## Data and lifecycle boundary

`src/infrastructure/firebase/navigation-reader.ts` watches the admitted UID's View
collection once, validates complete records with existing codecs, requires protected
All Tasks and unambiguous ordering, then publishes a shared sorted projection.
Cache/pending-write snapshots clear navigation metadata until confirmed; malformed
or missing required metadata produces recovery guidance without reseeding or writes.

`SessionView` mounts the shell only for a protected session, ready provisioning and
idle deletion flow. Existing minimal recovery surfaces remain available when any
of these boundaries closes. Unmount disposes the shared read, invalidates callbacks,
releases background locks and removes user labels; account/generation keys prevent
reuse of old-account state. My Account remains reachable on metadata-read failure.
No Rules, provisioning templates, profile preferences or backend tier changed.

Read cost: one additional View-collection listener per admitted mounted shell,
shared across drawer, rail, header and Home. Routing, expansion and metadata rename
do not create another listener (covered by component checks). Initial confirmed
snapshots decode N View documents. Actual billed reads, reconnect costs and hosted
latency are not measured; no zero-cost or account-limit claim is made.

## Local verification and limits

Commit verification on 24 November against main `ab4ce18` passed `npm run verify`:
39 unit/component files and 535 tests, all four builds and bundle isolation, plus
type checks, boundaries, Rules consistency, icon integrity, lint and formatting.
All seven Chromium flows passed on isolated port 5181, including profile fallback,
My Account Logout and local Delete Account confirmation/cancellation. Build chunk-size
advisories remain. These checks support the implementation commit, with the real
workspace and manual acceptance items retained in the readiness checklist.

- `npm run verify`: type checks, dependency boundaries, generated Rules consistency,
  pinned icon hashes, lint/format, unit/component suite, four build modes and bundle
  isolation. Passed: 37 unit/component files, 532 tests; all four builds and bundle
  isolation passed. Vite reports chunk-size advisories; no size budget is claimed.
- `npm run test:navigation:local`: isolated Chromium fixture with synthetic View
  metadata; no Firebase credentials, real accounts or cloud calls. Covers
  390/959/960/1280 px, deep-link reload, contextual history, modal focus/restoration,
  backdrop/Escape, resize cleanup, hover/focus preview and denied storage. All seven
  Chromium flows passed; narrow/wide screenshots were visually inspected locally.
- Focused unit/component checks cover confirmed-only metadata, missing protected
  View, account ownership, read failure/disposal, rename/removal, one shared read,
  future guard rejection, admission/deletion revocation and stale account callbacks.
- The incoming operator README had a formatting failure; only its Markdown table
  formatting was normalized so the existing repository format check could pass.

Synthetic browser fixtures remain under `tests/support`; their rewrite is enabled
only in explicit `navigation-test` development mode. They are excluded from release
module graphs. Browser fixture passes do not certify the production Firebase read
path, hosted deep links, real provider flows, touch hardware, screen readers or zoom.
Those checks remain Slice6 acceptance work. Slice5A dependency closure is recorded
in the 24 November readiness assessment. No emulator
Rules regression or hosted publication is claimed by these checks.

## Review checkpoints

On 8 November, the owner verified desktop Home, All Tasks, ordinary Saved Views,
the informational Manage Views and Settings entries, the My Account link and
header Logout in the local preview. Search, Create and Task Detail controls were
absent as specified. My Account initially showed only fixture text. The preview
now uses the account deletion component with local confirmation and cancellation.
Verification and submission still require a real signed-in workspace.

The 24 November Slice5A closure satisfies the commit-hold condition. Commit
preparation includes the profile details/person fallback, Logout under My Account,
and the Google profile-image CSP allowance. The synthetic preview exercises local
Delete Account confirmation/cancellation. Real account verification follows the
[readiness checklist](readiness.md), alongside manual touch/screen-reader/zoom
checks and the appropriate acceptance/release review.
