# Instrumented T7 safety observations

Local-only controlled client harness. Not deployed, not a deletion operator, and
not authority to retire any fence. Uses real Firebase client Auth/Firestore against
pinned taskify-dev-dpdhole; no Admin bypass or custom tokens. All credentials and
captured original ID tokens stay in memory. The local harness process holds the
original token for its narrow Firestore read probe. Exported JSON contains bounded codes,
UID, event times and token issuance/expiry metadata, never token values or records.
Do not enable HAR/network capture or share credential files.

## Start

From the repository root, install pinned root dependencies and supply the approved
public browser configuration in ignored .env.auth.local. For this session the runner
can reuse the sibling implementation checkout's public Auth config if absent locally.
It does not read or export operator ADC. Start:

```powershell
node tools/t7-safety/serve.mjs
```

Open http://localhost:5182/tools/t7-safety/index.html (localhost, not 127.0.0.1).
The server binds loopback only. Another local app on port 5173 is left untouched.

## Cloud run, staged with the operator

1. Use a new disposable Google or Microsoft personal provider identity that has no
   Taskify workspace. Do not first register it through normal Taskify: that would
   initialize the records and invalidate the empty-workspace baseline.
2. Choose its provider, leave Expected UID empty, and Connect online client once.
   Sign-in may create its Firebase Auth identity. A UID mismatch/identification
   event reveals the resulting UID; no Firestore writes occur. Enter that exact UID.
3. Connect online client again, then Connect offline client with the exact same
   identity/provider. Both separate in-memory Auth contexts must match Expected UID.
   These provider sign-ins are interactive; they do not reuse or export an ID token.
4. Click Create valid base initialization. It requires absent base records and no
   fence, then atomically creates initialization/workspace, profile/main,
   settings/main (UTC) and initializationStages/base. Record the accepted baseline.
   It does not complete the remaining workspace initialization stages.
5. Click Arm listener. It captures the original online ID token and expiry in the local process,
   opens a profile listener, warms the offline profile read, and disables the offline
   client's Firestore network. Confirm a preexisting-profile-stream event with
   fromCache=false and pendingWrites=false before deletion. Keep this page open.
6. In a different tab, sign into QC with this same identity and finish ordinary
   workspace setup. Submit the real typed-DELETE/provider-proof deletion request.
   Copy its exact persisted job UUID into the harness and click Watch accepted job.
   The harness refuses an unexpected job ID and observes only server snapshots.
7. Share the new UID/job for read-only operator inspection and explicit authorization.
   No existing job's authorization transfers to this new disposable target. Run the
   authorized operator only after all observations are armed. In this standard mode, submit intent in QC. Operator cleanup and fence retirement
   are separate from the page.
8. Observe the existing profile stream and job state. Wait for server-observed
   awaiting_retirement with trusted authAbsentObservedAt and retireNotBefore.
   The operator must separately confirm independent inventory emptiness/Auth absence.
9. Before forcing Auth refresh, click Attempt online base reinitialization, then
   Queue valid base reinitialization, then Reconnect queued client. Both recreate
   candidates use exactly the previously accepted base shape. Expected outcomes
   are rejection with bounded error codes, not admitted writes. A FAIL event stops
   testing and requires independent inventory inspection; never clear the fence.
10. Click Probe captured original ID token. This direct server read uses the token
    captured before deletion, without refreshing it. A 403/PERMISSION_DENIED while
    fenced differs from a 401/UNAUTHENTICATED response; neither is relabeled.
11. Click Attempt forced Auth refresh and record its accepted/rejected outcome.
    Refresh failure may sign out the online SDK context and end its listener.
    Captured-token direct reads remain possible while the local process retains the capture.
12. Keep the local harness process running through the trusted 4,200-second window. Repeat
    captured-token probes near expiry and after the trusted retirement deadline;
    obtain independent server-time/job/inventory verification. Local clock comparison
    is advisory, not proof of token expiry or retirement eligibility. No fake clock.
13. Download sanitized observations after the first probes and again after the
    window. A reload ends the original SDK clients and clears the page event log.
    It can recover the read probe using the same tab and local process.

## Scope and explicit limits

A queued create batch sent before cleanup would target existing base records and
be an intrinsically forbidden update. The standard run disconnects the client before deletion and queues recreation
after the trusted removal milestone. The empty-workspace variant below queues
before admission. A request already traveling to Firestore needs separate evidence.

The profile listener is established before deletion, but observations alone do not
prove a platform-wide bound for every stream or delayed request. This harness never
assigns overall T7 success. It does not retire controls and cannot prove behavior
after fence removal. Unknown/unclassified outcomes are not accepted as passing.
Test each phase's actual authorization layer, preserve all fences, and review evidence
before any separately authorized retirement canary or implementation change.

## Local validation

