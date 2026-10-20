# Taskify Gate 1 — isolated feasibility experiment

Baseline: `dpdhole/taskify`, `main` at `38a7fb7383ae99948f003d68fe7d77e8e4b20dfa`.
This directory is **not** a production implementation, approved Firestore schema, or validated security policy. Nothing is deployed or committed.

## Scope

- `firestore.rules`: deny-by-default user-scoped Tasks and Activity Events, with Task-side and event-side checks, ownership, audited state transitions, version increments and event immutability.
- `tests/security.test.mjs`: Firebase Rules Unit Testing / client SDK adversarial cases (ownership, non-audited write bypass, audited event pairing, lifecycle and pause combinations, missing/forged/orphan events, stale writes, replay, concurrent batches, rollback).
- Only Task and Activity Event are represented. Discussion/Todo cross-record writes and deletion remain out of scope.

## Run locally (requires package download and Firebase Firestore emulator)

```sh
npm install
npm test
```

`npm test` uses `firebase emulators:exec --project demo-taskify-gate1 --only firestore ...` and connects to localhost only. Run from this directory. No Firebase project provisioning or deployment is required.

## Evidence status — 2026-10-19

- JavaScript syntax check: `node --check tests/security.test.mjs` **passed**.
- `npm test`: **BLOCKED**, because this execution environment does not have `firebase-tools` installed and does not permit outbound package downloads. See `npm-test.log`.
- **0 emulator tests executed.** No Firestore Rules parse/compile result, semantic correctness, security pass, concurrency result or rule budget measurement has been established.

## Limitations and validation risks

1. This probe duplicates the full pre/post Task snapshots in the Activity Event, strictly as a proposed Rules-proof mechanism; Firestore document size, data-cost and long-term audit payload modeling require reassessment.
2. The probe's ordinary metadata whitelist is intentionally only Title and Reference; the full Task schema and ordinary metadata fields remain for later gates.
3. No actual Google sign-in is involved; emulator authentication fixtures test UID-scoped rules only.
4. No semantic exactly-once guarantee is claimed across distinct valid operation IDs.
5. `serverTimestamp()` sentinel resolution in nested event snapshots and Rules evaluation must be confirmed by the emulator; static checks do not validate it.
6. Task creation is a strict Draft-only baseline without an Activity Event; whether Task creation needs an event should be reconciled with the approved operation audit contract before production use.
7. The experiment covers the representative operation set but not the exhaustive domain edge-case matrix (especially closure warnings, temporal constraints and event history beyond current Task snapshot).
8. Security Rules access-call budget and expression limits have not been measured.

## Acceptance gate

Until the emulator suite executes and additional adversarial cases pass, classify Gate 1 as **INCONCLUSIVE**, not PASS.
