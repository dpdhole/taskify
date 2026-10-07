# Firestore query/index verification

Status: Implemented and Verified within the executed local-test/development-service planning scope, with owner approval to record and publish that status. Index deployment to the approved development database is complete. All 13 real-service plan-only queries succeeded and used the intended indexes. Production workloads and execution performance are not verified.

## Configuration

`firestore.indexes.json` contains the eight approved DEC-054 composite indexes. DEC-069 adds the required ascending collection-group single-field index on `preferences.user_email`, preserving collection-scope defaults. The root `firebase.json` references this configuration.

| Query | Intended and observed index fields (implicit __name__ omitted) |
|---|---|
| Focus / Prioritize dated | Tasks: owner_email ASC, availability ASC, lifecycle.macro ASC, due_date ASC |
| Prioritize Unspecified | Reuse the same Due composite; no extra null-Due index |
| Resolve | Tasks: owner_email ASC, availability ASC, lifecycle.micro ASC |
| Plan | Tasks: owner_email ASC, availability ASC, lifecycle.macro ASC, due_date ASC, created_at DESC |
| All Active / include stale | Tasks: owner_email ASC, availability ASC, lifecycle.macro ASC, updated_at DESC |
| Recently Closed | Tasks: owner_email ASC, availability ASC, lifecycle.macro ASC, completed_at DESC |
| Unarchive | Tasks: owner_email ASC, availability ASC, archived_at DESC |
| Recover | Tasks: owner_email ASC, availability ASC, deleted_at DESC, purge_after ASC |
| Follow Up / active hidden-state enrichment | Collection-group states: user_email ASC, hidden_until ASC |
| Preference enrichment | Collection-group preferences.user_email single-field ASC |

The final real-service report matches these intended mappings, including scope and ordering. The catalog in `query-contracts.mjs` is verification tooling only; no client feature or official SDK query implementation is introduced.

## Local evidence — 2026-10-07

Working-tree changes based on `631bb8c9b33b445735894593d69282b8a0fbe01c` were tested with Node.js 22.23.3, pnpm 10.34.6, Vitest 5.0.3, Firebase CLI 15.32.1, Firestore emulator 1.22.0, and JDK 21.0.12.1.

`pnpm run test:firestore:queries`: 39 tests passed, one file, exit code 0. The initial final run took 6.10 seconds; the post-evidence-metadata regression run took 7.08 seconds. Both emulator runs shut down successfully. Tests cover:

- all 13 candidate/enrichment query variants using the Firebase client SDK under the actual Rules;
- owner/user isolation and rejection without the identity predicate;
- date/null semantics, inclusive extent and staleness boundaries, complete Resolve retrieval despite old update times;
- disjoint Prioritize branches, expanded Focus/Plan extent, and continued recovery-expiry exclusion;
- Recover's two inequalities and deterministic deleted_at DESC / purge_after ASC ordering;
- static composite count/uniqueness and the preference single-field scope correction;
- local Query Explain runner validation: required explicit target, canonical parameters, emulator rejection, and dry-run/analyze separation.

The Explain help and dry-run commands also executed successfully before cloud setup. Emulator success alone does not verify which indexes a real server will select: the emulator does not track composite indexes. Real-service evidence is recorded separately below. [Firestore emulator limitations](https://docs.cloud.google.com/firestore/native/docs/emulator)

## Real Query Explain evidence — 2026-10-07

- Target: `taskify-dev-dpdhole`, database `(default)`, Standard/Native in `asia-south1`, authorized by DEC-070. See [development.md](./development.md) for bootstrap settings and access observations.
- Deployment command: `pnpm exec firebase deploy --only firestore:indexes --project taskify-dev-dpdhole`; exit 0. Eight composite definitions and all four configured preference single-field entries were subsequently `READY` and matched the reviewed manifest, including field order/scope: [composite-indexes.json](./verification/composite-indexes.json), [preference-field.json](./verification/preference-field.json).
- Final Explain command: `node infrastructure/firebase/explain-queries.mjs --project taskify-dev-dpdhole --database '(default)' --owner dpdhole@gmail.com --today 2026-10-07 --now 2026-10-07T12:01:44.000Z`; exit 0. Defaults were `farDays=15`, `staleDays=60`, and `horizonDays=30`.
- Two plan-only passes succeeded (26 total requests). The second pass recorded exact input parameters, query definitions, and final metrics: [query-explain.json](./verification/query-explain.json), generated at `2026-10-07T12:03:22.336Z`.
- All 13 query variants have `status=explained`; `analyze=false`; every `executionStats` value is null. No cloud fixture data was written, and no query execution/analyze run occurred.
- Prioritize Unspecified reused the same Due composite as Focus/Prioritize dated; no separate null-Due index was needed.
- Recover selected `(owner_email ASC, availability ASC, deleted_at DESC, purge_after ASC, __name__ ASC)` for both inequalities and the documented ordering.
- Follow Up and active hidden-state enrichment selected the states collection-group composite. Preference enrichment selected the collection-group single-field `(user_email ASC, __name__ ASC)` index.
- Several `in` queries repeat the same index properties in their reports; their unique selected definitions still match the table.
- This evidence establishes successful planning and index selection for these exact queries on the managed development service. It does not establish production workload efficiency, realistic scan counts, latency, cost, pagination behavior, or plans for future query changes.

## Reproducing inspection

The development target, IAM user ADC, and quota project were configured during the owner-approved bootstrap. ADC remains in the standard user-local store, outside the repository; no tokens/credential files are recorded as evidence.

For a local preview, with no service request:

```sh
pnpm firestore:explain --project taskify-local --owner owner@example.com --today 2026-10-07 --now 2026-10-07T08:00:00.000Z --dry-run
```

For another owner-authorized plan inspection, use an explicit target and date:

```sh
pnpm firestore:explain --project taskify-dev-dpdhole --database "(default)" --owner dpdhole@gmail.com --today YYYY-MM-DD
```

The runner defaults to `analyze=false`, records per-query metrics/errors, and never seeds/deletes documents, deploys indexes, or changes Rules. Firebase Authentication does not authorize Query Explain; it uses IAM. Plan-only requests skip query execution and are charged one read per query. `--analyze` executes queries and requires separate owner authorization for that run. [Query Explain options and authentication](https://firebase.google.com/docs/firestore/query-explain)

The completed development bootstrap/index deployment was explicitly approved in DEC-070. Additional deployments, environment changes, or writing representative fixtures to a real database require further project-owner approval. Empty-data plan inspection can confirm selected indexes; scan efficiency/cost conclusions require representative data and an authorized analyze run.

Real reports confirm all current query variants, Prioritize Unspecified reuse, collection-group scope, and Recover's multi-inequality order. Owner-approved Verified status is limited to this planning evidence and the executed local query tests; production workload/performance verification remains separate.