The production Rules suite tests the same base batch helper: real successful create
before fencing, then denied offline recreation after administrative emulator cleanup,
with no old profile recreated and the control retained. This is synthetic loopback
evidence only; no user account is deleted by those tests.

```powershell
node tools/run-provisioning-stage-probe.mjs --production
```

6 November 2026 preparation: 103 Rules/adapter/provisioning tests passed; harness
TypeScript, lint, and browser prerequisite guard checks passed. Initial project
TypeScript checking caught the Rules test library's compat/modular type mismatch;
the test now explicitly adapts that typed boundary, and project checking passes.
No cloud baseline, provider run, queued cloud write or retirement is claimed yet.

## Recovery after a page reload

Arm transfers the original token to the same-origin loopback harness process.
Only a random run identifier is kept in browser session storage. The endpoint
accepts requests from localhost:5182, binds the capture to the original UID and
restricts the upstream request to its profile document. It returns status and
bounded error codes without returning the token or document contents. The process
releases the capture two hours after token expiry or when the user clicks
**Release captured token and reset page**.

If the same tab reloads, look for `capture-reference-restored` and
`recoveredProbeOnly: true`. Use **Probe captured original ID token** and export the
new observations. Collect the baseline, listener and queue logs before any reload
because the recovered page only supports the read probe. A server restart, closed
browser session or cleared session storage can make the capture unavailable.
Vite auto-reload is disabled. The cause of the earlier in-app browser refreshes
remains unknown.

7 November 2026 synthetic browser validation recovered the same capture after
two reloads and preserved stubbed 403 and 401 responses separately. The test also
confirmed foreign-origin denial, disabled SDK actions in recovery, sanitized
response output and explicit capture release. This is a harness recovery test.
The real after-expiry Firebase observation remains pending.

## Pre-fence queued write variant

This variant tests a valid initialization batch already pending locally when the
fence is admitted. Use a new Auth UID from the same disposable provider identity.
Start in the harness before QC creates the workspace. The previous live run and
the local Rules test establish the positive baseline for this exact batch shape.

1. Connect both clients with the same new disposable UID. Leave the workspace empty.
2. Click **Arm and queue base before fencing (empty workspace)**. The harness checks
   that both clients see absent base records and fence, disconnects the offline
   client and queues the base batch. It verifies the local snapshot shows pending
   writes and the server still shows absent base records and fence.
3. Confirm `pre-fence-queue-confirmed` and `queueTiming: before-fence`. Export the
   observations and keep the page open. The queue resides in this page's SDK client.
4. In QC, finish normal setup and submit deletion. Watch the accepted job, inspect
   the exact target and authorize its operator run. QC's setup is independent of
   the disconnected client.
5. Once the operator verifies empty data and Auth absence, and the harness shows
   `removed: true`, click **Reconnect queued client**. Confirm the resulting
   `queued-write-rejected` has `timing: before-fence`. Inspect the old inventory
   and fence after replay. There is no need to create a second queue for this run.

The local test checks the queued write is pending before admission and returns
permission-denied when replayed after admission. It keeps the old Auth context
valid and the base records absent to isolate Rules denial from credential expiry
or update constraints. The cloud variant waits for cleanup before reconnecting
because QC provisions the records in between. Keep this evidence separate from
requests already sent to the server before admission and from retirement behavior.

## Live overlapping commit variant

This separate mode uses a disposable, empty workspace so the four-record base
create can compete with real deletion admission without duplicate updates. Reuse
the provider identity from a completed disposable run and obtain a new UID in the
harness. Keep QC closed for this identity. Connect both clients and leave both
connected. The second client supplies the independent writer credential.

1. Open **Live overlapping write and deletion request**. Type `DELETE` and click
   **Verify provider for deletion**. Use the exact same linked account in the popup.
   The in-memory client verifies the provider, UID and fresh Auth claim.
2. Confirm `overlap-provider-proof-ready`. Click **Send base write and request
   permanent deletion** once. This sends a single atomic REST Commit with create
   preconditions and the existing deletion request adapter with fresh proof. The
   disposable workspace must still be empty and the server policy compatible.
   The local process captures the writer token and the job listener starts before
   dispatch. Keep the process running for the later expiry probe.
3. Export the log when both outcomes arrive. Share the exact UID/job and both
   events before operator execution. In particular, an unknown result requires
   independent inspection before any further mutation. Do not click submit again.
4. Read the exact fence and inventory while state is requested. If the write won,
   verify the four records are discoverable and compare its commitTime to the
   fence's initial server updateTime. If the fence won, require permission-denied
   and an empty inventory. A failed precondition or network failure is inconclusive.
5. Authorize operator cleanup of that exact UID/job separately, then independently
   confirm Auth and inventory absence. Keep the fence awaiting_retirement.

The request log records dispatch and acknowledgement timing. It cannot control
Firestore's internal scheduling or guarantee which operation wins. A pending
response alone does not prove the server was still processing the write. The REST
batch is atomic and uses server-time transforms. [Firestore Commit API](https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/commit).

