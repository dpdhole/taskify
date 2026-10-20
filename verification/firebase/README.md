# Firebase feasibility experiments

Isolated verification source and recorded local evidence, prepared for repository inclusion on 20 October 2026. These are experiments, not application code, production Rules or deployment configuration.

Baseline: `dpdhole/taskify`, main, `38a7fb7383ae99948f003d68fe7d77e8e4b20dfa`. See [consolidated findings](../../docs/feasibility/firebase-validation-results.md) for authority, verdicts and open decisions.

| Directory | Recorded outcome | Role |
|---|---|---|
| `gate1/initial/` | 71 passed; overall INCONCLUSIVE due to date mismatch | Historical candidate, original Rules and failure evidence |
| `gate1/india-dates/` | 100 emulator + 1 display test passed | Resolves date mismatch for fixed Asia/Kolkata only |
| `gate2/name-integrity/` | 16 passed, 4 failed | Deliberately failing historical Unicode/grapheme candidate |
| `gate2/entities/` | 147 passed | Represented entity contracts, with owner-accepted client-only naming policy; includes 101 carried-forward tests |
| `gate3/purge-recovery/` | 20 passed; overall INCONCLUSIVE | Deletion, single-Task export and emulator-only operator recovery |
| `gate4/auth-query/` | 18 passed; overall INCONCLUSIVE | Metadata/reactivity, mock Auth and static Hosting |

Counts overlap. Do not add them or interpret green assertions as full product acceptance. The latest Gate 3/4 Rules have not received a combined run of all preceding contracts. The name-integrity candidate is expected to exit nonzero; its failures are part of the findings.

## Reproduction

Use Node 22 and Java 21 on PATH (or configure JAVA_HOME), then in one candidate directory:

```powershell
npm ci
./run.ps1
```

Alternatively use `npm test`. Dependencies are pinned per candidate. The PowerShell runner uses installed Node/Java and the Firebase CLI's normal emulator cache; the first run may download the emulator. Every configuration uses a `demo-` project ID and loopback emulators. No Firebase login or live project is required. Gate 4 uses ports 8080, 9099 and 5000; other candidates use Firestore 8080. Run candidates sequentially on disposable emulator instances; tests may clear local fixtures.

Recorded versions: Node 22.16.0, Java 21.0.12.1, Firebase 11.10.0, rules-unit-testing 4.0.1, firebase-tools 14.27.0, Firestore emulator 1.19.8. An uncontrolled future CLI emulator download is not necessarily this recorded binary. No fresh emulator execution is claimed for repository packaging.

The six `run.ps1` files were adapted from workspace-specific runtime paths to PATH-based runners during packaging. Rules, test and adapter source are unchanged from the recorded experiments. `MANIFEST.sha256` inventories the packaged files except itself.

Local Git attributes preserve snapshot bytes across checkout line-ending conversions and retain the original historical whitespace. This keeps recorded evidence and the packaging manifest verifiable.

## Evidence handling and safety boundaries

Candidate VALIDATION/README files are historical snapshots: earlier statements such as “Gate 3 not started,” absolute workspace locations and reproduction paths describe their execution time. This index and the consolidated findings establish the current cross-gate status.

Original `evidence-hashes.json` files also describe the original workspace inventory. Large raw/summary coverage traces are intentionally omitted (approximately 54 MB); original hash lists may reference those omitted files. No new coverage percentage is asserted. Selected final and failure logs, test inventories and small structured evidence are retained. Gate 2's oversized coverage export failed with Java heap exhaustion and is documented in its report.

Excluded: the original input ZIP, node_modules, portable runtimes, emulator binaries/cache, debug/environment logs, scratch insertion files and generated distributable ZIP duplicates. Retained backups and IDs are synthetic emulator fixtures, not user data. Development dependency audit findings are documented in the Gate 1 report; no modernization or production-toolchain approval is claimed.

`gate3/purge-recovery/operator-recovery.mjs` is a trusted **emulator-only** simulation and must not be shipped to the browser or represented as approved live recovery. No live credentials, paid services, Cloud Functions or hosted API are introduced. Running a candidate is not permission to deploy its Rules.
