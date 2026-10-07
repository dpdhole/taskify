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

The repository/workspace skeleton is implemented. Application feature implementation and backend business implementation have not yet been formally recorded as implemented or verified.

Firestore Security Rules and the minimum intended composite-index set are approved designs awaiting implementation and verification.

## Development Setup

Prerequisites:

- Node.js 22
- pnpm 10

The workspace package boundaries are bootstrapped, but application dependencies, build scripts, linting, formatting, testing frameworks, and substantive Firebase configuration have not yet been installed or selected. Setup commands will be added as those implementation decisions are made.

## Project Governance

Taskify is a single-owner project. Material product, architecture, implementation, deployment, and repository changes require explicit owner approval before being treated as part of the project baseline.
