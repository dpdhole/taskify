# Slice 5A — Delete Account

Status: **implementation in progress, 5 November 2026; domain/inventory/Rules and
operator finalization and browser flow implemented locally; slice unaccepted**. The browser design records confirmed deletion
intent; an explicitly invoked operator script performs and verifies cleanup,
deletes Auth last, and retires the temporary fence after stale-session safety
checks. No hosted backend, permanent tombstone, automatic schedule or execution
of account deletion is approved by this design selection. See the
[implementation checkpoint](05A-delete-account-domain.md) for actual changes and
local evidence. No cloud actions, real deletion, commit, push or deployment occur.

The [operator checkpoint](05A-delete-account-operator.md) adds isolated tooling,
recursive discovery, transactional leases and bounded cleanup through data_verified.
Auth finalization/reconciliation and browser flow remain; retirement is disabled.

The [Auth finalization checkpoint](05A-delete-account-auth-finalization.md) supersedes
that remaining-Auth statement: operator execution now reaches awaiting_retirement,
with one bounded deletion call, durable latch/reconciliation and trusted absence
anchor. Browser proof/request/UI and T7 safety remain; retirement stays disabled.

The [browser checkpoint](05A-delete-account-browser.md) now implements proof/token
transfer, request recovery, authoritative status and the minimal account UI. Local
source/candidate is0.3.0/revision3; deployed dev remains0.2.0/revision2. Real-provider,
redirect/cloud and T7 acceptance still remain; no retirement or release is enabled.

