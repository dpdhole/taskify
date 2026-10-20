# Taskify Gate 2 — local entity experiment

**PASS for tested local contracts with the accepted client-only NFC/grapheme policy. Final run: 147 passed, 0 failed, 0 skipped.**

Read VALIDATION.md for exact scope, child/Task/event atomicity, classification integrity, Saved Views/bootstrap/order, Rules budgets, failed intermediate runs and remaining gates. ACCEPTED-NAME-POLICY.md records the owner's accepted limitation; it is not silently represented as Rules-enforced normalization.

Run ./run.ps1 here. Elsewhere: Node 22, Java 21, npm ci, npm test. Uses demo-taskify-gate2 and loopback Firestore only. No production code/specifications changed and nothing committed/deployed. Runtimes/dependencies and large historical coverage traces are omitted from the bundle.

Gate 3 deletion/recovery and Gate 4 real auth/query/free-tier validation remain unexecuted.
