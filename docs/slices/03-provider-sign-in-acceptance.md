# Slice 3 — Real-provider acceptance checkpoint

23 October 2026. Presentation committed as `c765972`; no push requested.
The owner approved desktop checks, then paused automation and chose manual testing.
Google's agent-observed results and Microsoft's owner-reported personal-account
verification are recorded separately. Slice3 acceptance remains open.

## Build and configuration preflight

A clean Auth-mode artifact was built from commit
`c76597219608fcbd3af098614edec711f0cc5206`:
`c76597219608-dc4f80bbb0fcdf29`, app0.1.0, sourceDirty:false.
Offline client checks passed. Read-only Firebase metadata confirms Google and
Microsoft are enabled with client IDs configured, and localhost plus canonical
and dev/qc/uat domains are authorized. No provider secrets were retrieved and no
configuration changed. See [preflight evidence](03-provider-sign-in-acceptance-evidence.json).

The preceding [presentation checkpoint](03-provider-sign-in-presentation.md)
passed 121 unit/component, 7 integration and 23 headless browser checks and four
builds. That establishes local/emulator behavior, not real-provider completion.

## Acceptance sequence and remaining work

| Step | Scope | Recommendation / dependency |
|---|---|---|
| 1 | Desktop Google and Microsoft popup checks | Initial checks recorded below; automation remains paused at owner request |
| 2 | Microsoft personal and work/school audience | Personal sign-in/refresh/Logout manually passed; work/school remains pending |
| 3 | Actual hosted mobile redirect/storage behavior | Later, after an explicit deployment request naming dev; existing dev lacks the new Microsoft/shared presentation work |
| 4 | Provider operational settings | Owner verifies Google audience/test-user access and Microsoft secret expiry; enterprise consent/restrictions may need tenant administration |
| 5 | Slice3 acceptance | Review actual results and unresolved browser/provider gaps before declaring closure; linking/provisioning remain later slices |

## Desktop test script — owner approved; automation now paused

1. Check port 5173 is free, then serve the exact built dist-auth artifact locally. Use
   localhost as the Auth origin. Production-preview serving has no Firebase Hosting
   headers; this step does not establish hosted CSP or mobile redirect readiness.
2. Open a separate browser session. The owner selects accounts and handles any
   password, MFA and consent. Do not ask for credentials in chat, record tokens,
   or alter provider registrations, account linking or tenant policy.
3. For Google, cancel/close the popup and return to login, then repeat with Cancel
   sign-in before popup polling settles. Verify no transient Logout and keyboard
   recovery. Retry and complete a selected real sign-in. A first sign-in can create
   a Firebase Authentication user; no Taskify workspace records are provisioned.
4. Verify authenticated landing, stable session after refresh, and cross-tab session
   presentation/Logout. Verify Logout remains accessible during blocked compatibility
   and protected content stays hidden; use browser offline/online controls only.
5. Repeat for Microsoft personal and, separately, work/school accounts. Do not treat
   organizational consent or access restrictions as an application success.
6. Record browser/OS, source/build, provider/account category, timestamps and each
   result. Do not store account emails, display names, credentials, provider URLs
   containing codes or access tokens in tracked evidence. Keep outcomes PENDING,
   PASS, FAIL or BLOCKED with a sanitized reason; a blocked case is not a pass.
7. Finish signed out and stop only the owned preview server. No automated account
   deletion, cloud configuration changes or publication as part of these checks.

## Remaining gates

| Evidence | State |
|---|---|
| Clean build and provider/domain preflight | PASS |
| Google desktop real OAuth/cancellation/persistence/Logout | PARTIAL PASS; see observed scope below |
| Microsoft personal desktop sign-in, refresh and Logout | PASS — owner manually verified |
| Additional Microsoft personal desktop cancellation/edge cases | Limited observed scope below; broader cases not inferred |
| Microsoft work/school desktop OAuth/cancellation/persistence/Logout | PENDING |
| Actual hosted mobile browser redirect/storage checks | PENDING |
| Google audience/test-user settings and Microsoft secret expiry | PENDING |
| Owner acceptance and Slice3 closure | PENDING |

