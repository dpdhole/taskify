# Slice4 — Provider-status checking feedback correction

2 November 2026. During local testing the owner reported that opening Sign-in
methods repeatedly switched checking/status messages. This followed the visibility
recovery correction and is not verification acceptance.

## Defects and correction

Firebase13.1.0 reload(user) persists the user and notifies Auth listeners even when
the UID is unchanged. The production runtime shares Auth with the Firestore
compatibility listener. Reloading that primary user can therefore revoke/restore
compatibility while a provider read is in progress; automatic recovery starts another
reload and repeats the cycle. The previous session fixture used an in-memory
compatibility reader, so it could not detect this integration failure.

Provider status now reloads an SDK-owned copy of the same user in a separate named
Auth context using inMemoryPersistence and public updateCurrentUser/reload APIs.
The context has no Firestore client or redirect resolver and is deleted after each
request, including errors. Only UID and supported provider names leave infrastructure.
The primary Auth user and its token listeners are not updated by status reads.
Credentials remain inside SDK objects in memory; no application token storage,
manual credential extraction, account creation or REST credential plumbing is added.
The latest validated provider snapshot informs reauthentication eligibility while
original UID/session/epoch and backend proof checks remain required.

Automatic status recovery is limited to one additional read per explicit open or
refresh. Exhausted recovery presents an explicit retry state. Compatible policy
revision changes during a read also end checking rather than silently discarding
the result and cancelling its deadline. Proof completion can retry provider admission
at most twice, with fresh compatibility admission; it cannot poll indefinitely.
Temporary unverified compatibility snapshots during credential refresh pause
nonmutating identity proof until server authority returns, just as visibility resume
does. Offline, invalid/incompatible policy and identity changes still invalidate it.
Provider linking remains disabled.

## Validation and scope

Focused results: 201 unit/component checks, 7 integration checks and 44 headless
browser checks passed, with all four builds and static checks.

New unit coverage checks memory-only isolated lookup and cleanup, primary user
preservation, bounded recovery, stale compatible tickets, and credential-triggered
unverified snapshots. A new emulator browser case uses actual Firebase Auth and
Firestore on one app, matching production ownership. It checks that opening/refreshing
methods settles, does not notify primary Auth or advance compatibility generations,
and makes one account lookup per explicit read. It also exercises Google popup proof
with the real compatibility listener and hidden/resume events.

The manual localhost server stays running. Focused headless checks use separate
ports and do not stop/reuse that process. The full runner assumes its ordinary test port5173 is free. The two
unchanged runner-preflight unit checks and four Foundation browser checks are excluded from
this focused run rather than interrupting owner testing. This is
not represented as a complete verify:all run. Static/layer/format checks and all
four builds are checked separately. Commands, hashes and exact executed counts are
in [checking evidence](checking-evidence.json) and the
[execution log](checking.log).

The earlier visibility evidence remains a historical snapshot and is superseded
for the status-read implementation by this correction. No real-provider acceptance,
cloud changes, deployment, staging, commit or push is claimed. Owner must refresh
localhost once to replace any prior in-memory/HMR instance, then retry Sign-in methods.

Public SDK copy semantics: [Firebase Auth API](https://firebase.google.com/docs/reference/js/auth#updatecurrentuser).
Pinned source reviewed: Auth reload/_notifyListenersIfCurrent and Firestore
FirebaseAuthCredentialsProvider token-change notification handling.


The owner subsequently showed a settled local status screen with Microsoft Linked
and Google Not linked. That screenshot confirms status presentation settled in that
manual attempt, not successful reauthentication or linking. Verify with Microsoft
reconfirms the existing account; Link Google is the subsequent unimplemented action.


## Staged review preparation — 2 November 2026

Owner requested preparing these changes to stage and for a subsequent commit/push.
Source and log hashes still match the final focused evidence. Both correction
snapshots are included; the visibility report remains historical where superseded.
No additional test execution, manual acceptance, commit, push or deployment is
implied by staging. The localhost Auth preview remains running for owner review.