Authority: [Slice5 provisioning](05-workspace-provisioning.md),
[identity policy](../architecture.md#identity-and-account-linking--owner-agreed-policy),
[product specification](../product_spec.md) and [slice plan](../implementation_plan.md).
Deliver after Slice5 and before Slice6, preserving existing slice identifiers.

## Technical contract DA1 — 5 November 2026

The [technical implementation contract](05A-delete-account-contract.md) now fixes
the request/control schema, Rules admission, proof-token transfer, inventory1,
monotonic operator states, transaction-fenced lease/batches, external Auth-operation
latch, retirement anchor, commands and candidate app0.3.0/revision3 rollout.
It supersedes earlier statements that these implementation choices are undecided.
The selected retirement interval is4,200 seconds from trusted Auth absence, with
retirement disabled until platform/cloud gate T7 validates the safety assumptions.
The interval is not a claim of validated behavior or an automatic retention limit.
DA1 is ready as an implementation target; T1–T8 and dependency pins remain execution
evidence work. No Rules, application or administrative implementation occurs here.

## Accepted implementation preparation — 5 November 2026

The owner accepted the readiness recommendations, fresh-registration policy and
subsequent gap evaluation. This section supersedes earlier pending design wording
where applicable. Product policy and implementation direction are settled; exact
serialized contracts and platform proofs below remain engineering gates, not
evidence of working deletion. Slice5 is closed; Slice4 linking remains held.

### Request admission and proof

- Use deletion-specific reauthentication through an already linked Google or
  Microsoft provider; require typed DELETE and unchanged original UID/session.
  Do not assume the unaccepted Slice4 proof implementation is reliable. Validate
  popup and redirect independently without making linking acceptance a dependency.
- Use a five-minute recent-auth admission window, enforced with trusted token
  claims and server time. Refresh the token used by shared Firestore before intent
  submission. Define/test future-time rejection, clock boundary behavior and the
  expressible same-UID/provider checks. Typed DELETE is a UI safeguard, not trusted
  server evidence.
- Create one immutable request with schemaVersion, inventoryVersion, jobId,
  state requested and server-confirmed requestedAt. Additional persisted admission
  evidence must be minimal and validated by Rules; never store credentials/tokens.
  Exact fields and validation expressions must be frozen before adapter/UI wiring.
- Reconcile uncertain submission by server-reading the original job. Do not create
  a replacement job or claim cancellation merely because acknowledgement was lost.
  The operator validates proof at admission time; normal processing delay does not
  expire an already accepted request.

### Inventory version 1

Freeze the initial manifest against the implemented Slice5 schema:

| Family | Owned path relative to users/{uid} |
|---|---|
| Profile | profile/main |
| Settings | settings/main |
| Categories | categories/{id} |
| Locations | locations/{id} |
| Views, including inline order | views/{id} |
| Workspace initialization | initialization/workspace |
| Immutable stage receipts | initializationStages/{id} |
| Name reservations | nameKeys/{kind}/keys/{digest} |
| Actual root/container documents | users/{uid} itself and any materialized containers, if present |

Enumerate actual documents, not only these singleton or seed IDs. Trusted recursive
discovery must find descendants beneath missing parent documents and validate all
discovered paths/schema versions against the manifest. Unknown families or versions
pause before cleanup; unknown additions found during cleanup also pause without
claiming success. Define an explicit recovery procedure rather than silently
deleting unsupported data. Independently enumerate again to prove final emptiness.
The root accountDeletion/{uid} is retained operational control and retired last.
Tasks, descriptions and operation receipts enter the manifest when their feature
slices are implemented; the future-family obligations below remain mandatory.

### Operator state, concurrency and retirement

- Provide inspect/dry-run, execute, resume and retire commands bound to exact
  project ID/number, original UID and job ID. Never resolve mutation targets by
  email/provider lookup or infer authority from a supplied UID alone.
- Use a transactional lease with increasing ownership generation. Every state
  transition and destructive batch must enforce current ownership; checking an
  expiry before an unguarded batch is insufficient. Freeze the concrete fencing
  mechanism, bounded batch size and takeover behavior before executable cleanup.
- Use monotonic stages and retryable cleanup. Counts are informational; resume
  re-enumerates remaining records. Reconcile unknown Auth deletion through trusted
  Auth lookup, retaining the fence across errors and lost responses.
- Start the safety interval at trusted confirmation of Auth absence. A crash before
  recording that confirmation requires a new conservative observation time. Never
  backdate from intent or browser time. Validate the platform-specific maximum
  stale-token authorization lifetime plus a documented margin before fixing the
  numerical interval; a nominal token lifetime alone is not retirement proof.
- Retire only after rechecking Auth absence, data emptiness, job/lease ownership and
  elapsed safety time. No waiting background process is required. If the old UID
  unexpectedly exists again, retain its fence and require investigation; do not
  automatically delete the unexpected identity. Administrative UID reuse is prohibited.

### Fresh registration while deletion is pending

The fence is UID-scoped, not email- or provider-scoped. Account removal and final
control-metadata erasure are distinct milestones. Fresh registration is permitted
after original Auth removal while the old UID's fence remains.

| Authentication result / stage | Required behavior |
|---|---|
| Original Auth still exists, including after data cleanup | Same-provider sign-in returns the old identity; its fence blocks provisioning and ordinary access. Show deletion recovery, Refresh status and Logout. |
| Sign-in races Auth deletion | Trust the returned UID and server-confirmed fence checks. Old UID stays blocked; authentication uncertainty enters session recovery, never speculative initialization. |
| Fresh authentication returns distinct UID B after old UID A removal | Admit a new workspace under B only after normal session/compatibility checks and server-confirmed absence of B's fence. Do not wait for A's fence retirement. |
| Old session/token survives Auth deletion | Keep A fenced through the validated interval; never transfer its callbacks, writes or deletion state to B. |
| Operator resumes/retires A after B registers | Operate only on A and its job; B's identity, workspace and fence are untouched. |

Clear old user-scoped state and stop listeners before displaying B. Bind callbacks
and pending operations to their originating UID/session/job. Matching emails do
not transfer initialization markers, old data, deletion status or authorization.
Do not promise restoration of former provider links: each formerly linked method
follows current identity/conflict/linking policy, with Slice4 acceptance still held.
Auth/listener failure alone does not prove completion. Show session recovery when
uncertain; any completion message must name only the verified milestone. The new
UID cannot read the old job; final retirement evidence remains operator-facing.

### Release and implementation checkpoints

1. Freeze request/progress schemas, state transitions, admission evidence, inventory
   and exact recent-auth Rules checks; prove fresh proof reaches shared Firestore
   through popup and redirect. This is the first technical risk to investigate.
2. Implement domain and trusted tooling with pinned administrative dependencies in
   a separate tooling package. Credentials stay outside Git/browser assets; document
   narrow permissions and exact project verification. Prove concurrent-run fencing,
   bounded cleanup and recovery before enabling destructive commands.
3. Validate Rules/adapters, token-safety retirement and UID isolation; then wire UI.
   Current app0.2.0 declares deletion read capability only and current Rules deny
   browser fence writes. Define the new capability/contract revision and rollout
   bounds; publish validated Rules/compatibility support before exposing creation.
   Preserve read-only recovery across releases/rollback and fence older clients.
4. Prepare the operator runbook for inspect/execute/resume/retire, minimal evidence,
   interrupted recovery and separate account-removal/metadata-retirement milestones.
5. Complete local/emulator fault-injection and browser evidence before separately
   authorized cloud Rules, real-provider and destructive-target verification.

No further product-policy decision is currently identified. Exact schema fields,
lease implementation, numerical token-safety bound, batch limits, permissions and
rollout versions remain engineering work and must be recorded with evidence.
Preparing/implementing tooling never grants blanket authority for account deletion,
cloud publication, commit or push. This documentation instruction starts no code.

### Expanded acceptance and readiness evidence

Add explicit cases for sign-in before/during/after Auth removal; B provisioning
while A remains fenced; operator resume/retirement leaving B untouched; stale tabs
and queued writes against A; each formerly linked provider and provider conflicts;
and crash after Auth deletion before trusted confirmation is recorded. Also cover
unknown inventory, descendants beneath absent parents, concurrent operators, stale
lease holders, partial initialization and lost request/batch/Auth acknowledgements.
Real-provider checks must confirm distinct-UID registration; mocks are insufficient.

Readiness review at source 8dbe29b ran three focused existing suites:
workspace-controller, provisioning-compatibility-readiness and workspace-release.
All 23 tests passed. These support the existing fence/controller/capability baseline
only, not deletion implementation or provider/cloud acceptance. The documentation
update performs no new application tests or cloud actions.

## Approved objective and boundaries (retained scope)

Permanently delete the signed-in Taskify account and its owned application records,
allowing the same provider identities to register again with a fresh workspace.
This deletes the Firebase Auth account and its linked Taskify sign-in methods,
not the Google/Microsoft accounts themselves. A fresh registration does not
promise the former UID, restoration of data or transfer of initialization markers.

Provide a normal user-facing action, separate from Logout, on the minimal
account surface. The owner's two Google and one Microsoft personal test accounts
motivate early delivery; there is no test-only bypass. Apple and Microsoft
work/school testing retain their existing deferrals. Do not delete another UID,
merge accounts, unlink individual providers or add data export/backup as scope.

## Confirmation and destructive-start boundary

1. Require current compatible access, an initialized authenticated identity and
   connectivity. Permit this flow for partially initialized workspaces too.
2. Explain permanent data loss and identify the current account using available
   presentation, without requiring email to exist.
3. Require typing **DELETE** and fresh proof through an already linked provider.
4. Verify the reauthenticated UID equals the original UID; reject a mismatch.
5. Obtain the cloud-confirmed deletion intent/fence before removing data.
6. Show **Deletion requested — awaiting operator processing**. Once the script
   starts, display its authoritative progress while the user remains authenticated.

Cancellation before the cloud-confirmed deletion intent leaves the account
unchanged. Once intent is committed, offer status refresh and Logout rather than
cancellation or rollback. Operator processing is not triggered automatically. Unknown intent acknowledgement must
be reconciled before claiming cancellation succeeded. A failed confirmation or
reauthentication does not authorize cleanup. The finalizer uses trusted administrative Auth deletion, not browser deleteUser;
therefore a second interactive user proof is not required merely to finish an
already accepted job. The script verifies the recorded intent and original UID.

## Data inventory and protections

Include every Slice5 record family: profile, settings, Categories, Locations,
Views (including their inline order fields), workspace initialization, seed receipts, name reservations
(`users/{uid}/nameKeys/{kind}/keys/{digest}`) and any root/control
records actually introduced by implementation. Protected Uncategorized and All
Tasks may be physically removed only under the explicit account-deletion state;
ordinary application operations retain their protections.

Use a versioned deletion inventory/adapter contract. Every later slice that adds
an owned record family or nested data must update deletion, Rules, inventory and
regressions together. Unknown inventory versions block safely; do not declare
success after deleting only known seed IDs or a parent document. Enumerate actual
owned records so later user-created items are included.

Exact record paths, batch sizes, control fields and policy revisions are pending
resolution against the implemented Slice5 schema. Progress data is minimal and
content-free, bound to UID and job identity, with monotonic stage transitions and
cloud acknowledgement. A client-supplied completion Boolean is not proof that
collections are empty.

## Shared provisioning fence — owner agreement, 4 November 2026

The [Slice5 shared contract](05-workspace-provisioning.md#agreed-shared-deletion-fence-contract--4-november-2026)
selects `accountDeletion/{uid}` as the control path, outside the workspace tree.
Any existing control fences workspace writes regardless of state; Rules must check
absence for provisioning/receipts/reservations too. Failed reads cannot mean absent.
Family `accountDeletion`, schema 1, has initial request fields `schemaVersion`,
`jobId`, `inventoryVersion`, `state: requested`, and server-confirmed `requestedAt`.
The owner may read and create a valid request after approved proof; no browser
update/delete/progress authority. Only the explicitly invoked trusted finalizer
advances the job and retires the control after all existing cleanup/Auth/token
safety prerequisites. No automatic expiry or client-cleared blocked flag.

Include this root control in deletion inventory as retained operational control,
retired last; it is not ordinary workspace content. Exact request-proof checks,
operator progress/state fields and token-safety bounds still require detailing and
verification. This agreement executes no deletion and creates no cloud resources.

## Processing, interruption and recovery

Persist deletion state before cleanup. From that point all supported clients
must enter deletion recovery, not workspace provisioning, ordinary navigation or
mutations. Rules must independently deny new application writes for that UID,
while allowing only owner status reads and narrowly validated intent creation.
The browser cannot perform protected-record cleanup or author progress/completion.
The operator script uses trusted credentials and must independently enforce its
job, inventory and state invariants because administrative access bypasses Rules.

The operator script deletes data in bounded retryable stages, verifying authoritative absence and
reconciling unknown outcomes. A continuation resumes the same job; no duplicate
job, blind replay or client-held permanent lock. Do not hold one transaction open
across user interaction or claim arbitrary-volume atomic deletion.

After cleanup verification, the operator script deletes the exact original Auth
UID last and confirms authoritative absence. A failed/unknown response is verified
before retrying; user-not-found can count as identity absence, not as proof that
data cleanup occurred. Retain the fence throughout failure and reconciliation.
After refresh/sign-in during unfinished deletion, show blocking deletion status,
**Refresh status** and Logout, not a browser Continue deletion action. The operator
continues the job through a separate resume command. Logout does not stop the
operator's work or cancel the request. Completion depends on operator availability;
no automatic completion time or notification service is promised.

Known-offline deletion is blocked and no offline deletion queue is created.
Browser network/compatibility loss blocks new intent; it does not cancel operator
processing. The finalizer checks project identity and supported inventory/policy
versions and pauses safely on its own connectivity or validation failure.
Compatibility policy must retain a usable continuation path
for unfinished jobs across releases. Bind all callbacks to UID/session/job;
account switching must never apply another account's pending work.

Clear local user-scoped state on completion/Logout and stop listeners. Other
connected clients clear rendered content when they observe deletion. Immediate
erasure of already rendered/offline copies or screenshots is not promised.
Report full completion only with evidence of required application cleanup and
successful identity deletion; uncertainty must remain visible as uncertainty.

## Selected Option 3 — operator procedure and temporary fence

Use an explicitly invoked local administrative script, never browser-shipped
credentials, a hosted function or automatic scheduler. Normal account deletion
uses this operator path; it is not merely exceptional orphan recovery.

1. Inspect/dry-run a single persisted request by exact project ID/number, UID and
   job ID; show inventory/version and stage counts without content or tokens.
2. Execute only after explicit operator invocation for that target. Verify a valid
   intent, expected recent-auth admission evidence, monotonic state and fence.
   Do not infer authorization from an arbitrary UID supplied on the command line.
3. Enumerate and remove all owned application records in bounded stages. Reconcile
   interruption and repeat executions; do not remove another UID's namespace.
4. Verify remaining inventory authoritatively, retaining only deletion controls.
5. Delete Auth for that UID, then confirm Auth absence and record trusted timing.
6. Keep the temporary fence until no previously issued token can authorize data
   recreation. Use a documented platform-based bound plus margin and verify the
   exact Rules/token behavior; do not choose an unexplained one-hour timer from
   intent creation. Recheck Auth absence and data emptiness at retirement.
7. An explicit resume/retire invocation removes the remaining job/fence controls
   only when every prerequisite passes. Any uncertainty leaves the fence in place.

The script must survive failure between every pair of steps, including Auth
absence before timing was recorded. In that case establish a conservative trusted
observation time and wait the validated full safety bound; never backdate safety
from an untrusted client field. No background process must remain running merely
to wait; resume can be invoked later.

Temporary retained fields are limited to old UID association, job ID, schema/
inventory versions, monotonic state, bounded progress and necessary timestamps.
No email, name, provider credentials, Task content or permanent account audit store.
Owner status reads require matching UID; clients cannot erase or falsify the fence.
The chosen retention is completion-based: retain until trusted cleanup, Auth
absence and stale-session checks succeed, then remove through the operator script.
Failed/abandoned jobs can remain pending until operator action; do not advertise a
fixed maximum retention or automatic erasure. This is temporary operational
retention, not a permanent tombstone policy. Exact fields/safety bound require
implementation review and tests before acceptance.

## State and recovery contract

| State | User action / trusted transition |
|---|---|
| Confirmation / proof | Cancel before intent submission; reject wrong UID or failed proof |
| Intent unconfirmed | Verify commit outcome; do not claim cancellation from timeout |
| Awaiting operator | Refresh status or Logout; no provisioning/ordinary mutations |
| Cleanup running / paused | View authoritative progress; operator resumes same job |
| Data removed, Auth pending | Operator verifies inventory and deletes original Auth UID |
| Auth outcome unverified | Operator checks authoritative identity absence; sign-out alone is not proof |
| Account removed, fence pending | New sign-in may create a new UID; old UID remains fenced until safe retirement |
| Fully finalized | Trusted data/Auth verification and control-record retirement complete |
| Exceptional recovery | Operator reconciles orphaned/unknown inventory without claiming completion |

Account removal and complete control-metadata erasure are distinct milestones.
After Auth deletion, the old browser may be unable to read job status; do not open
public job lookup, expose the old UID to a new account or claim listener failure
proves completion. The script supplies final completion evidence to the operator.
No email/notification integration is added. Any user-facing completion shown must
be limited to the milestone actually verified.

## Enforcement allocation and resolved conflicts

| Concern | Selected design / remaining proof |
|---|---|
| Firestore/Auth non-atomicity | Trusted staged job, Auth last, temporary fence across all failures; no atomicity claim |
| Stale authenticated clients | Rules check the fence; operator retires it only after verified Auth absence and validated token-safety interval |
| Retention | Minimal controls retained until explicit safe retirement; no permanent marker or automatic TTL |
| Architecture | Local operator-run script; no hosted runtime, Blaze upgrade or scheduler selected |
| Human proof | UI types DELETE; Rules enforce expressible same-UID/recent-auth intent constraints; script validates trusted intent/state, not a fabricated client completion claim |
| Administrative privilege | Script bypasses Rules and must enforce inventory, ownership, project targeting and monotonic job transitions itself |
| Future owned data | Every record-family addition updates inventory/cleanup/regressions; parent deletion is not recursive cleanup |
| Out-of-flow Auth deletion | Trusted orphan cleanup with explicit operator targeting; newly created UIDs cannot access old data |

The owner has selected the finalization architecture. Remaining implementation
proofs are exact control paths/fields, Rules admission limits, supported inventory,
lease/concurrent-run handling, token-safety interval, batch limits and operator
credential provisioning. Use narrow permissions and trusted local credentials
outside Git/browser assets. Script creation is not blanket execution authority;
each destructive run must be explicitly authorized for its exact target.

## Slice7 inventory dependency — 4 November 2026

[Slice7 Task creation](07-quick-create-basic-list.md) is accepted for detailing,
not implemented here. Its implementation must extend the operator inventory,
verification and cleanup tests with all owned Tasks, including interrupted-create
outcomes. No creation Activity Event is introduced by Slice7; add future child
families when their feature slices arrive. A deletion fence blocks creation and
must win races with admitted writes according to the final Rules contract. Never
release Task persistence without matching account-deletion coverage.

## Slice8 inventory dependency — 4 November 2026

[Task Detail/metadata](08-task-detail-metadata.md) now selects users/{uid}/tasks/{taskId}/detail/description for Markdown source;
Slice8 D8 also requires immutable Save completion receipts retained with the
Task initially (exact receipt path remains implementation review). Include them
in enumeration/verification/cleanup, not just the description child. If introduced, extend
trusted enumeration, verification and cleanup with it alongside the feature.
Keeping metadata/detail under a Task parent does not prove recursive cleanup.
No metadata Activity Event family is introduced by Slice8. Verify fence enforcement
against pending saves, not only new Task creation.

## Slice8A inventory dependency — 4 November 2026

[Advanced Create](08A-advanced-create.md) atomically creates Task2 root and required
nonempty description1 child. Verify trusted inventory/cleanup covers this combined
operation and the owner-approved atomic creation completion receipts, including lost
acknowledgement. Receipts are internal recovery records, not Activity Events.
No new Activity Event family is added. A parent-only or seed-ID-only sweep is not
complete account deletion; fence/quiescence checks remain mandatory.

## Acceptance plan

Test cancellation before intent, failed/mismatched proof, interrupted/unknown
intent commit, interruption at every cleanup stage, repeat continuation, partial
initialization, concurrent tabs/clients, stale/offline clients, expired proof,
compatibility changes, lost acknowledgement of Auth deletion and final Auth
failure. Verify protected-record deletion is allowed only in the deletion flow,
cross-UID attempts fail and stale clients cannot provision/write after finalization.

Test each supported linked-provider route to the same UID and fresh registration
through either formerly linked method. Verify new initialization without access
to old data or markers. Separate local/emulator orchestration evidence from
separately authorized real-provider and cloud Rules/finalization evidence.

Diagnostics remain content-free and contain no credentials, profile fields or
permanent personal-data audit store. There is no new account-level Activity Log.
Evaluate request/batch costs and resumability without imposing speculative caps.
Update user guidance on permanent loss, operator-dependent completion, status
visibility after Auth removal and exceptional support;
manual publication remains a later checkpoint.

## Platform references and next checkpoint

Official sources reviewed on 2 November 2026:

- [Manage Firebase users](https://firebase.google.com/docs/auth/web/manage-users):
  deleting users and recent-login requirements.
- [Delete Firestore data](https://firebase.google.com/docs/firestore/manage-data/delete-data):
  deleting a document does not automatically delete its subcollections.
- [Firebase session management](https://firebase.google.com/docs/auth/admin/manage-sessions):
  token lifecycle and trusted session-management mechanisms; this is not authority
  to ship administrative capabilities in a browser.

These establish platform constraints, not project validation. Next: align Slice5
fences and finalize/test the selected operator script, Rules and retention-safety
contracts before implementation acceptance. No infrastructure
or account deletion is authorized by documentation. Overall feasibility remains
INCONCLUSIVE.

## Documentation review checkpoint

Owner approved the scope and conflict evaluation, then authorized completing docs
and staging for review. Related README, architecture, plan, product specification,
project status and Slice5 dependency guidance are aligned. The owner subsequently
selected Option 3, manual trusted finalization, replacing the earlier alternatives.
Implementation and destructive account actions require their own applicable authorization. Documentation checks do not
constitute deletion, Rules, provider or browser execution evidence.
