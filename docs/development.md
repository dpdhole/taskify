# Foundation developer setup

The Foundation is a static skeleton plus an isolated synthetic read proof. It has
no sign-in, compatibility gate, Tasks or provisioning. The ordinary entry is not
an implemented Taskify workspace. See [slice detailing](slices/01-foundation.md),
[readiness](slices/readiness-check.md) and [dependency conditions](slices/01-foundation-dependencies.md).

## Setup and checks

Use Node **24.21.0**, npm **11.19.0** and Java **21+** for emulator checks.
Run from the repository root:

```powershell
npm ci
npm run setup:browsers
npm run verify
npm run verify:all
```

The tracked npm configuration enforces engine versions/exact dependency pins and
disables dependency lifecycle scripts. Explicit npm run commands still work.
Playwright's Chromium binaries are installed explicitly into ignored .local/browsers.
No global Firebase CLI, login, cloud project or deployment is required.

Fast verify runs strict types (including a core target without browser/Node global
types), layer/cycle checks, lint/format, unit/component tests, both builds and module
isolation checks. verify:all adds locally owned Auth/Firestore/Hosting instances,
Rules/integration checks and Chromium tests. It stops those instances after tests.
Do not run concurrent emulator suites on the same ports.

## Local execution

- npm run dev: ordinary static skeleton on http://127.0.0.1:5173.
- npm run dev:proof: separate Foundation entry on the same development port;
  memory adapter by default. Its controls change synthetic memory data only.
- npm run build: ordinary static dist output, excluding proof/business/SDK code.
- npm run build:proof: separate dist-proof artifact used by browser checks. Do not
  deploy it as the product. It can connect to the local emulator only when explicitly
  selected with ?source=emulator; full tests prepare that emulator and its fixture.
- npm run preview: ordinary built output at http://127.0.0.1:4173.

The proof navigation route is /inspect. Deep-link refresh and Back are tested.
There is no client-side product data write path; the sole synthetic document permits
get only, while writes/listing/other documents are denied. Test fixtures use local
privilege, never browser-shipped administrative code. Rules in tests/support are
explicitly local proof Rules, not a production candidate.

## Java, paths and ports

The full runner resolves the repo from its own file path. Java discovery uses
TASKIFY_JAVA_HOME, JAVA_HOME, or the copied sibling gate1/java21 directory if present,
then Java on PATH. An explicitly invalid TASKIFY_JAVA_HOME fails clearly. On another
machine, set it to a Java21+ home; no absolute PC-specific root is committed.
The runner makes PATH/JAVA_HOME changes for its child process only and uses the
selected Node executable explicitly (including Windows paths containing spaces).

Expected loopback ports: Firestore8080, Auth9099, Hosting5000, hub4400, logging4500,
Firestore websocket9150, proof preview4173, ordinary preview4174 and dev5173.
An occupied port causes an error; the runner never kills an unrelated process.
It uses demo-taskify-foundation and its own .local/emulators cache. The first full
run downloads the CLI-selected Firestore binary; frozen gate1's old binary is not
silently reused. Network access is required for dependency/browser/emulator downloads.

Local configuration is in firebase.local.json and the Firebase adapter's strict
config decoder. Project/host/port substitutions are rejected; adding another
configuration needs deliberate implementation and tests. No .firebaserc or live
deploy command exists. Public build configuration is not a place for credentials.

## Source boundaries

- domain: synthetic decoder/value; no framework/provider/global platform dependencies.
- application: typed read port and disposable session; no concrete adapter import.
- infrastructure: memory/Firebase translation and subscription cleanup.
- state: per-instance Zustand vanilla projection, no domain authority.
- ui: rendering, accessible controls and thin subscriptions; no direct SDK calls.
- app: composition and routing. Ordinary and proof entries are separate.

The boundary checker rejects forbidden relative imports, unsupported aliases,
external libraries in core and nonliteral imports; it checks static cycles.
The negative test proves forbidden imports are caught. Core business operations
should remain whole-operation ports when introduced in future slices; Foundation
adds no generic repository framework or speculative server package.

## Evidence and troubleshooting

Generated dependencies, .local downloads/logs, dist outputs and browser reports
are ignored. Preserve verification/firebase and docs/product_spec_legacy.md bytes;
formatters/lint intentionally target only the new application/test/tool sources.

- Missing browser: run npm run setup:browsers using the same local cache location.
- Missing Java: configure TASKIFY_JAVA_HOME, then rerun the full check.
- Port in use: stop its actual owner yourself; do not kill all Node/Java processes.
- Probe errors: verify local fixture/config; malformed values fail closed with Retry.
- Install engine mismatch: select the pinned runtime; do not force ignore engines.
- Audit warnings: follow the accepted Foundation-only conditions. Known findings
  remain reported; no audit fix --force or blanket major override is approved.

The [validation report](slices/01-foundation-validation.md) records exact local results and limitations. A synthetic
proof does not establish product compatibility, real Google/Apple sessions,
production indexes, actual quota costs, Safari/device support or leak-free behavior
for all future features. User backup/recovery remains FUTURE.
