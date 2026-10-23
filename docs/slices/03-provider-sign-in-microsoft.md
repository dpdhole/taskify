# Slice 3 — Microsoft sign-in checkpoint

23 October 2026. The owner authorized the next implementation step after committing
Google/Auth/session work as `41fe3f4`. Microsoft now uses the shared provider-aware
adapter, session controller and login controls. Slice3 acceptance remains open.

## Implemented

- Continue with Microsoft uses Firebase `OAuthProvider('microsoft.com')`, with
  `tenant: common` and account selection. Both personal and work/school accounts
  are intended, matching the owner's screenshot-verified Entra registration.
  No extra Graph scopes, Graph requests, profile-photo downloads or OAuth token
  extraction are added. See [official Firebase Microsoft guidance](https://firebase.google.com/docs/auth/web/microsoft-oauth).
- Google and Microsoft share one pending-operation lock, persistence checks,
  current compatibility admission, session generations and Logout quarantine.
  The controller and UI accept a provider identifier; SDK objects stay in infrastructure.
- Desktop uses popup; known hosted coarse-pointer devices use redirect. Localhost
  defaults to popup. Blocked popups offer an explicit redirect for the same provider.
  Messages identify the selected provider, with sanitized cancellation/network/
  configuration/account-conflict recovery. No automatic email merge or linking.
- Redirect metadata contains only provider, Logout epoch and timestamp, with the
  existing 15-minute limit. New builds also consume the prior Google-only marker
  so a return from the currently deployed dev build can finish safely. Invalid
  provider metadata and stale returns are rejected before SDK user commitment.
- Logout in this tab or another tab on the same origin invalidates pending attempts.
  Disposal retains the SDK admission middleware while popup/redirect work settles.
  Neither preview-origin storage nor Logout is shared across dev/qc/uat origins.
- Both provider controls require restored Auth and current compatibility readiness;
  a returned identity alone cannot open protected workspace operations. Tasks,
  linking, provisioning and account/profile edits remain later slices.

## Local use

Use `npm run dev -- --mode auth` and open `http://localhost:5173`. Choose Google or
Microsoft; close the provider popup to cancel, or use Cancel sign-in. If a popup is
blocked, choose Continue with redirect explicitly. For account conflicts, use the
existing sign-in method; this checkpoint cannot link accounts. Logout remains
available when compatibility is blocked. The authenticated landing states that
workspace functionality is not available yet.

## Validation and remaining work

Final checks passed: 112 unit/component tests, all four builds, 7 integration tests
and 19 headless Chromium browser tests, with no browser retries. The Google and
Microsoft browser cases exercise popup completion/persistence, late-result
rejection after cancellation, explicit redirect at 390px and cross-tab Logout.
A component check verifies Microsoft fallback and account-conflict recovery; unit
checks cover common-tenant configuration, overlap exclusion, redirect metadata,
legacy marker consumption and malformed provider rejection.

See [evidence](03-provider-sign-in-microsoft-evidence.json) and
[execution log](03-provider-sign-in-microsoft.log) for final check counts and input hashes.
The tests use Firebase's actual popup/redirect APIs against the local Auth emulator;
Google's official iframe helper library is allowed because the resolver requires
it even for simulated Microsoft sign-in. Other external provider origins are blocked.
This does not validate Microsoft consent, a real personal/work-school login,
Entra tenant restrictions, enterprise admin approval, secret expiry or real-device
storage policies. The earlier owner screenshots establish configuration evidence,
not completed sign-in. Interactive provider tests still require owner approval.

Next: finish the agreed shared responsive login presentation and acceptance review,
then run explicitly approved real-provider checks. Existing dev still serves the
Google-only snapshot until another channel-specific deployment request. This step
performs no cloud configuration, Hosting deployment, staging, commit or push.
Onboarding templates do not change because no workspace records are provisioned.
User-driven backup/recovery remains FUTURE.

## Review preparation — 23 October 2026

The owner requested documentation updates and staging for review. The staged
scope contains Microsoft support, the shared provider operation and controls,
Google regression coverage, and the checkpoint documentation/log/evidence.
The implementation source still matches the validated hashes. No application
code changed during review preparation, so the 112 unit/component, 7 integration,
19 browser checks and four builds above remain the applicable validation.

The owner also requested a local preview server. Auth mode was started on the
checked-free port 5173, and `http://localhost:5173/` returned HTTP 200. This establishes
server availability only; no successful Google or Microsoft sign-in has been
reported or verified by this preview-start action. Provider screenshots establish
configuration, not OAuth acceptance.

| Review area | Current state |
|---|---|
| Microsoft popup/redirect and safe recovery | Implemented and locally validated |
| Shared provider lock, compatibility and Logout | Implemented and regression checked |
| Personal and work/school Microsoft accounts | Configuration verified; real sign-in pending |
| Final responsive login presentation | Pending |
| Slice3 acceptance/closure | Pending |
| Hosted dev | Earlier Google-only snapshot; this change is not deployed |
| Git delivery | Staged for owner review; not committed or pushed |

Local Auth settings remain ignored. The running preview must not be stopped for
a test suite without explicit direction; the emulator runner correctly refuses
occupied ports. Future Hosting requests must name dev/qc/uat/live. Staging does
not authorize publication or promotion.

## Subsequent cancellation correction

The owner reported a transient Logout control after closing either provider popup
and selecting Cancel sign-in. The [cancellation fix](03-provider-sign-in-cancellation-fix.md)
records the controller correction, regressions and final validation. The earlier
112-test implementation checkpoint above remains historical. The owner subsequently
requested stopping the local preview; it is stopped, and the fix is staged for review.
