# Slice4 — Verification visibility recovery correction

Historical visibility checkpoint: the later [checking feedback correction](checking.md) supersedes primary-user reload behavior and adds combined Auth/Firestore coverage.

2 November 2026. Owner reported being stuck at Step3 on the dev preview using
Google in Chrome. Sign-in succeeded; the screenshot showed the signed-in header
claiming compatibility readiness while Sign-in methods remained compatibility-
blocked with unavailable provider status. This is a failure report, not acceptance
of the verification checkpoint or proof that the verification popup returned a
successful SDK result.

## Cause and correction

The production lifecycle suspends the compatibility gate when the document becomes
hidden and rechecks on return. Opening an OAuth provider can trigger that transition.
Sign-in methods previously invalidated proof for every gate revocation, then left
its unavailable projection unchanged when the session became ready again. A normal
provider window therefore could cancel verification and leave contradictory copy.

Current-account identity proof is nonmutating. The correction preserves an in-flight
identity proof across a visibility pause and its resumed server check, including an
initial unverified cached snapshot. It accepts neither provider status nor proof
success while compatibility is unavailable. After both the SDK result and fresh
server readiness, it reloads provider status under new session/compatibility
admission before showing success or wrong-account guidance. It does not reuse the
old protected ticket. Provider completion may occur before or after gate recovery.
An interrupted proof adds one current-account Auth reload after readiness; the
existing contract resume check is unchanged. Recovery does not add polling or
background Firestore queries.

Logout, account switching, Back, disposal, offline/connection failure, incompatible
policy and invalid contract state still invalidate the attempt. A compatibility-
blocked provider-status screen automatically reloads when readiness returns and the
SDK operation has settled; it cannot remain stranded behind the old blocked copy.
If the SDK window is still pending after readiness returns, guidance says that it
is finishing verification rather than claiming compatibility is still blocked.

The visibility exception applies to current-account proof, not mutation submission.
Linking remains disabled; its eventual implementation still requires fresh proof,
current admission at the accepted SDK boundary and outcome reconciliation.

## Regression coverage

The earlier emulator session fixture did not attach the production browser lifecycle,
so popup cases did not exercise hidden/resume behavior. The lifecycle wiring is now
shared by the application and fixture, retaining existing online/offline, pagehide,
pageshow and visibility semantics and disposal cleanup.

New unit checks cover both result/readiness orders, cached server-unverified resume,
hard incompatible/offline rejection, pending-result invalidation and automatic status
recovery. New headless SDK/emulator checks explicitly dispatch hidden/visible events
through the shared production listener for Google and Microsoft: completion before
and after readiness, plus wrong-account guidance. Synthetic visibility events make
that ordering deterministic; they are not real-device or hosted Chrome acceptance.

195 unit/component, 7 integration and 47 headless Chromium checks passed, with all
four builds and static checks; zero browser retries. Execution results, source/build
hashes and commands are in the
[visibility evidence](visibility-evidence.json) and
[execution log](visibility.log). Prior checkpoint evidence is
historical and remains unchanged.

No cloud change, deployment, commit, push or new interactive/provider test is included.
The dev URL still serves clean source05adff6 until an explicit publication request.
The local manual server remains stopped. Owner retest of the corrected hosted build
is required before recording real Google/Chrome verification acceptance.
