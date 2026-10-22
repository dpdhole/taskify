# Firebase Spark feasibility — Gate 1–4 findings

20 October 2026. **Overall verdict: INCONCLUSIVE.** Browser-direct Firestore remains a conditionally feasible PoC/beta candidate. Core security experiments support continuing validation; complete product/platform acceptance has not been established.

**Latest local result:** [client query and compatibility](../../verification/firebase/client-query-compatibility/VALIDATION.md) passed **247/247**, zero failures/skips/cancellations, exit 0. Full-query persistence works in this representation under the owner-accepted client semantic-validation boundary; all 192 inherited security regressions passed. Compatibility blocking and safe/concurrent schema upgrades passed. Overall platform acceptance remains INCONCLUSIVE.

**Previous owner-decision assessment:** [complete query/workload findings](firebase-verification-assessment.md). The extended candidate ran **237 tests: 236 passed, 1 failed** at full Saved View persistence due to the Rules expression ceiling. This is a real candidate blocker, not a successful full-query verdict. The earlier 192-test candidate remains unchanged and passing in its represented scope.

## Authority and provenance

Execution baseline: main `38a7fb7383ae99948f003d68fe7d77e8e4b20dfa`. Product requirements remain governed by [product specification §§17–18](../product_spec.md). The [gap analysis](firebase-validation-gap-analysis.md) defines the four gates. No `docs/decisions.md` exists at this baseline; no new architectural decision is inferred from passing tests.

The owner authorized isolated local experiments and committed their source/findings as `ea6280e` after review. No push, provisioning, deployment, live OAuth, billing upgrade or production implementation is claimed. Subsequent accepted deletion/recovery/retention decisions and the correction to account-level recovery scope are recorded in [accepted decisions](firebase-validation-decisions.md). The immutable legacy specification remains unchanged.

## Latest evidence and outputs

| Gate | Recorded tests | Qualified verdict | Report and source |
|---|---|---|---|
| 1: Task/event atomicity and dates | 100 emulator + 1 display passed; zero failures | PASS for tested contracts with fixed India timezone | [Gate 1](../../verification/firebase/gate1/india-dates/VALIDATION.md) |
| 2: entity authorization/integrity | 147 passed; zero failures; includes Gate 1's 101 tests | PASS for represented contracts with accepted naming limitation | [Gate 2](../../verification/firebase/gate2/entities/VALIDATION.md) |
| 3: permanent deletion/recovery | 20 passed; zero failures | INCONCLUSIVE overall; represented deletion mechanism passed | [Gate 3](../../verification/firebase/gate3/purge-recovery/VALIDATION.md) |
| 4: Auth, queries, Spark operation | 18 passed; zero failures | INCONCLUSIVE | [Gate 4](../../verification/firebase/gate4/auth-query/VALIDATION.md) |
| Combined regression against inventory-enabled Rules | 192 passed; zero failures/skips | PASS for represented combined contracts; platform still INCONCLUSIVE | [Combined report](../../verification/firebase/regression/combined/VALIDATION.md) |
| Client query/compatibility candidate | 247 passed; zero failures/skips/cancellations | PASS for represented accepted boundary; platform still INCONCLUSIVE | [Latest report](../../verification/firebase/client-query-compatibility/VALIDATION.md) |
| Extended query/workload candidate | 237 executed; 236 passed; 1 failed | FAIL for full query persistence; normal workload conditionally fits model | [Latest report](../../verification/firebase/query-workload/VALIDATION.md) |

These are overlapping suites, not a cumulative test total. Historical 420-test callable-backend evidence is excluded. Following the owner's request, all 147 Gate 2 cases (including carried-forward Gate 1/date coverage), 20 Gate 3 cases, seven new cross-gate cases and 18 Gate 4 cases ran against one unchanged inventory-enabled Rules candidate: 192 passed. This closes the represented cross-gate regression gap, not missing product/query/schema coverage. All evidence is finite local execution, not formal proof or deployed-policy validation.

Source, lockfiles, tests, selected logs, synthetic evidence and reproduction guidance are under [verification/firebase](../../verification/firebase/README.md). No dependency/runtime installation is committed. Historical candidate reports remain dated snapshots; this document supersedes their statements about which later gates have started.

## Key failures, fixes and limits

### Gate 1

- Original unversioned metadata writes were accepted. Added version/request-time integrity and protected audited fields; final regressions passed.
- Native transactions did not retry the tested Rules permission-denied version conflict. Bounded adapter retry succeeded only after confirming version drift and rebuilding/revalidating the operation.
- Initial planned-date instant comparison rejected permitted same-calendar-day combinations. The India extension validates civil-day keys against instants and fixes the observed mismatch. Travel preserves the app timezone; app-timezone relocation is future scope. General IANA zones/DST are not validated or supported by this probe.
- Task mutation and mandatory version-derived immutable event mutually require each other's post-state. Missing, spoofed, replayed and mismatched effects are rejected atomically in the tested cases. Exactly one event per accepted audited version does not establish global intent deduplication across separate valid commands.
- Creation-event policy, complete Task schema, full snapshot payload growth and production document-size costs remain open.