The exact REST payload passed against loopback Rules both without a fence and
with a fence. The browser prerequisite guard also passed. Live credentials and
an observed live outcome are still required for the cloud evidence.

## Fence-first transport variant

A second loopback process on port 5184 keeps the ongoing capture on 5182 available:

```powershell
node tools/t7-safety/serve.mjs --fence-first
node --test tools/t7-safety/held-commit.test.mjs
```

Open http://localhost:5184/tools/t7-safety/index.html in a separate tab. Repeat the
live overlap setup with a new disposable UID, both clients and an empty workspace.
The overlap panel identifies fence-first relay mode. The explicit DELETE and
provider proof requirements are the same. Use the same submit button once.

The relay sends the REST Commit headers and all but the last byte of its JSON body
before the browser submits the intent. It records `live-commit-partially-sent`.
It independently reads the exact requested fence with the captured writer token
before sending the last byte. It records `live-held-commit-response`, including
whether the full body was sent, the fence timestamp and the bounded HTTP result.
The relay allows one held commit per capture and bounds it to 30 seconds. A missing
or mismatched fence prevents release. If the relay fails, inspect the exact job
and inventory before attempting any further mutation.

The expected live result is fullBodySent=true and HTTP 403 PERMISSION_DENIED with
an empty old inventory before cleanup. This tests a request in transit whose body
completes after admission. It does not measure a fully delivered request already
being processed by Firestore before the fence. The synthetic loopback transport
test confirmed partial body arrival, wrong-job rejection, exact fence validation,
and complete body delivery only after release. Typecheck, lint and browser guard
checks passed. Live fence-first evidence awaits the interactive run.

## Retirement canary capture

### Capture with a valid write baseline

For post-retirement write verification, start with a fresh disposable provider
sign-in in the harness before opening QC for that identity. Connect the online
client with its exact new UID. Click **Capture token and create write baseline
(empty workspace)**. The harness first checks absence of the base documents and
fence, captures the original token, then sends the four-record initialization
commit using that token. Require `captured-token-write-baseline` with HTTP 200
and status OK. An error or ambiguous response requires independent inspection.
The process permits one baseline attempt per capture.

Open QC with the same identity, finish workspace initialization and request
deletion. Enter the accepted job UUID and watch it in the harness. Cleanup and
retirement follow the exact-job review and authorization process. Supply the
new capture expiry and cutoff and verify the operator's trusted absence anchor
and deadline. The pinned November 8 retirement plan expired and must be updated
and reviewed for the new exact job.

After expiry and the trusted retirement deadline, probe the original token's
server read with the fence present. After separately approved retirement and
independent absence checks, click **Probe captured original ID token (write after
approved retirement)**. Require HTTP 401 UNAUTHENTICATED, then independently
verify empty old inventory, absent old Auth/control and matching comparison
workspace fingerprints. Download sanitized observations before releasing the
capture. The write uses the same four-record payload and create preconditions
as the successful baseline. The process requires an accepted baseline and local
token expiry and allows one later attempt. The operator must establish actual
retirement separately. The probe does not check retirement itself.

Keep the local process alive throughout. A same-tab reload can restore the
capture reference and write probe, but a process restart loses the token. Record
the cutoff before cleanup and complete both retirement and the write probe before
it. Avoid another test run until local validation is complete.

Local harness validation:

```powershell
node --test tools/t7-safety/token-probe.test.mjs tools/t7-safety/held-commit.test.mjs
npm.cmd run typecheck
```

This mode prepares the original-token observation without repeating the queue or
write-race cases. Use an initialized disposable workspace on a fresh UID. In the
5182 harness, release any previous capture to reset the page. Connect only the
online client for the exact disposable UID. Click **Capture token for retirement
canary (ready workspace)**. It checks server profile and initialization records and
absence of the fence before capturing the token. `canary-capture-ready` includes
`captureEndsAt`. Click **Probe captured original ID token** for an HTTP 200 baseline.

Submit intent through QC only after that baseline. Watch the job using its exact
UUID and separately authorize its cleanup. After removal, compare the trusted
retirement deadline with `captureEndsAt`. Keep the local process running and take
both required observations before that cutoff. A reload can recover the read probe
using the same tab. This mode does not retire the control. The next review is in the
[retirement canary plan](../../docs/slices/05A-delete-account/retirement-canary.md).

If the disposable intent is already `requested`, enter the exact job UUID before
clicking **Capture token for retirement canary**. The harness verifies that the
same original token receives HTTP 200 on its exact requested fence while Auth
still exists. A subsequent profile probe should return HTTP 403. This records a
post-intent, pre-Auth-removal baseline for that token. It does not claim an
unfenced profile read, and it avoids recreating the disposable account merely to
repeat intent admission. Cleanup remains a separately authorized operation.
