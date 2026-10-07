# Taskify

Taskify is a mobile-first, lightweight task and workflow application for individual use, with informal family collaboration as an additive capability. Heavyweight project-management functionality is intentionally out of scope.

## Repository

Taskify is maintained as a single pnpm workspace/monorepo.

```text
taskify/
├── apps/
│   ├── api/                 # Trusted backend/API
│   └── app/                 # Responsive React + TypeScript + Vite browser client
├── packages/
│   ├── api-contracts/       # Client/API protocol definitions
│   └── client-sdk/          # Official Taskify client abstraction
├── infrastructure/
│   └── firebase/            # Firebase platform configuration
├── docs/                    # Authoritative product and architecture documentation
├── tooling/                 # Repository-wide tooling when justified
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

The browser client is designed as one responsive application for mobile and desktop browsers. Future native clients may be added as separate applications when justified.

## Architecture Boundary

Client applications consume `@taskify/client-sdk`, which is defined against `@taskify/api-contracts`. Backend domain logic, authorization, persistence invariants, and trusted business actions remain private to `apps/api`.

```text
apps/app → packages/client-sdk → packages/api-contracts → apps/api
```

## Technology Baseline

- TypeScript
- Node.js 22 for the backend/runtime baseline
- ECMAScript Modules (ESM)
- pnpm workspaces
- React + Vite for the responsive browser client
- Firebase / 2nd-generation Cloud Functions for the trusted backend

No Nx, Turborepo, or other build-orchestration layer is currently adopted.

## Documentation

Start with [`docs/project_status.md`](docs/project_status.md).

It is the canonical entry point for project state and defines the complete authoritative document set. Approved architecture and product decisions are recorded in [`docs/decisions.md`](docs/decisions.md).

Chat history is not authoritative unless a decision or change is explicitly approved and recorded in the project documentation.

## Development Status

The workspace, initial API structure, and `createTask` backend slice are implemented. See `docs/project_status.md` for recorded verification scope and evidence. No client feature implementation is formally recorded.

Firestore Security Rules and client-SDK emulator tests are implemented and verified within the recorded local test scope. Index configuration is deployed to the approved development database with successful real-service Query Explain evidence. Development client Rules remain closed; Taskify's Rules and application features have not been deployed.

## Development Setup

Prerequisites:

- Node.js 22
- pnpm 10.34.6 (root-pinned for Corepack)
- JDK 21 or newer for Firestore-emulator tests

Backend runtime dependencies, TypeScript build tooling, Vitest, Firebase Emulator tooling, and Rules test dependencies are declared. Contract/API production builds and standalone Functions packaging are implemented. Linting, formatting, and client application builds remain separate pending work.

After installing declared dependencies with pnpm, run:

```sh
pnpm run build:api
pnpm run test:api:callable
pnpm --filter @taskify/api test --exclude '**/*.integration.test.ts'
pnpm run test:api:integration
pnpm run test:firestore:rules
pnpm run test:firestore:queries
```

The callable suite builds an ignored standalone artifact and uses local Auth, Functions, and Firestore emulators for `demo-taskify`. It performs no cloud deployment. See [`callable-verification.md`](infrastructure/firebase/callable-verification.md) for evidence and limitations.

## Project Governance

Taskify is a single-owner project. Material product, architecture, implementation, deployment, and repository changes require explicit owner approval before being treated as part of the project baseline.
