# Client-validated query persistence and compatibility experiment

Isolated emulator-only follow-on to the committed query/workload candidate. The owner accepts supported-client semantic validation of Saved Views for PoC/beta. Task authorization, action/event integrity and concurrency remain enforced by Rules.

## Candidate

- Legacy View records remain readable through the previous codec and retain their old write validation.
- New `querySchemaVersion: 2` records store a JSON definition string. Rules require a nonempty string of at most 32,768 Rules string units, alongside existing ownership, protected All Tasks, version, timestamp and ordering checks. This bound is an experiment fixture, not a new product limit. JSON syntax and filter meaning are client responsibilities.
- Client validates before saving and after loading. Invalid/unknown definitions return an explicit failure with no query to execute. No silent default or partial filter application.
- `/configuration/compatibility` is readable by authenticated clients and unwritable by browsers. A trusted operator supplies it in emulator setup. It records server release, contract version, minimum integer app release, readable schema population and permitted write schemas.
- A supported-client gate blocks workspace/action entry before successful compatibility checking and after a failed resume/reconnect check. This is not a server-enforced minimum-client-release guarantee. A modified client can bypass the gate.
- Legacy upgrade uses an optimistic transaction, preserves metadata and query meaning, increments record version and is idempotent. Unsupported/malformed records require correction rather than destructive conversion. No account-wide migration or production integration is claimed.

## Evidence and reproduction

Use the pinned dependencies and runtime described in the preceding experiments; run `./run.ps1`. All emulator services bind loopback and use `demo-taskify-client-query`. No cloud resources or production code are changed. The runner uses Node's `--test-force-exit` after cleanup, as did the preceding suite; this is not proof of leak-free browser lifecycle.

The previously failing full-query test is superseded here by explicit tests of the newly accepted boundary. Its original failure remains intact in `../query-workload`. Invalid semantic payloads are intentionally accepted by the new server envelope and rejected by the client; this is an accepted tradeoff, not server validation coverage. Other inherited tests remain present.

Final expanded result: **247/247 passed**, zero failures/skips/cancellations, exit 0. See [validation](VALIDATION.md) and [exact inventory](test-inventory.md). Overall platform acceptance remains INCONCLUSIVE. Real Google sessions, deployed compatibility publication, browser reload UX, production indexes, quota billing and production app wiring are outside this local experiment.
