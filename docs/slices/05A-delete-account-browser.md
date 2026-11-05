# Slice 5A — Provider proof, request flow and account UI checkpoint

5 November2026. The owner instructed committing Auth finalization locally, then
implementing provider proof, request flow and UI. The prior checkpoint committed
as ddcdede; no push. This checkpoint implements the browser portion of
[DA1](05A-delete-account-contract.md). Slice5A remains unaccepted pending remaining
platform/provider/release evidence. No real account deletion or publication occurs.

## Delivered behavior

- Separate Delete Account section on the minimal signed-in account surface,
  including partially initialized workspaces. Permanent-loss/provider-account
  boundaries, typed DELETE, supported linked-provider choices, popup/redirect
  verification, separate final request action and cancellation before submission.
- Dedicated SDK-owned proof Auth context, independent of held Slice4 linking.
  Verify original UID/epoch, operation/provider and the actual returned proof user;
  transfer that user into shared primary Auth, then force-refresh that primary
  token. Fresh signed claims, not a marker or refresh of the old user, authorize
  the request. Google and Microsoft provider routes use the same safeguards.
- Redirect session correlation contains only UID/epoch/job/nonce/provider/time and
  confirmation intent. No raw tokens are stored by application code. SDK persistence
  owns credentials. Redirect return still requires the real SDK result, same UID
  and fresh claims; it restores a ready-to-request state without automatic intent.
- Browser transaction reads the control and current compatibility policy, creates
  the exact immutable request only when absent, and otherwise adopts the existing
  job. No job replacement, progress mutation, browser cleanup or Auth deletion.
- Minimal UID/project-bound sessionStorage submission marker survives refresh when
  acknowledgement is unknown. Server absence after an uncertain submission does
  not grant cancellation/replay. Cloud-confirmed presence recovers the existing
  job. Logout/account switching clears local scoped state without cancelling cloud
  processing. All callbacks and request admission remain UID/session-bound.
- Cached/local-pending snapshots block access but cannot claim cloud confirmation
  or completion. Only authoritative status supplies progress. Unknown control
  schemas remain fenced. Failed reads stay unavailable/uncertain rather than absent.
- Pending jobs replace workspace/method content with blocking operator status,
  Refresh status and Logout. No browser continuation/cancellation after submission.
  Status refresh remains usable across compatibility loss; new proof/request writes
  require compatible online admission. Auth/listener failure never proves completion.
- Operator-dependent completion and distinct account-removal/metadata-retirement
  milestones are shown explicitly. Retirement execution remains disabled.

## Candidate compatibility and publication boundary

Local source/package/lock/client are now0.3.0. The local workspace policy candidate
is format1/revision3/serverRelease3 with min/max app0.3.0; accountDeletion declares
readable schema1 and write schema1. Other family schemas remain unchanged. The
actual deployed dev remains app0.2.0/revision2/serverRelease2. No policy or Hosting
artifact was published. The current cloud maximum deliberately blocks the new
client until coordinated publication is separately authorized.

DA1 ordering remains Rules first while revision2 disables request creation, then
expected-revision2 publication of candidate revision3, then the reviewed0.3.0 client.
Rollback preserves fences, pending-job recovery and the0.3.0 floor. Do not publish
the client alone or treat local candidate validation as deployment authorization.

## Local evidence

- New controller/component/proof suites:29 cases across14 controller,10 mocked
  proof-adapter and5 component cases. Cover typed confirmation, no premature intent,
  UID/provider/job mismatch, failed/expired proof, Logout/account switching,
  redirect result/marker behavior, token transfer, offline/compatibility revocation,
  uncertain acknowledgement, existing jobs, unsupported controls and status UI.
- Firestore production runner:102 cases across four suites, including seven actual
  request-adapter cases and95 existing Rules/stage cases. Verified immutable intent,
  resolved timestamps, duplicate-job adoption, storage restoration, schema blocking,
  revoked admission, policy drift and server-confirmed listening. Test-environment
  compat Firestore is explicitly unwrapped to its modular delegate for adapter types.
- Headless browser runner:13 passes across mobile390px and desktop1280px confirmation,
  cancel-before-intent, request, reload recovery, refresh and Logout plus existing
  provisioning/recovery regressions. Two additional real Firebase SDK emulator
  popup cases prove same-UID Google/Microsoft reauthentication, actual token transfer
  into primary Auth, and request admission by shared Firestore Rules. They are
  synthetic provider simulations, not live OAuth/provider acceptance.
- Confirmation screenshots inspected at both widths; content remains readable and
  no horizontal overflow occurs. Screenshots remain ignored local artifacts.
- Full npm run verify passed513 unit/component cases,56-file source boundaries,
  typechecking, Rules generation drift, icon integrity, lint/format, four builds and
  bundle isolation. Standalone operator typecheck also passed, after emulator
  shutdown. No administrative dependencies or fixtures entered browser bundles.

Initial browser checks exposed a null-identity Logout bug, now fixed with explicit
local-state cleanup coverage. The old compatibility test used0.3.0 as a future
version; it now uses an intentionally unsupported version independently of the
current app. Deletion fixtures use a separate UID to avoid cross-test data overlap.
A temporary test registration error was corrected before the13-case passing run.
These failed runs are not counted as passes. Existing Vite chunk-size advisories
remain; no browser bundle may contain administrative dependencies or test fixtures.

## Remaining acceptance

Real Google/Microsoft popup and mobile redirect proof, formerly linked-provider
re-registration/conflicts, cloud Rules/IAM and stale-token/queued-write behavior
still need separately authorized evidence. Redirect behavior currently has mocked
SDK/result coverage; it is not proven by the popup emulator cases. Slice4 remains
held and unaccepted; no linking fix or acceptance is implied.

T7 retirement remains disabled; implementing a deadline does not prove its safety.
Large-volume traversal lease renewal remains follow-on work. No fixed completion
time, automatic finalization, public job lookup or completion notification is added.
T1–T8 remain incomplete. This checkpoint creates no commit, push, deployment or
real destructive execution after ddcdede.
