# Slice 2 — Compatibility gate

Status: **documentation accepted by owner on 23 October 2026; implementation pending**.
The owner accepted the objective/scope recommendations, contract/runtime details
and synthetic-consumer/operator/test approach, then authorized documentation.
The owner subsequently accepted this documentation and confirmed the database
approach. This document records the accepted implementation baseline, not deployed
artifacts. Example values remain illustrative until deliberately selected.
No application code, executable Rules, scripts or cloud resources are changed
by this detailing. The owner authorized commit preparation/staging only; commit,
push, implementation and cloud provisioning await their applicable instructions. Live promotion remains deferred
until development matures and requires explicit owner approval.

Authority: [slice plan](../implementation_plan.md), [architecture](../architecture.md),
[product specification](../product_spec.md). Foundation evidence remains in its
[closure review](01-foundation.md#closure-review) and [Hosting results](hosting-deployment.md).

## Objective and boundaries

Establish an authoritative, revocable compatibility decision before workspace
loading, provisioning or new commands. Exercise the integration with isolated
synthetic consumers; do not implement future Task/account behavior as fixtures.

| Included | Excluded |
|---|---|
| Contract decoder, client capability declaration and complete compatibility predicate | Real account initialization, linking, Tasks and production record families |
| Shared gate, boot/recheck/watch lifecycle and clear blocking/retry states | Full product shell, feature navigation or an offline write queue |
| Synthetic workspace and controlled command/outcome consumers | Publicly writable cloud probes or a new hosted business/API tier |
| Exact-document cloud read boundary and operator publication design | Trusting client version claims as authentication or database authorization |
| Local/adversarial tests and separately gated real-cloud read checkpoint | Live Hosting promotion or platform-wide acceptance |

The ordinary entry will exercise the small compatibility status surface when
implementation is approved. Synthetic workspace/command controls belong only to
an isolated dev/test entry and must be excluded from ordinary Hosting artifacts.
Show only compatibility states/guidance in the ordinary entry; do not suggest that
sign-in or Tasks already exist. Until the real contract is provisioned, a missing
contract blocks this new build rather than silently bypassing the gate.

## Contract and client capabilities

Accepted singleton: `runtime/compatibility`, in the configured Firestore database.
It is public configuration, contains no credentials/user data, and is read-only
to browser clients. Project identity must match the build's expected environment.

Example shape, **not a document to publish automatically**:

```json
{
  "contractFormatVersion": 1,
  "revision": 1,
  "environmentId": "taskify-dev-dpdhole",
  "serverRelease": 1,
  "minAppVersion": "0.1.0",
  "maxAppVersion": "0.1.0",
  "recordFamilies": {
    "compatibilityProbe": {
      "presentSchemaVersions": [1],
      "allowedWriteSchemaVersions": [1]
    }
  }
}
```

The client declares its numeric app version, immutable build fingerprint,
environment, understood contract formats and required families. Each required
family declares readable schema versions and, when it intends to write, one
chosen write schema. `compatibilityProbe` is an explicitly synthetic family;
it neither creates a production collection nor specifies the future Task schema.

| Axis / validation | Accepted rule |
|---|---|
| App version | Canonical three nonnegative safe integers, `major.minor.patch`; compare tuples numerically, inclusively; reject leading zeros except zero itself |
| Prereleases | Prerelease/build suffixes are not introduced in this format. Human beta labels and build fingerprints remain separate; define semantics before adding such versions |
| Format | Positive safe integer; explicitly supported by client; unsupported format blocks |
| Revision | Positive safe integer, increased for every publication, including policy rollback |
| Environment | Nonempty string equal to the expected project/environment identity; CLI publication also independently checks project ID/number |
| Server release | Positive safe integer for deployed policy traceability; no independent client/server release-range predicate |
| App bounds | Both versions valid and minimum no greater than maximum |
| Family schemas | Required entries present; schema arrays nonempty, unique positive safe integers; every allowed write version also declared possibly present |
| Family population | Present versions describe every schema that may remain, not only the latest writer; the operator must not drop a retained version prematurely |
| Additional fields/families | Ignore inert additions in a known format and families unused by this build; changed semantics require a supported new format |

The accepted Slice2 numeric version representation supersedes the earlier
monotonic-integer app-release proposal. Revisions and server policy generations
remain distinct from app version, build fingerprint and record concurrency counters.
The example version is illustrative; implementation must select the actual build
identity deliberately rather than treating this example as released code.

The predicate requires a valid authoritative contract, matching environment,
app within both inclusive bounds, all possibly present schemas of required
families readable, and each intended write schema allowed. A rejected predicate
blocks the gate for this build; no partial workspace or silent read-only fallback
is introduced. Gate readiness permits starting protected loads, but does not
certify subsequently loaded records: workspace readiness also requires their
own decoders and loading checks to succeed.

## Policy authority and Hosting secondary use

Owner decision, 23 October 2026: the Firestore document at
`runtime/compatibility` is the sole authoritative policy for the Taskify gate.
Hosting build metadata identifies the deployed artifact; it is not a second
compatibility-policy authority.

A hosted policy may be introduced later for external/secondary consumers if
needed. A derived copy must identify its source contract revision so consumers
can detect stale information. It must not override the database contract,
authorize access when database verification fails, or create two independently
edited policy sources. No hosted policy file, polling mechanism or publication
pipeline is required in Slice2.

## Gate states and lifecycle

| State / reason | Protected work | User guidance |
|---|---|---|
| Checking | Block new loads/provisioning/commands | Checking compatibility; announce status without moving keyboard focus |
| Ready | Permit admission through the current shared gate | Show eligible synthetic status only in test entry |
| Incompatible: client too old | Block | Explain that a newer client is required; explicit refresh/update action |
| Incompatible: client ahead | Block | Release unavailable; retry later, without automatic reload loops |
| Incompatible: unreadable data / prohibited writer | Block | Explain unsupported data/policy; update or operator resolution as appropriate |
| Configuration error | Block | Missing/malformed contract, wrong environment or unsupported format; explain unavailable configuration and offer retry |
| Verification unavailable | Block | Server verification failed; preserve input and offer retry |

At boot, expose only the minimal status surface and contract access. At resume,
reconnect or contract change, revoke readiness before new operations can start.
The browser online flag is a trigger, not proof that Firebase is reachable.
Hidden tabs do not provide continuous monitoring guarantees: a resumed tab must
recheck before admission. An SDK error or a cache-only/offline transition also
revokes readiness; cached-compatible data never grants fresh readiness.

Accepted adapter strategy: one metadata-aware contract listener plus an explicit
server-only verification read for boot/recheck requests. Validate server snapshots
through the same domain decoder. Avoid fetching on every command and avoid
accumulating duplicate listeners. Count actual contract reads/reconnect behavior
during validation; no speculative quota/capacity claim is made.

The application owns one revocable gate with a generation identifier. Every new
check, authoritative change and disposal invalidates superseded asynchronous work.
Listener/read races must not let an older revision restore readiness after a
newer observation. An authoritative revision regression during the same session
blocks as an operator/configuration error; policy rollback publishes a new revision.
Automatic Firestore reconnection may recover through a new authoritative check;
manual Retry starts a new generation. Do not add an independent timer retry loop.

Consumers check the gate immediately before admission and associate ongoing work
with the admitted generation/revision. Late workspace results cannot publish
readiness or replace current gated state. Preserve unsaved in-memory input when
feasible, without promising persistence across refresh or adding offline storage.

| Command point | Required behavior |
|---|---|
| Gate closed before submission | Do not submit or queue; retain input |
| Revocation before submission completes admission | Reject stale admission; do not start a new write |
| Revocation after actual submission | Do not claim cancellation; reconcile actual cloud outcome |
| Confirmed success/rejection | Report the cloud result without reopening the gate |
| Unknown acknowledgement | Mark outcome unknown; reconcile before offering a safe retry |

Synthetic simulations exercise these outcomes locally. They do not establish
Task-write reconciliation, exactly-once delivery or cancellation guarantees for
future features.

## Rules boundary and operator publication

Accepted **cloud** Rules permit unauthenticated `get` only on
`runtime/compatibility`, deny listing and all client contract writes, and deny
all unrelated database access. Do not deploy Foundation's synthetic local Rules.
Public contract access is an explicit refinement of the earlier authenticated-
contract outline; sign-in is not a prerequisite for checking compatibility.

Use a **separate emulator-only** Rules fixture to exercise synthetic write-schema
policy against the contract. Restrict fixture access to synthetic test identities
and records, and validate schema/record shape. Include bypass attempts that never
invoke the UI gate. Never deploy this fixture or create a public cloud write probe.
This proves the represented policy boundary, not future per-user Task authorization.

Rules cannot attest a browser binary/app version. Real Rules must independently
enforce ownership, supported schemas and integrity even when a client bypasses
the gate. A client lifecycle check cannot eliminate races with a policy deployment
or undo accepted writes. Trusted operator SDK access bypasses client Rules and
must therefore validate independently.

Operator publication design, to implement only after approval:

1. Select the named environment; independently match project ID and number and
   verify the free-only boundary. Keep credentials outside the app/artifact.
2. Validate candidate contract and the client/policy support matrix, including
   retained schema support, intended writers and release traceability.
3. Require an expected current revision. Bootstrap requires document absence;
   later publication requires an exact expected revision and increments it.
4. Use a trusted transaction to compare-and-publish atomically. A conflict aborts
   for review rather than overwriting another operator's policy.
5. Record target, previous/new revision, contract hash, build and Rules release
   references. Verify via an independent server read and the supported client.
6. Correct/roll back policy values only with a new revision and compatible
   retained-data support. Never lower the revision or assume Hosting restoration
   restores the database/contract.

Reuse plain TypeScript validation in the trusted local publication tool where
practical. This is an owner-operated tool, not approval for a hosted server tier,
Functions, a paid dependency, arbitrary force overwrite or schema migration.

## Validation and delivery checkpoints

| Area | Required evidence |
|---|---|
| Domain validation | Both app boundaries accepted; immediately outside rejected; numeric comparison; malformed/leading-zero/unsupported suffix versions; invalid format/environment/ranges/schema sets |
| Schema predicate | All required families and retained versions covered; unknown/unreadable data and disallowed writer blocked; unused-family additions do not break old clients |
| Authority/lifecycle | Cached-compatible data never authorizes; server data does; boot, offline/errors, visibility resume, reconnect and live changes revoke/recover correctly |
| Races/cleanup | Superseded read/listener responses, revision regression, repeated Retry, disposed consumers and listener teardown cannot reopen an obsolete gate |
| Consumers/outcomes | Closed gate blocks admission/queues; stale loads do not publish; submitted success/rejection/unknown outcome handled without blind retry |
| Emulator Rules | Exact contract get allowed; listing/publication/unrelated reads denied; synthetic schema enforcement holds when the gate is bypassed |
| Publication tool | Decoder reused; bootstrap-absence and expected-revision conflicts; concurrent publisher loses safely; target mismatch aborts; rollback advances revision |
| Browser | Ordinary checking/blocking/retry/update states at 390/1280px, keyboard/status semantics and preserved input; synthetic harness excluded from ordinary builds |
| Existing Foundation | Run affected boundary/unit/build checks and represented emulator/browser regressions; retain original evidence rather than relabelling it |

The ordinary entry will legitimately gain compatibility application/domain code
and browser Firebase imports. Update Foundation's former blanket ordinary-bundle
exclusions deliberately for that new behavior, while continuing to reject its
synthetic proof/harness, Node/Admin/CLI modules and test fixtures. Record the new
bundle graph/size separately; do not overwrite the original Foundation evidence
or claim that its old SDK-free artifact is the Slice2 build.

Documentation is accepted. After explicit implementation/cloud instructions:
implement and validate locally first. A separate PoC checkpoint may create the
agreed database and publish only the reviewed minimal cloud Rules/contract in
`taskify-dev-dpdhole` (`243252492098`), then test actual contract reads, blocking,
retry and revocation through a preview build. Verify no unintended resources,
API-key changes or paid services; the Hosting checkpoint already demonstrated
that platform side effects need inspection. No live promotion follows.

Database location, actual app version, concrete build capabilities and publication
tool credential/runtime choices must be listed in the implementation checklist
before cloud actions; none are silently selected/provisioned by this document.
Real-cloud tests do not require a publicly writable synthetic collection.

Developer guidance must explain contract bootstrap, blocked-state recovery,
publication and diagnostics. Include only current functionality in any user-facing
guidance. Starter-Task provisioning/manual publication remain later slices.
Diagnostics contain state/reason, revision, app/build and environment identity;
exclude credentials, user content and personal data.

Exit: agreed local tests, isolated harness, independently safe Rules, validated
publication procedure and the approved cloud-read checkpoint have evidence; known
dependency findings and platform limitations remain visible. Until those checks
run, no Slice2 completion, product backend compatibility or platform acceptance
is claimed. User-driven backup/recovery remains FUTURE.
