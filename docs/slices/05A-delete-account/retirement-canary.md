# Slice 5A retirement canary review

Prepared 8 November 2026. Cloud retirement remains disabled. This review covers
one prospective disposable job and does not authorize execution.

The [T7 record](t7-verification.md) includes live before-fence queued replay denial,
write-first cleanup, and fence-first denial when a partially sent request completes
after admission. A recovered original token returned 401 after expiry and the safety
window in earlier runs. The transport test does not cover a fully delivered write
already processing at the service. No previous capture remains available for a
before-and-after fence-removal comparison. The prior write-denial tests need no repeat.

## Operator review

The existing retirement candidate runs only on the checked loopback adapter.
It verifies supported policy, exact job, awaiting_retirement, resolved timestamps,
the recomputed 4,200-second deadline, empty inventory and absent Auth. It obtains
an exact-job lease and repeats inventory discovery. It now stops lease renewal
before the final Auth lookup. The final transaction verifies the owned lease and
unchanged job, state, Auth attempt and trusted absence anchor before deleting the
control. Read-back verifies control, Auth and inventory absence.

The final Auth lookup and Firestore deletion are separate service operations.
The gate relies on quiescence for the old UID, including no privileged recreation
of its Auth identity or writes. A failed or ambiguous response requires read-back.
An already absent control does not establish that this invocation retired it.
The emulator covers early refusal, reappearing Auth/data, stale worker refusal,
fresh-UID preservation and a synthetic eligible retirement. A cloud candidate
needs reviewed exact-target enablement. The standard cloud retire command stays
disabled. No force option, blanket enablement or manual control deletion is proposed.

## Prepare one canary capture

1. Reuse the disposable provider identity from a completed test and finish normal
   workspace setup in QC. Confirm the new UID is distinct from all prior targets.
