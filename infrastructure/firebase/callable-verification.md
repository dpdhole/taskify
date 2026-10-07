# API build and callable HTTP verification

Status: Implemented and Verified within the recorded local build/package/emulator scope, with project-owner approval to record this status and commit/push. No cloud Functions/Rules deployment or billing change occurred.

## Build and package

- Working-tree changes are based on `3e3455d5f6f4b97969f21a176d44c9a03158e013` and approved through DEC-071–DEC-073.
- Compiler: TypeScript 5.9.3; Node 22 typings resolved to 22.20.5. Runtime: Node 22.23.3, pnpm 10.34.6.
- Both contract and API production TypeScript builds passed. A first API build exposed nine TS2345 errors from ApiError's inferred message type; the owner approved `message: string = code`, which fixed compilation without changing runtime behavior or public error mapping.
- Standard Corepack rejected the pre-existing `pnpm@10` packageManager field. The owner approved the exact `pnpm@10.34.6` pin, and standard Corepack version selection succeeded after that change.
- The standalone artifact is `apps/api/dist/firebase`; its production manifest contains only `firebase-admin`, `firebase-functions`, `date-fns`, and `@date-fns/tz`. It has Node 22 ESM metadata, an entry point of `index.js`, and its own generated pnpm lockfile. Type-only contract imports are erased and checked; the source workspace boundary is preserved.
- An isolated install initially stalled on npm metadata requests. The cached/offline retry succeeded with 240 production packages. Resolved versions: firebase-admin 13.10.0, firebase-functions 6.6.0, date-fns 4.4.0, @date-fns/tz 1.5.0. A subsequent complete `pnpm run package:api` succeeded, skipped resolution with its preserved lock, and retained the same SHA256 lockfile digest.
- Smoke checks loaded the standalone ESM entry, confirmed the `createTask` export, and confirmed every runtime dependency resolves inside the artifact rather than through workspace ancestors.

## Executed suites — 2026-10-07

| Suite | Result | Duration |
|---|---|---|
| API unit | 39 passed; 2 files; exit 0 | 2.34 seconds |
| Callable HTTP transport | 15 passed; 1 file; exit 0 | final 11.94 seconds; initial 11.33 seconds |
| API Firestore integration | 25 passed; 1 file; exit 0 | 7.25 seconds |
| Security Rules | 174 passed; 1 file; exit 0 | 13.99 seconds |
| Preset queries / Explain tooling | 39 passed; 1 file; exit 0 | 3.03 seconds |

Total: 292 tests passed. All emulator sessions shut down successfully. The final complete `pnpm run test:api:callable` invocation ran through standard Corepack project-version selection after the approved pin, built/packaged/installed successfully, loaded the generated artifact under host Node 22, and exposed `createTask` at `http://127.0.0.1:5001/demo-taskify/us-central1/createTask`.

Callable coverage includes SDK email-link sign-in and returned emulator ID token, an emulator Google-provider credential fixture, authenticated creation with canonical identity and persisted Task/thread state, unauthenticated denial, protected-state spoof resistance, timed-date projection, six malformed-request cases, missing/foreign/archived Category rejection, malformed HTTP-envelope denial, and invalid bearer-string denial with no writes.

The API unit command was `pnpm --filter @taskify/api test --exclude '**/*.integration.test.ts'`. The transport command used the three local emulators and `vitest.callable.config.mts`; the existing integration/Rules/query suites were run sequentially in one `taskify-local` Firestore emulator session to avoid port/data contention.

## Reproduce

```sh
pnpm run build:api
pnpm run package:api
pnpm run test:api:callable
```

Use Node 22, the root-pinned pnpm 10.34.6, and JDK 21 or newer. The callable script uses `demo-taskify`, never the development cloud project. No Cloud Functions deployment command was run.

## Limits

- Emulator-issued ID tokens are unsigned; this evidence does not verify production signature/certificate checks, TLS, real Google OAuth, email delivery, or deployed Firebase provider configuration.
- The email-link fixture uses the emulator's web flow; its `handleCodeInApp` option is not supported by the emulator. Mobile link handling is not verified.
- The Functions emulator warned that the approved firebase-functions 6.6.0 baseline is older than latest. No major-version upgrade was introduced; a future upgrade/deployment plan requires compatibility review.
- ADC exists on this machine. The CLI warned about non-emulated services; the suite uses a demo project and guards all three local endpoints, and the tested operation accesses only the local Auth/Firestore services. No cloud fixture writes, service provisioning, or application deployment occurred.
- Cloud buildpack execution, Cloud Run/functions IAM and scaling, deployment-region selection, App Check, browser CORS behavior, real provider claims, client UI, and production operation remain separate workstreams.
- TypeScript production builds exclude tests; passing Vitest suites do not imply test-source type checking or full repository type checking.