Preparation itself made no interactive attempt. Subsequent owner-approved testing
started the clean local preview and real provider attempts described below. That
execution checkpoint made no account linking, workspace write, Hosting deployment,
staging, additional commit or push. Subsequent review preparation is recorded below. User backup/recovery remains FUTURE.

## Observed desktop results and manual handoff

The connected browser controls could not open Chrome, so checks used a dedicated
Codex in-app browser tab. Provider windows were owner-controlled and outside the
connected tab inventory. Do not label this Chrome-specific or real-mobile coverage.

- Google: owner reported successful sign-in; Taskify visibly confirmed authenticated
  landing and current compatibility readiness. Refresh preserved account presentation.
  A second Taskify tab restored the same presentation. Logout there propagated to
  the original tab, and a refresh remained signed out. A Taskify-side Cancel sign-in
  attempt returned signed out without Logout and provider controls recovered. The
  exact close-provider-window-first race was not independently verified in this run.
- Microsoft: Taskify-side cancellation returned signed out without Logout and controls
  recovered. On a subsequent personal-account attempt, the owner reported successful
  provider completion, but Taskify displayed Sign-in was cancelled and remained signed
  out. That initial attempt did not pass. A stale/cancelled popup was considered as one possibility, not established as the cause. The planned fresh
  single-popup retry was not run because the owner paused testing.
- Work/school Microsoft, actual hosted mobile redirect/storage, real-session offline
  behavior, Google audience settings and Microsoft secret expiry remain unverified.
- Owner then requested Pause testing and I will test manually. Interactive automation
  is paused; no further app input was issued. The clean preview remains running at
  `http://localhost:5173/` for manual testing. Last observed Taskify state was signed out.
  Keep manual outcomes separate from agent-observed checks; no credentials, codes,
  tokens, account emails or display names belong in tracked records.

For the manual Microsoft retry, close leftover provider windows, start one new
Microsoft attempt and complete that exact popup. Report whether Taskify reaches the
signed-in landing or shows a classified error; report personal/work-school category
without account identifiers. Confirm refresh and Logout only after a real signed-in
landing. Do not infer application success from provider completion alone.

## Owner manual verification — 23 October 2026

After pausing automation, the owner explicitly confirmed: **Microsoft personal:
sign-in, refresh and Logout passed.** These three checks are recorded as
owner-reported manual passes. They were not re-observed by the agent, and the
manual run's browser/OS was not separately specified. No additional account,
provider, cancellation, cross-tab, offline or mobile coverage is inferred.

This updates the current personal-account result while preserving the earlier
cancelled/signed-out observation as history. The cause of that earlier attempt
remains unconfirmed; no application fix or configuration change was made for it.
Microsoft work/school, hosted mobile redirect/storage, provider operational checks
and owner Slice3 closure remain pending. Interactive automation remains paused;
no new browser action, staging, commit, push or deployment follows from this report.

## Prepared for review — 23 October 2026

At the owner's request, this acceptance record, sanitized evidence and related
project documentation are staged for review. Scope is documentation only; no code
or test inputs changed, so no test rerun is required. Evidence JSON parsing,
credential-pattern checks, local documentation links and staged whitespace checks
passed. The earlier 121 unit/component, 7 integration, 23 browser checks and four
builds remain the implementation checkpoint, not new real-provider results.

Google coverage remains the agent-observed local desktop subset above. Microsoft
personal sign-in, refresh and Logout are owner-reported passes. Work/school Microsoft,
real mobile redirect/storage, provider operational settings and Slice3 closure are
still pending. Earlier cancelled-attempt history remains intact. No further browser
input, server lifecycle action, cloud configuration, deployment, commit or push is
performed by review preparation. Interactive automation remains paused.
