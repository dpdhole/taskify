# Slice 5A — Technical implementation contract

5 November 2026. Contract **DA1**, request/control schema **1**, inventory **1**,
operator policy **1**. Implements the [accepted preparation](05A-delete-account.md#accepted-implementation-preparation--5-november-2026).
This is the implementation target, not executed Rules, provider, cleanup or
retirement evidence. All operations use the default Firestore database and existing
Firebase project; no hosted runtime, scheduler or new cloud resource is selected.

## Constants and authority

| Constant | Value / rule |
|---|---|
| Recent authentication | 300 seconds inclusive; future auth_time rejected |
| Job/run identifiers | Lowercase UUID v4; independent jobId and runId |
| Lease duration | 120 seconds; renew before each destructive transaction |
| Cleanup transaction | At most 100 application document deletes plus one control update |
| Transaction retries | At most 5 SDK attempts; callbacks have no external side effects |
| Discovery | Sequential traversal, one collection listing/query at a time; no global collection-group sweep |
| Auth deletion calls | One invocation at a time for an exact UID; never inside a Firestore transaction callback |
| Retirement interval | 4,200 seconds (one-hour token lifetime plus ten-minute margin), anchored as specified below |
| Candidate application | 0.3.0; compatibility format 1, revision 3, serverRelease 3, min/max app 0.3.0 |
| Firebase target | taskify-dev-dpdhole / project number 243252492098; database (default) |

The interval is a selected engineering bound, not a claim of verified platform
behavior. Retirement remains disabled until gate T7 below passes. If platform
evidence cannot support this bound, retain fences and revise this contract before
release; do not silently extend a timer or claim completion. Release numbers assume
the current revision2/serverRelease2 baseline; abort on drift and prepare a reviewed
monotonic replacement rather than overwrite a newer policy.

No custom-token minting, UID import/reuse, administrative creation of a deleted
UID, privileged workspace writers or concurrent out-of-band data modification is
part of supported operation. These violate the retirement/quiescence assumptions.
No fixed retention maximum is promised. Each destructive invocation needs explicit
authorization for its target. Inspect is read-only; implementation is not execution
authority.

## Request and control schema

Exactly one document: `accountDeletion/{uid}`. The path binds the subject; no email,
provider subject, display name, credential, raw token or task content is stored.
All timestamps are Firestore timestamps; authTime is integer Unix seconds. Reject
unknown fields, unsupported versions, malformed UUIDs and invalid combinations.

The browser creates exactly these fields, all immutable thereafter:

| Field | Exact initial value / validation |
|---|---|
| schemaVersion | 1 |
| inventoryVersion | 1 |
| operatorPolicyVersion | 1 |
| admissionRevision | Current runtime/compatibility revision; DA1 requires revision >= 3 and serverRelease >= 3 |
| jobId | UUID v4 generated once for this confirmation attempt |
| state | requested |
| requestedAt | serverTimestamp(), equal to request.time |
| authTime | Equal to signed request.auth.token.auth_time |
| proofProvider | google.com or microsoft.com; equal to signed firebase.sign_in_provider |
| recordVersion | 1 |
| updatedAt | serverTimestamp(), equal to requestedAt |

Trusted-only optional fields, with no other additions:

| Field | Meaning / constraints |
|---|---|
| leaseGeneration | Integer >= 1, increases exactly once per acquisition/takeover; never decreases |
| lease | {runId: UUID v4, generation: leaseGeneration, expiresAt: timestamp} |
| authCreatedAt | Timestamp parsed from authoritative Auth metadata.creationTime; pinned before cleanup |
| pauseCode | One of inventory-unsupported, data-invalid, project-mismatch, auth-changed, auth-uncertain, verification-failed, permission-denied, unavailable, policy-unsupported |
| dataVerifiedAt | Trusted server timestamp after full empty traversal |
| authAttempt | {runId: UUID v4, generation: integer}; durable external-operation latch |
| authAbsentObservedAt | Server timestamp committed only after authoritative Auth absence |
| retireNotBefore | authAbsentObservedAt + 4,200 seconds, filled after reading its resolved timestamp |

Do not persist cumulative counts or paths: interrupted progress is represented by
state and authoritative re-enumeration. Command output may report aggregate counts
by known family without contents or document IDs. Every trusted update increments
recordVersion exactly once, sets updatedAt to server time and preserves immutable
admission fields. Successful recovery removes pauseCode; errors never advance state.
State requested may have a lease during admission validation; authCreatedAt is
required before entering cleaning. authAttempt exists only from auth_deleting
onward and is immutable thereafter. Earlier timestamps remain present in later
states. Unknown state/field combinations block both operator mutation and browser
progress decoding; the mere document existence still fences the workspace.

Required combinations: requested has no dataVerifiedAt/authAttempt/absence/deadline;
cleaning adds pinned authCreatedAt; data_verified additionally requires dataVerifiedAt;
auth_deleting additionally requires authAttempt; awaiting_retirement additionally
requires authAbsentObservedAt and may temporarily lack retireNotBefore until the
resolved anchor is read. authCreatedAt <= requestedAt <= dataVerifiedAt <=
authAbsentObservedAt where those fields exist. Lease renewal preserves generation;
acquisition after expiry/release increments it. No expiry permits clearing the fence.

## Browser admission and Rules

1. Require compatible session, connectivity, server-verified linked-provider list,
   typed DELETE and explicit confirmation. Permit partial workspace initialization.
   Capture UID, session epoch, provider, jobId and a new attempt nonce.
2. Reauthenticate in an SDK-owned proof Auth context using popup or redirect.
   Require operationType reauthenticate, matching providerId, unchanged original
   UID/epoch and matching proof-context UID. Request provider account selection
   where supported, without claiming that a provider must prompt for a password.
3. After proof, transfer the SDK-owned proven user into the shared primary Auth
   with updateCurrentUser only while original UID/epoch still match. Force-refresh
   that primary user's ID token. Verify signed claims locally for diagnostics and
   wait for shared session/compatibility admission to settle before submission.
   Rules are authoritative. Never treat refreshing the pre-proof user as proof.
   The controller must tolerate this expected same-UID token transition while
   revoking write readiness until the shared session settles; it must not confuse
   it with an account switch or retain authority after an actual epoch change.
4. Redirect correlation stores only version, UID, epoch, nonce, jobId, provider and
   typed-confirmation intent in sessionStorage; SDK persistence owns credentials.
   On return require the stored correlation and actual successful SDK result.
   Re-check confirmation context and admission. Missing/expired/mismatched proof
   returns to confirmation; markers alone never authorize intent. Clean proof Auth
   contexts after safe transfer or failure. Logout/account switch invalidates work.
5. Submit a transaction that server-reads the control: absence permits create;
   same jobId means reconcile accepted intent; a different existing job means enter
   that account's recovery without overwriting it. Once submission begins, do not
   promise cancellation until a server result settles the outcome. Offline/timeout
   stays uncertain. On refresh, check the fence before provisioning.

Rules permit own-document get, deny list/update/delete, and permit create only if:

- request.auth.uid equals the path UID, the token audience matches environmentId,
  and the current compatibility family permits schema1 writing with revision and
  serverRelease satisfying DA1. No client-supplied version string grants authority.
- Exact initial keys/types/values above match; admissionRevision equals the current
  contract revision, requestedAt and updatedAt equal request.time.
- auth_time is an integer; `timestamp.value(auth_time * 1000) <= request.time` and
  `request.time <= timestamp.value(auth_time * 1000) + duration.value(300, 's')`.
- Signed firebase.sign_in_provider equals proofProvider, and signed
  firebase.identities contains a nonempty list for that provider. Missing/malformed
  claims deny. Neither email presence nor email matching is required.

This proves recent supported-provider authentication, not that a modified client
typed DELETE or performed a deletion-specific ceremony. No browser-only design can
give Rules that stronger assurance. A recent sign-in also satisfies the trusted
claim condition; the supported UI always performs explicit deletion confirmation
and reauthentication. The operator relies on admitted intent, not raw proof tokens.

All application read/write paths retain existence-based fencing. Every application
write also checks post-commit fence absence with !existsAfter so a batch containing
intent plus provisioning cannot bypass the boundary. Writes and request admission
must not be authorized by broad overlapping matches. Same-commit and simultaneous
commit races require integration/cloud evidence. All future mutations inherit this
guard. Protected defaults remain browser-undeletable; only the trusted operator
removes them. Failed/missing status reads cannot be interpreted as fence absence.

## Inventory and discovery algorithm

Allowed materialized records under `users/{uid}`:

| Relative document path | Supported shape |
|---|---|
| profile/main | Profile schema1 |
| settings/main | Settings schema1 |
| categories/{id} | Category schema1, actual arbitrary valid record IDs |
| locations/{id} | Location schema1, actual arbitrary valid record IDs |
| views/{id} | View schema1, actual arbitrary valid record IDs |
| initialization/workspace | Initialization schema1/template1 |
| initializationStages/{id} | Stage receipt schema1/template1; known Slice5 stage IDs |
| nameKeys/categories/keys/{digest} | Reservation schema1; lowercase 64-character SHA-256 ID |
| nameKeys/locations/keys/{digest} | Reservation schema1; lowercase 64-character SHA-256 ID |
| User root or nameKeys/categories, nameKeys/locations | Absent or empty container document only |

Reuse the implemented persisted codecs for supported application shapes; do not
restrict enumeration to seed IDs. A nonempty container, different singleton ID,
unexpected child collection, unsupported shape/version or family blocks cleanup.
Unsupported-data recovery requires a reviewed inventory extension or separately
authorized orphan procedure; no force/ignore-unknown switch exists.

Use server DocumentReference.listCollections and CollectionReference.listDocuments
recursively from the exact user reference, inspect actual snapshots, and descend
through missing documents. listDocuments includes references with subcollections
but missing parent data; ordinary queries alone are insufficient. Do not use blind
recursiveDelete/BulkWriter. The SDK may buffer a collection listing; the 100-delete
bound is a write bound, not a claim of constant-memory discovery. Reassess traversal
when later slices introduce high-volume families; report costs without speculative
product data caps.

Perform a complete discovery/validation pass before deleting anything, then
re-enumerate in deterministic depth-first child-before-parent order in batches.
Before each transaction, enumerate candidate paths; inside the transaction read
the control and all candidate snapshots before writes, revalidate path/shape and
lease, delete at most 100 existing documents and update the control atomically.
Never delete the control in a cleanup batch. Retry restarts validation. An independent
full traversal, including missing parents and nested collections, establishes
emptiness. Unknown additions at any point pause. No later application family may
ship without a matching inventory version/operator and regressions.

## State transitions and recovery

| State | Permitted next action / transition |
|---|---|
| requested | Validate admission, Auth UID/creation time and full inventory; acquire lease; enter cleaning |
| cleaning | Delete bounded batches; verify empty traversal; enter data_verified and set dataVerifiedAt |
| data_verified | Recheck emptiness, Auth identity fingerprint and lease; atomically enter auth_deleting with authAttempt |
| auth_deleting | Single external Auth deletion/reconciliation; confirmed absence permits awaiting_retirement |
| awaiting_retirement | Record resolved retirement deadline; explicit retire after prerequisites; remove control |
| Control absent after retirement | Terminal; no persistent completed job/audit record |

Auth lookup missing before the normal auth_deleting boundary is an orphan condition:
pause with auth-uncertain and require a separately authorized reconciliation path.
Never interpret it as proof of application cleanup. A failed operation leaves the
last state and fence, optionally setting pauseCode. Graceful exit releases lease
only if runId/generation still match. No client authorizes transitions or completion.
The browser displays requested as awaiting operator; cleaning as cleanup in progress;
data_verified/auth_deleting as finalizing account; awaiting_retirement as account
removed only if that authoritative state is actually readable. After Auth loss,
use session recovery; no public job lookup and no inference of completion from errors.

Lease acquisition/renewal uses a server transaction reading the control. Compare
expiresAt against the server snapshot readTime, not the workstation clock; set
expiry to readTime + 120 seconds. Every cleanup/state transaction reads and checks
the same lease generation and updates the control, so takeover conflicts/retries
cannot allow an old generation to commit deletes. A successful old transaction
serializes before takeover; a stale callback cannot commit after it. No network
Auth calls, console prompts or discovery walks occur inside transaction callbacks.

Firestore and Auth do not share a transaction. In auth_deleting the durable
authAttempt latch forbids automatic expiry-based takeover of Auth work. Before
starting the call, recheck exact Auth UID/creation time; a mismatch pauses auth-changed.
Set the Auth HTTP operation deadline to 60 seconds, disable application-level
automatic retry, and retain the latch on unknown outcome. Never retry from a stale
lease callback. A fresh resume may inspect state but must not invoke deletion while
the previous call/process might still run. Recovery requires explicit operator
attestation that the prior run is stopped and its in-flight call has settled or
been reconciled; a local timeout alone does not prove remote cancellation. Persist
the new lease generation before any recovery operation. This is a manual safety
boundary, not an exactly-once Auth guarantee. Check authoritative Auth absence before
any retry; if identity exists with a different creation time, stop. Distinct UID B
is never looked up or deleted. Auth deletion cannot be hidden inside automatic SDK
transaction retries.

After Auth lookup confirms absence, transactionally commit authAbsentObservedAt
with serverTimestamp and state awaiting_retirement. Reading its resolved value
then permits filling retireNotBefore. Crash before this write means a fresh absence
lookup and a later server timestamp; never reconstruct an earlier time. Crash after
the write preserves the anchor. Retire always recomputes and checks the deadline,
so a missing/mismatched field cannot shorten retention.

## Retirement safety and independent registration

Retire is a separate explicit invocation. It requires DA1/T7 evidence, supported
inventory/policy, no unresolved Auth attempt, current lease, trusted server readTime
at or beyond authAbsentObservedAt + 4,200 seconds, Auth still absent, and another
full empty traversal. Final control deletion is transactional and verifies the
unchanged job/state/lease/anchor. Under the validated quiescence assumption, no
privileged writer or old authenticated writer can insert between traversal and
retirement. If this cannot be established, do not retire. A new user registration
under UID B neither advances nor blocks A's job and cannot read it.

The bound assumes deletion prevents new token refresh for A, pre-deletion ID tokens
expire within one hour, expired/stale streams cannot authorize later writes, and
queued/in-flight writes cannot escape expiry/fence enforcement. The extra ten
minutes is a conservative operational margin, not a documented bound on arbitrary
platform propagation. Gate T7 must verify the applicable behavior; unsupported
behavior leaves the temporary fence retained for operator action.

All old browser callbacks/listeners/writes remain UID/session-bound. B is admitted
only through ordinary compatible session plus server-confirmed absence of B's
fence. Matching email/provider identity does not copy data, markers or links. A's
empty data with existing Auth never authorizes reprovisioning. Unexpected recreation
of A blocks retirement and requires investigation; never automatically delete the
unexpected identity or use email to find a substitute target.

## Tooling, commands and release

Implement a separate `tools/account-deletion/` Node package with its own exact
dependency pins/lockfile and no import into browser source. Select compatible stable
firebase-admin and Firestore SDK versions at implementation, record their exact
versions and verify supported traversal/timeout behavior before code acceptance.
Use the project-pinned Node toolchain. ADC may use approved local service-account
impersonation; never place service-account keys in the repository or browser.

Minimum runtime permissions: Firestore entity get/list/create/update/delete for
transaction/control operations, Firebase Auth users get/delete, and project metadata
get for exact ID/number verification. No Auth create/update/token-mint, deployment,
Rules publication, billing or IAM administration is required by the finalizer.
Actual Firestore IAM scope is database-level, not a promise of per-UID restriction;
the code's exact-target checks are mandatory. Credential provisioning is a separate
operator setup action, not performed by script creation. Refuse non-default database,
project mismatch, missing metadata permissions or mixed cloud/emulator endpoints.

Command contract (all require --project, --project-number, --uid and --job-id):

- inspect: read-only admission/inventory/Auth/state check and aggregate preview.
- execute --confirm-job <jobId>: requested jobs only; explicit destructive start.
- resume --confirm-job <jobId>: unfinished processing; awaiting_retirement reports
  the deadline and exits without retiring. auth_deleting additionally requires
  --reconcile-auth --prior-run-stopped and the attestation described above.
- retire --confirm-job <jobId>: awaiting_retirement only; no cleanup/Auth deletion
  side effects if prerequisites fail. Separate command avoids accidental retirement.

No --force, email targeting, bulk account mode or automatic scheduling. Output is
content-free structured status; explicit target identifiers are operational input,
not a permanent audit store. Exit codes: 0 command/milestone verified, 2 invalid
arguments/unsupported policy, 3 safely pending/busy/not-yet-due, 4 reconciliation
required, 5 infrastructure/permission failure. Retire with an already absent control
reports control-absent/unverifiable history, not invented full-completion proof.
Re-running execute/resume against absence cannot create a new job. Operator final
evidence is a transient result supplied to the operator, not another cloud record.

Candidate app0.3.0 adds accountDeletion readableSchemas [1], writeSchema 1. Other
families keep their existing schema policies. Keep deletion request creation
disabled while runtime serverRelease < 3. Coordinated authorized publication:
deploy DA1 Rules first (create still disabled by old policy), publish revision3/
serverRelease3/app0.3.0 bounds using expected-revision2 compare-and-set, then publish
the reviewed client. Validate candidate policy against all consumed families.
Rollback preserves DA1 fence/admission/recovery semantics and the 0.3.0 floor; use
a compatible recovery artifact, never restore 0.2.0 as an admitted writer or erase
pending jobs. Rules alone cannot authenticate an app-version string; old-client
safety depends on enforced schema/fence checks, not the UI version gate.

## Required evidence before acceptance

| Gate | Required evidence |
|---|---|
| T1: schema/admission | Strict codecs; exact keys/claims; five-minute inclusive edges and future time; missing email; cross-UID and forged fields; server timestamp/revision checks |
| T2: proof/session | Real Google/Microsoft personal popup and mobile redirect; same UID/provider; token transfer into shared Firestore; account switch/Logout; expired/cancelled proof; Slice4 hold preserved |
| T3: request/fence | Lost acknowledgement and duplicate requests; partial setup; same-batch provisioning+intent; racing tabs/writes; failed status reads; old clients blocked |
| T4: inventory | Non-seed IDs; nested reservations; absent parents; empty containers; unsupported data/version; full independent final traversal; no cross-UID discovery |
| T5: operator | Failure between every transition; bounded transaction retry; concurrent leases; stale generation commits; permission/project mismatch; Auth latch/manual recovery and unknown outcomes |
| T6: registration | Same provider before/during/after Auth deletion; distinct B during A retention; formerly linked methods/conflicts; no old state leakage; resume/retire A leaves B untouched |
| T7: retirement | Official lifecycle basis plus authorized real Firestore stale-token, expired-stream, queued/offline/in-flight write checks; Auth refresh denial after deletion; trusted anchor/crash recovery; no unsafe early retirement |
| T8: release | Bundle credential exclusion; exact dependencies/permissions; Rules expression/request budgets; deployment ordering, monotonic compare-and-set, rollback and usable recovery UI |

Local/emulator tests establish orchestration, not real provider/token-expiry/cloud
semantics. No account is deleted to produce this document. Any failed proof requires
a contract revision or retained fence, not an unverified completion claim.

## Platform basis checked 5 November 2026

- [Auth sessions](https://firebase.google.com/docs/auth/admin/manage-sessions):
  ID tokens last one hour; deleting a user expires its refresh tokens. This informs
  the selected bound, but does not validate this application's retirement path.
- [Rules request](https://firebase.google.com/docs/reference/rules/rules.firestore.Request)
  and [timestamp conversion](https://firebase.google.com/docs/reference/rules/rules.timestamp):
  signed identity/request time and epoch-millisecond conversion support admission.
- [Transaction isolation](https://firebase.google.com/docs/firestore/transaction-data-contention):
  commit-time serializability supports atomic lease/control/delete batches, not an
  atomic Auth side effect.
- [Rules existsAfter](https://firebase.google.com/docs/reference/rules/rules.firestore):
  post-write existence checks prevent same-batch request/provisioning admission.
- [CollectionReference.listDocuments](https://docs.cloud.google.com/nodejs/docs/reference/firestore/latest/firestore/collectionreference):
  discovery includes document references whose data is absent but children remain.

These are source constraints. T1–T8 remain unexecuted for DA1.