2. Use the [capture-only harness](../../../tools/t7-safety/README.md#retirement-canary-capture)
   and verify the original token can read its own profile with HTTP 200.
3. Submit the usual deletion intent in QC. Watch the exact job in the harness.
   Provide the UID/job for read-only inspection and separately authorize cleanup.
4. After verified removal, keep the same local process alive. Record the original
   token expiry, capture cutoff and the trusted retirement deadline. Probe after
   the deadline and before the cutoff. Verify the 401 while the fence is present.
   Capture-only mode deliberately avoids rerunning the offline/overlap exercises.
5. Before any live fence removal, review and authorize a single exact target and
   review the post-removal client probes. Verify the live rules/policy identity,
   captured token availability, server time, empty inventory, Auth absence,
   current control fields and no competing worker. Pin the approved project, UID,
   job, trusted absence anchor and deadline in the proposed canary invocation.
6. Establish a distinct fresh workspace and record its full inventory hash and
   Auth fingerprint. The old job is the sole retirement target.
7. Once a reviewed guarded canary is separately authorized and executed, verify
   old control, Auth and inventory absence. Probe the same captured original
   token after removal and verify a valid old-namespace create is rejected.
   Compare the fresh workspace inventory/Auth fingerprint. Preserve sanitized
   evidence and stop on unexpected admission or uncertainty.

The before/after token observation and fresh-UID comparison are the distinct
canary deliverables. A token capture that has been released or expired out of local
retention cannot supply them. Elapsed time and a successful emulator test do not
alone permit a live retirement. A successful canary would be evidence for its
exact scenario and would not automatically enable general cloud retirement.

## Selected disposable job and capture

The selected job is ad03bc4d-b30d-4d6e-829e-4f1deefb361a for UID
7FEqFTYFVgW5jR7L5bgxymF9SR12. The owner supplied an HTTP 200 read of its exact
requested fence using the captured original token before Auth removal. The
capture followed intent admission, so the positive baseline is the fence read.
The authorized operator removed the 78-record inventory and Auth. [Read-back](retirement-canary-post-cleanup-evidence.json)
confirmed empty inventory, Auth absent and the retained awaiting_retirement fence.

On 8 November 2026 the trusted absence anchor was 09:26:46.359 IST, original token
expiry 10:23:58 IST, the retirement deadline 10:36:46.359 IST and the local capture
cutoff 12:23:58 IST. The before-removal expiry probe must be captured after the
retirement deadline and before the cutoff. The fence still requires its own
review and explicit execution authorization.

## Exact live canary prepared for review

On 8 November the owner recovered the original token and received 401
UNAUTHENTICATED at 10:40:46.448 IST while the fence remained present. This was
after both token expiry and the trusted 10:36:46.359 deadline. The independent
[read-only preflight](retirement-canary-preflight-evidence.json) confirmed the
pinned DA1 Rules and policy 3, empty inventory, Auth absence and unchanged anchor.
The previously verified fresh UID 3C5SInr1sYYtjyHNy5Qvh9r8UrZ2 serves as an independent
comparison workspace. Its 78-record content hash and Auth fingerprint were read.
The comparison establishes namespace preservation for that workspace. It does not
assume the comparison account shares the canary provider identity.

The reviewed local candidate adds separate `inspect-canary` and `retire-canary`
commands pinned to the selected project, UID, job, exact absence anchor, deadline,
Rules and policy. The operator rechecks trusted server time and requires at least
two minutes before capture cutoff. It acquires the lease and rechecks inventory,
Auth and the exact control transaction before deleting the fence. It repeats the
comparison read afterwards. The standard cloud `retire` command remains disabled.
The guarded command is for this one live experiment and expires at 12:21:58 IST.
A result with comparisonUnchanged=false or null requires investigation. The fence
may already have been removed when a post-retirement read-back fails.

The exact mutating invocation for separate owner review is:

```powershell
npm.cmd --prefix tools/account-deletion run operator -- retire-canary --project taskify-dev-dpdhole --project-number 243252492098 --uid 7FEqFTYFVgW5jR7L5bgxymF9SR12 --job-id ad03bc4d-b30d-4d6e-829e-4f1deefb361a --confirm-job ad03bc4d-b30d-4d6e-829e-4f1deefb361a
```

The running harness exposes the original-token read probe for this capture.
This scoped canary verifies that same-token read after fence removal, old control/
Auth/inventory absence and fresh-workspace preservation. A live old-token write
probe after retirement is a separate coverage gap. Do not restart the process
holding the capture before exporting the post-removal result. This checkpoint
prepared the command and ran only its read-only preflight. Tests passed for exact
target, deadline and anchor checks, including expiry of the canary window.

## Authorized canary stopped after a crash

On 8 November 2026 the owner authorized retirement of this exact fence. The
local harness became unreachable before execution. The harness restarted on
port 5182 and returned HTTP 200 for its page. The original token was held only
in the previous process's memory, so the restart could not recover the capture.
The earlier 401 remains evidence from before fence retirement.

A read-only Firebase inspection after the crash found the exact fence in
`awaiting_retirement`, with empty workspace inventory and Auth absent. The
retirement command was withheld because the same-token post-retirement probe
could no longer run. A replacement live canary requires a fresh capture and
authorization for its exact job.

## Replacement canary cleanup verified

On 8 November 2026 the owner authorized cleanup and Auth deletion for UID
`ZXx9lu9yVEaBi8RhRmp8TBLbJpL2`, job `cef77432-72ec-443b-bfd8-943abbd2a701`.
The pre-cleanup inspection found a requested fence, 78 workspace records and
matching Auth. The operator reported account removal, and an independent
inspection confirmed empty inventory, absent Auth and a fence in
`awaiting_retirement`.

The owner supplied a successful profile server read during capture. A separate
original-token HTTP 200 probe has yet to be supplied. The original token expires
at 12:01:52 IST. The operator's retirement deadline is 12:15:00.596 IST and the
harness capture ends at 14:01:52 IST. The same-token probe with the fence
present is due after the retirement deadline and before the capture cutoff.

## Replacement canary ready for retirement review

At 12:38:33.803 IST the recovered original capture returned HTTP 401
UNAUTHENTICATED with the fence present, after both expiry and the trusted
retirement deadline. The [replacement preflight](retirement-canary-replacement-preflight-evidence.json)
verified the exact anchor and deadline, empty inventory, absent Auth, pinned
Rules and policy revision 3. It also read the independent comparison workspace
and obtained the same 78-record inventory hash and Auth fingerprint as before.

The guarded command now targets only the replacement job and expires at
13:59:52 IST, two minutes before the capture cutoff. Its proposed scope is
retirement of that fence, verification of old control, Auth and inventory absence,
comparison workspace read-back and a same-token server read after retirement.
The harness supports the read probe. Live old-token write coverage remains open.

```powershell
npm.cmd --prefix tools/account-deletion run operator -- retire-canary --project taskify-dev-dpdhole --project-number 243252492098 --uid ZXx9lu9yVEaBi8RhRmp8TBLbJpL2 --job-id cef77432-72ec-443b-bfd8-943abbd2a701 --confirm-job cef77432-72ec-443b-bfd8-943abbd2a701
```

## Replacement fence retired and original token rejected

On 8 November 2026 the owner authorized retirement of the replacement fence.
The original capture returned HTTP 401 UNAUTHENTICATED at 12:41:48.524 IST
before retirement and again at 12:42:33.836 IST after retirement. The operator
verified absence of the exact fence, Auth and workspace inventory. The independent
comparison workspace retained all 78 records and matched both its inventory
hash and Auth fingerprint before and after retirement.
[Execution evidence](retirement-canary-execution-evidence.json).

The canary establishes live post-retirement rejection for the original token's
server read. A live write with the original token after retirement remains open.
General cloud retirement remains disabled.

## Live write canary preflight on 24 November

The owner reported a four-record baseline accepted with HTTP 200 using the
original token for UID NI96NtWbYzSyepQE9cdP5PnbbEq1. The authorized cleanup and
Auth deletion for job 0c7f0ff6-47b6-4b8d-884f-caffe9da9a0d reached
awaiting_retirement. Independent inspection confirmed empty inventory and Auth
absence. The original token expired at 09:58:50 IST and the trusted retirement
deadline is 10:22:37.697 IST. After a page reload, the recovered capture returned
HTTP 401 UNAUTHENTICATED at 10:29:40.598 IST with the fence present.

The [read-only preflight](live-write-canary-preflight-evidence.json) independently
confirmed the exact anchor and deadline, pinned Rules and policy 3, empty inventory,
Auth absence and the comparison workspace's 78-record hash and Auth fingerprint.
The command is pinned to this exact new job and closes at 11:56:50 IST, two minutes
before capture retention ends. The pin tests and operator typecheck passed.

After separate authorization, execute the following command and check its old
control/Auth/inventory absence and comparisonUnchanged result. Then use the
retained capture's write probe once and require HTTP 401 UNAUTHENTICATED.
Independently recheck the old inventory and comparison workspace afterwards.
The page's baseline=false after reload reflects reset page state. The process
retains successful baseline acceptance with the capture and enforces it for the
write probe. Keep the local process alive through evidence export.

```powershell
npm.cmd --prefix tools/account-deletion run operator -- retire-canary --project taskify-dev-dpdhole --project-number 243252492098 --uid NI96NtWbYzSyepQE9cdP5PnbbEq1 --job-id 0c7f0ff6-47b6-4b8d-884f-caffe9da9a0d --confirm-job 0c7f0ff6-47b6-4b8d-884f-caffe9da9a0d
```

The owner authorized this fence's retirement. The operator verified old control,
Auth and inventory absence and matching comparison fingerprints.
[Retirement evidence](live-write-canary-retirement-evidence.json).
The owner then supplied HTTP 401 UNAUTHENTICATED for the captured-token write
at 10:36:15.115 IST. Independent read-back confirmed zero recreated records,
Auth/control absence and matching comparison fingerprints after the write.
[Post-write evidence](live-write-canary-post-write-evidence.json).
