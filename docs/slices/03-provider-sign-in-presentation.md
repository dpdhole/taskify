# Slice 3 — Shared login presentation

23 October 2026. Implemented locally against `6cc3f7d`; provider acceptance and
Slice3 closure remain open. The owner requested the next implementation step.

## Presentation and behavior

- One shared Taskify hero, preview badge and centered sign-in card across mobile,
  tablet and desktop. A dedicated CSS module isolates the design from Foundation
  and compatibility-only screens. The checkmark is inline SVG; there are no external
  fonts, images, new libraries or additional provider/network dependencies.
- Google and Microsoft controls remain in a consistent vertical order with at
  least48px target height, clear focus outlines and responsive spacing. Restoring,
  signing in, signing out and blocked compatibility retain announced progress.
- Popup cancellation is a normal signed-out status, without an urgent error banner.
  Other provider failures retain classified guidance and explicit redirect fallback.
  The corrected cancellation logic remains unchanged; no transient Logout returns.
- Keyboard focus returns to the selected provider after cancellation and to a
  provider control after confirmed Logout. Recovery waits until that control is
  enabled, and does not take focus away from diagnostics or another control.
- Public build/session details sit in a collapsed Technical details disclosure,
  available by keyboard for support reports. Protected landing, missing-name
  fallback, workspace-unavailable guidance and compatibility recovery remain.
- No Auth adapter/controller, provider configuration, data Rules or provisioning
  changes. The ordinary entry remains compatibility-only; Auth mode is incremental.

## Using the screen

Run `npm run dev -- --mode auth` and open `http://localhost:5173/`. Choose Google or
Microsoft after session and compatibility checks finish. Cancel the provider popup
or use Cancel sign-in to return to login. When popups are blocked, choose Continue
with redirect explicitly. Use the existing sign-in method for account conflicts;
linking is a later slice. Logout signs out this browser's Taskify session, not the
provider everywhere. Open Technical details to include the build in an issue report.

Starting a preview is a separate owner request; none remains running from tests.
This step performs no real-provider interaction, cloud changes, Hosting publication,
staging, commit or push. Existing dev remains the earlier Google-only snapshot.

## Validation

Final results: **121 unit/component tests, 7 integration tests and 23 headless
Chromium checks passed**, plus all four builds and static checks. The mobile and
desktop screenshots were visually inspected; focused diagnostics outlines in the
images are intentional keyboard-focus states.

The [execution log](03-provider-sign-in-presentation.log) and
[machine-readable evidence](03-provider-sign-in-presentation-evidence.json) record
final counts, source/build identities and browser coverage. Browser tests use the
local Firebase Auth emulator; they do not establish real OAuth or device readiness.

Check widths: 320, 390, 768 and 1280 CSS pixels. Verify centered stacked controls,
minimum target size, no horizontal overflow, keyboard provider order, native
Technical details Enter activation, progress/error handling and focus recovery.
Screenshots at 390/1280px are inspected locally. Existing provider/session,
compatibility and Foundation regressions remain required.

The first component run hit jsdom's missing native summary Enter activation.
The component case uses click after checking keyboard focus; actual Enter behavior
is covered by Chromium. No custom keyboard handler replaces the native disclosure.

## Remaining acceptance

The shared presentation is implemented; Slice3 remains incomplete pending separately
authorized real Google/Microsoft checks, including personal and work/school Microsoft
accounts, popup/redirect behavior on actual browsers/devices, Google audience/test-user
settings and Microsoft secret expiry/enterprise restrictions. Keep emulator evidence
separate from real-provider evidence. The next step is to arrange that acceptance
checkpoint; visible or interactive testing requires owner approval. Linking stays
Slice 4, provisioning Slice 5 and manual publication Slice 9. No invented manual URL
or onboarding-record changes. User backup/recovery remains FUTURE.