### Gate 2

- The initial naming candidate had **16 passes and 4 failures**: NFC-equivalent names could claim different literal keys, and string sizing did not implement grapheme limits. See the [failing candidate](../../verification/firebase/gate2/name-integrity/VALIDATION.md).
- **Owner-accepted PoC/beta compromise:** NFC normalization and 1–30 grapheme enforcement occur in the supported client. Malicious clients can bypass those policies. Rules retain ownership, shape, trim/lower relationships and literal-key reservation integrity. This is a known limitation, not adversarially enforced Unicode uniqueness. See [accepted policy](../../verification/firebase/gate2/entities/ACCEPTED-NAME-POLICY.md).
- Audited child operations, default classification protection, active references, order registries, seven-View provisioning and protected All Tasks passed represented tests. Persisted query/settings schemas remain subsets of the product contract.
- Early Rules exceeded 1,000 expressions. Redundant checks were reduced and final suites passed; numeric production headroom remains unmeasured. Coverage export exhausted emulator heap, so no final comprehensive coverage percentage is claimed.

### Gate 3

- Parent deletion does not cascade. Added protected per-Task inventories, independent purge jobs and bounded deletion. A synthetic 505-record hierarchy resumed after interruption at 260 deletions, removing the remaining 245. Both racing purge workers completed; repeated execution did not duplicate effects.
- Single-Task export detects concurrent changes, including comment edits that do not increment Task version. Checksums detect corruption, not authenticity.
- Browser historical import remains denied. Privileged recovery was simulated only inside the emulator; it restores hidden children before publishing the root, advances version and adds an administrative event. The owner accepted manual service-owner recovery for development/admin incidents; no specific live procedure or exception to browser integrity has been approved or validated.
- The manual backup/export/recovery requirement still needs its scope agreed. Complete account/project-loss recovery was an assistant scope expansion, not an approved mandatory PoC criterion; it is withdrawn as a blocker. The tested single-Task recovery requires a completed purge marker.
- The owner accepted irreversibility at the first physical child deletion: cancel the untouched purge before ordinary Restore; afterward manually resume deletion. Minimal metadata-only tombstone retention is accepted. These decisions add no test evidence.

### Gate 4

- UID isolation, full 1,203-Task metadata loading, phrase Search over current labels and reactive results passed. List loading does not fetch Discussion/Activity payloads. Cache/pending snapshots are not presented as complete authoritative results.
- Mock Google credentials exercised Auth-to-Firestore access and sign-out denial. Memory persistence and repeat sign-in do **not** establish actual Google OAuth or remembered browser sessions.
- Full date/priority/pause predicates, all sorts, Dashboard calculations, complete Saved View query coverage and offline-write prohibition remain incomplete. Separate listeners do not provide an atomic cross-collection snapshot.
- Static Hosting entrypoint/SPA fallback passed with a small fixture. No real application deployment, production indexes, quota exhaustion behavior or bandwidth test occurred.
- Initial full-load model: 1,203 Tasks + 3 classification documents = 1,206 reads. Forty-two fresh loads would be 50,652 reads, before additional activity. This is illustrative arithmetic, not measured billing. Spark's 50,000 daily read quota is project-wide. [Official pricing](https://firebase.google.com/pricing).

## Remaining path to a platform verdict

1. Apply the accepted irreversible-deletion, manual service-owner recovery and minimal tombstone decisions. Agree the appropriate scope of the existing manual backup/recovery requirement before implementing more recovery functionality; complete account recovery is not an approved PoC prerequisite.
2. Combined regressions passed 192 cases, and the extended candidate retained those cases. Query computation and workload mechanisms now have local evidence, but a full Saved View save fails the expression limit; redesign/explicit scope decisions are required before complete query acceptance. Opens/device/Discussion inputs are confirmed, while capacity/cleanup remain conditional models. Ordinary mutations should remain one aggregate.
3. Obtain separate authorization for real Google/browser session and production query/index validation against an owner-designated Spark test project. Specify permitted project configuration, account creation, provisioning and deployment actions before touching cloud resources.
4. Issue PASS only when required guarantees and workload fit the approved free-only architecture; FAIL if an essential requirement demonstrably needs an unapproved capability; otherwise retain INCONCLUSIVE with exact missing evidence. No trusted hosted backend, Cloud Function or paid dependency is introduced as an implicit workaround.

## Reproduction and evidence limits

See the [experiment index](../../verification/firebase/README.md). Recorded toolchain: Node 22.16.0, Java 21.0.12.1, Firebase 11.10.0, rules-unit-testing 4.0.1, CLI 14.27.0, Firestore emulator 1.19.8. Packaging adjusts runners to installed Node/Java; it does not constitute a fresh emulator rerun. Pinned development dependencies have previously reported audit findings and are not approved as a production toolchain.

The emulator does not validate compound index availability or all production limits. [Official emulator differences](https://firebase.google.com/docs/emulator-suite/connect_firestore). Rules access budgets and source/compiled limits still apply; passing finite tests is not unlimited batch support. [Official limits](https://firebase.google.com/docs/firestore/quotas).
