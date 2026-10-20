# Firebase feasibility — accepted decisions and scope

Recorded 20 October 2026 following owner review of Gates 1–4. These are explicit discussion decisions, not new test evidence or implementation approval. Historical experiment reports remain unchanged. Overall feasibility remains INCONCLUSIVE.

## Accepted decisions

| Topic | Accepted contract | Validation consequence |
|---|---|---|
| Permanent deletion | Becomes irreversible when the first child record is physically deleted. Before that, the purge may be cancelled and the soft-deleted Task restored. Afterward an interrupted purge must be completed by a subsequent manual run. | Test cancellation before deletion, rejection after deletion, safe interruption and idempotent continuation. Restore during a pending marker requires cancelling the untouched job first. |
| Exceptional recovery | Development-induced corruption or administrative mistakes may be investigated/recovered manually by the trusted service owner during PoC/beta. Ordinary users do not perform that recovery. | Defines the operational approach only. It does not prove a recovery procedure or authorize live credentials/administrative writes. Normal atomicity, authorization and safe interrupted operations remain mandatory. |
| Purge tombstones | Retain minimal Task/owner identity, timestamps and version metadata after permanent deletion; no Task title, comments or other content. | Verify immutability, ID-reuse protection, ownership and absence of Task content. No expiry schedule or removal mechanism has been agreed. |
| Beta workload | 10–12 users; planning input of 3–5 new Tasks per user/day, about 80% weekly burn rate, and expected 20–30 active Tasks per user. The owner subsequently confirmed Discussion activity mainly on active Tasks (2–3 entries/Task/week), 4–6 daily opens and one device/tab. No file uploads. | These are estimates, not enforced limits or guaranteed steady state. Model unfinished-work accumulation, reconnects and retained history. These confirmed figures replace the earlier unconfirmed interpretation. |
| Retention | Closed Tasks retained for three calendar months after closure; unfinished Tasks remain until explicitly closed/deleted. Cleanup remains manual. Trash may retain expired Closed Tasks longer; same-session permanent purge is not required. | Total retained metadata is not bounded by the three-month Closed window. No Trash duration or cap is agreed. Not a creation-age expiry or automatic purge. No new deleted-Task threshold, operator backup retention or scheduled cleanup was approved. |
| Previously accepted naming compromise | Supported client enforces NFC normalization and 1–30 graphemes for Category/Location names; Rules enforce the represented ownership/shape/literal-key contracts. | Preserve the explicitly documented malicious-client bypass; do not relabel it as server-enforced normalization. |
| Previously agreed timezone scope | Travel retains the configured India app timezone. Relocation/app-timezone changes are future scope, unsupported in PoC/beta. | Retain fixed-India date/travel tests. No generalized timezone/DST proof is inferred. |

## Correction: account-level recovery scope

Product specification §18.5 requires a usable no-cost manual backup/export/recovery method. The Gate 3 checklist requires an operationally feasible manual export/recovery plan. Neither defines a **complete account-level or project-loss recovery specification**.

The assistant expanded that requirement and incorrectly presented complete account recovery as a mandatory PoC blocker. The owner requested clarification before proceeding on assumptions. That expansion is withdrawn: complete account/project-loss recovery is **unapproved scope**, not a mandatory acceptance criterion. Single-Task emulator evidence is limited; the explicit manual recovery method still needs its scope agreed. Accepting a manual operator approach does not approve complete account recovery, its implementation or a particular backup schedule.

Future proposals that expand scope, acceptance criteria or gate blockers must be identified and clarified before dependent work proceeds. Do not infer scope from general best practice.

## Full-query persistence — owner priority

The owner explicitly confirmed full-query persistence is a core Taskify feature and intended differentiator over other Todo/Task managers. Saving and reloading complete supported View definitions remains required. The failing candidate is not accepted, and no filter reduction, persistence deferral or validation-boundary change is approved. Record and commit the experiment findings before analysing de-scoping carefully with the owner. This priority is product direction, not evidence of a competitive market comparison.

## Still open

- Appropriate scope, evidence and readiness stage for the explicitly required manual backup/export/recovery method.
- Real Google OAuth/session and production index validation, requiring separately scoped cloud authorization.
- The latest query/workload experiment ran 237 tests: 236 passed, one valid full-filter Saved View save failed the Rules expression ceiling. Discussion/opens/device inputs are now confirmed; read-budget/cleanup/retained-history assumptions remain conditional. The owner confirmed longer Trash retention is allowed; its duration and volume remain unspecified.
- Final creation-event policy, full production schema/payload bounds and semantic deduplication beyond version-bound effects.

## Current authorized step

The owner authorized completing local query/workload validation and presenting the full assessment for decision. The prior combined run passed 192 tests; the extended candidate retained them but failed full Saved View persistence (236/237 passing). No filter deferral, weaker integrity policy or follow-on persistence redesign is inferred as approved. This does not authorize a commit, push, deployment, production Rules change, live recovery or expansion into complete account backup implementation. See the [assessment](firebase-verification-assessment.md).
