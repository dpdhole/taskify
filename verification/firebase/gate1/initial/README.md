# Taskify Gate 1 — local experiment results

**Full Gate 1 acceptance: INCONCLUSIVE. Final harness: 71 passed, 0 failed.**

Read [VALIDATION.md](VALIDATION.md) for scope, exact run counts, verified invariants, known date-contract mismatch, native transaction retry limitation, experimental adapter retry, Rules budgets and owner decisions. One green diagnostic confirms a known domain mismatch, rather than compliant domain behavior.

- [Exact executed test inventory](test-inventory.md)
- [Final TAP log](final.log)
- [Rules](firestore.rules) and [tests](tests/security.test.mjs)
- [Transaction evidence](transaction-evidence.json) and [batch-budget evidence](budget-evidence.json)

This folder is outside the repository. Nothing was committed or deployed. It is a feasibility candidate, not approved production schema/Rules.

Run `./run.ps1` with the portable Node/Java runtimes in the parent workspace. Other machines can use Node 22/Java 21 on PATH, `npm ci`, then `npm test`. Uses demo-taskify-gate1 and loopback Firestore only. Dependency installation and emulator download require network; no Firebase login or real project is needed.

Original ZIP sources are retained as firestore.original.rules, tests/security.original.txt and README.original.md. The original README's unexecuted status is historical; VALIDATION.md is the current evidence record for this isolated experiment.
