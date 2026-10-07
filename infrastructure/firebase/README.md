# Firebase Infrastructure

Firebase platform configuration for Taskify belongs here unless a Firebase CLI convention requires a root-level file.

Firebase CLI convention-required configuration lives at repository root in `firebase.json`; Firebase infrastructure source files remain here.

`firestore.rules` implements the Milestone 1–3 client authorization boundaries. The root config loads this file for the Firestore emulator. Index configuration remains pending.

With Node.js 22, pnpm 10, and JDK 21 or newer installed:

```sh
pnpm run test:firestore:rules
pnpm run test:api:integration
```

The Rules suite uses the Firebase client SDK and `@firebase/rules-unit-testing`. It requires the local emulator at `127.0.0.1:8080`, seeds fixtures with Rules disabled, clears them between tests, and executes assertions with mocked authenticated/unauthenticated clients. The API integration suite uses Admin SDK operations and does not verify Rules.

Approved scope, decisions, executed test evidence, and verification limits are recorded through [`docs/project_status.md`](../../docs/project_status.md). No production deployment is performed by these scripts.
