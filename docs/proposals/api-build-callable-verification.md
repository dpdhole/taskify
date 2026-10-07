# API build and callable transport verification

Status: Approved, implemented, and Verified within the recorded local scope on 2026-10-07; archived review record. Owner approved recording that status and commit/push. Build and emulator evidence is recorded in [callable-verification.md](../../infrastructure/firebase/callable-verification.md). Authoritative design decisions are DEC-071–DEC-073 in [decisions.md](../decisions.md), with architecture in [backend_architecture.md](../backend_architecture.md). No cloud deployment or billing change is included.

## Proposed build

- Add TypeScript 5.9.3 as a workspace development compiler and Node.js 22 typings as an API development dependency.
- Build `packages/api-contracts` first, expose its compiled type/runtime entry points, then compile `apps/api` to Node-compatible ESM with a production-only TypeScript configuration that excludes tests.
- Generate an ignored standalone Firebase Functions artifact under `apps/api/dist/firebase`, containing the emitted API files and a Node 22 ESM package manifest. Preserve the workspace source dependency boundary; remove the type-only contract package from the generated runtime manifest only after checking emitted JS has no runtime reference to it.
- Install the artifact's production dependencies and generate its pnpm lockfile independently of the workspace. Do not introduce a new package manager, bundler, or committed workspace lockfile in this step.
- Configure Firebase Functions to load this generated artifact, with a build/package predeploy hook. No Functions deployment is authorized by this local setup.
- Add Auth at `127.0.0.1:9099` and Functions at `127.0.0.1:5001`; retain Firestore at `127.0.0.1:8080`.
- Use a local demo project ID for the callable test suite and require all three emulator endpoints before touching fixtures. The existing development cloud target and emulator test scripts retain explicit project selection.

## Transport test scope

- Use the real Firebase client SDK callable implementation, Auth emulator user/token flow, Functions emulator entry point, and Firestore emulator.
- Verify authenticated success, canonical authenticated email, spoofed identity/protected-field resistance, unauthenticated denial, malformed requests, category authorization, TaskDate persistence, and stable public error responses.
- Seed Categories only in local Firestore fixtures; no Category implementation or cloud fixture writes are added.
- Add direct HTTP protocol checks for malformed envelopes and invalid tokens where they exercise behavior beyond the client SDK.
- Run the appropriate existing API, Rules, and query regression suites and record observed evidence separately from approved/implemented state.

## Decisions and failures

Report compiler, packaging, emulator, or implementation failures before making production-code corrections outside the approved build setup. Runtime/business behavior changes require owner approval. Real provider verification, deployed functions, cloud Rules deployment, Firebase client feature implementation, service-account setup, and production/billing changes remain separate.

### First build finding

The contract package compiled successfully. The API production build reported nine TS2345 errors: ApiError's defaulted message parameter was inferred as ApiErrorCode, while existing calls supply custom string messages. The owner approved explicitly typing the parameter as `message: string = code`; it was applied, preserving runtime behavior, and both production builds then passed.
