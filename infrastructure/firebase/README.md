# Firebase Infrastructure

Firebase platform configuration for Taskify belongs here unless a Firebase CLI convention requires a root-level file.

Firebase CLI convention-required configuration lives at repository root in `firebase.json`; Firebase infrastructure source files remain here.

`firestore.rules` implements the Milestone 1–3 client authorization boundaries. The root config loads this file for the Firestore emulator. `firestore.indexes.json` contains the approved index configuration, now deployed to the development target with successful real-service planning evidence. See [query-plan.md](./query-plan.md) for mappings, tests, raw reports, and limits; [development.md](./development.md) defines the approved cloud target.

With Node.js 22, pnpm 10, and JDK 21 or newer installed:

```sh
pnpm run test:firestore:rules
pnpm run test:api:integration
pnpm run test:firestore:queries
pnpm run test:api:callable
```

The Rules suite uses the Firebase client SDK and `@firebase/rules-unit-testing`. It requires the local emulator at `127.0.0.1:8080`, seeds fixtures with Rules disabled, clears them between tests, and executes assertions with mocked authenticated/unauthenticated clients. The API integration suite uses Admin SDK operations and does not verify Rules.

The callable suite first packages the Node 22 API artifact, then starts Auth (`9099`), Functions (`5001`), and Firestore (`8080`) on localhost with the demo project `demo-taskify`. It uses SDK email-link authentication and real callable HTTP requests against the local artifact. Build details, test evidence, and production-verification limits are in [callable-verification.md](./callable-verification.md). `firebase.json` also contains a packaging predeploy hook; invoking an emulator test does not authorize or perform cloud Functions deployment.

Approved scope, decisions, executed test evidence, and verification limits are recorded through [`docs/project_status.md`](../../docs/project_status.md). No production deployment is performed by these scripts.

Category implementation and the expanded integration/callable evidence are recorded in [category-verification.md](./category-verification.md). Owner approved commit/push; formal Verified status and deployment remain held. Run the emulator suites sequentially because they share ports/data stores.
