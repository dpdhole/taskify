# Client query validation and compatibility — local validation

20 October 2026. Owner-authorized emulator-only experiment following commit `ab782d3`. Full-query persistence remains a core feature; no query dimension was removed.

## Accepted boundary

The supported app validates complete query semantics before saving and after loading. Server Rules enforce ownership, protected All Tasks, version/timestamp/order integrity and a bounded versioned payload. A modified owner client can store meaningless JSON or invalid filters in its own ordinary Views. This deliberate limitation is tested explicitly; malformed definitions return an error and no executable query in the supported client.

Task authorization, lifecycle transitions, immutable mandatory events, concurrency and deletion invariants remain independent of View definitions and enforced by Rules. The app does not execute stored query text as code.

## Implementation and verification scope

- Version 2 query definitions use JSON strings, avoiding expensive per-filter Rules evaluation. The local bound is 32,768 Rules string units; final production limits remain a design detail.
- Legacy definitions remain readable. Safe transaction-based conversion retains full semantics, immutable creation timestamp, name and Home visibility, increments version once and is idempotent. No bulk migration is performed.
- An authenticated read-only compatibility record identifies server release, contract format, minimum app release and schema compatibility. Integer release identifiers are fixtures. Browser edits/deletes are denied; publication is privileged emulator setup only.
- Supported-client boot blocks workspace/action callbacks until compatibility is established. Missing/unavailable or incompatible contracts block entry. Resume/reconnect rechecks can revoke an already-ready session. Unknown future definitions are rejected without conversion.
- Inherited test 228 from the prior candidate is explicitly replaced by tests of the accepted boundary. Its strict-server failure remains preserved in the prior candidate; it has not been relabelled as passing. All other inherited cases remain.

The gate is a tested helper, not a completed browser boot screen or application-wide integration. Real browser refresh/update behavior, cache policy, contract rollout and deployment remain unverified. Modified clients may bypass the boot check, but remain subject to Rules. A schema upgrade race may safely reject one transaction rather than automatically retry; no duplicated upgrade is permitted.

## Result

**PASS for the represented accepted boundary: 247 executed, 247 passed, zero failed/skipped/cancelled; exit 0; 183712.7742 ms.** All 192 inherited security regressions passed. Breakdown: 146 security, one display, 27 deletion/recovery, 18 read/Auth, 32 query semantics, eight integration/workload, four storage/codec and 11 compatibility/persistence/migration cases. The first run passed 244/244 before the final three additions. See [exact inventory](test-inventory.md), [results](results.json) and [final log](compatibility-final.log). Full-query save/reload/reconfigure, Save As, safe legacy upgrades and concurrent upgrade integrity passed. The earlier expression-limit blocker is resolved for this new representation under the accepted client-validation boundary; overall platform feasibility remains INCONCLUSIVE. Source fingerprints are in `run-inputs.json`; `compatibility-first.log` preserves the first run. Both suites use explicit cleanup and `--test-force-exit`, which is not evidence of leak-free browser lifecycle behavior.

## Remaining platform gaps

This does not certify live Google authentication/session restoration, production indexes, actual billed quotas, browser UX or final production payloads. Longer Trash retention and unfinished accumulation keep capacity conditional on retained volume. The appropriate manual recovery-method scope still needs agreement; complete account recovery is not a newly imposed prerequisite. No deployment, cloud provisioning, production architecture change or commit is performed by this experiment.

## 21 October discussion follow-up

The owner abandoned further constraint relaxations and deferred quota-related limits/blocking to benchmark-informed slice detailing. No additional tests were run for this documentation update. PoC/beta is web-only; mobile/public API are future scope. Explicit client-ahead-of-server release blocking is intended policy but is not implemented/tested by this helper; it currently checks minimum client release and schema compatibility. The 247/247 result must not be cited as proof of that additional boundary.
