# Taskify developer setup

Foundation provides an isolated synthetic read proof. Slice2 adds the ordinary
compatibility gate and a separate compatibility harness. Auth mode adds incremental Google/Microsoft sign-in; Tasks and
provisioning remain pending. The ordinary entry is not
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
types), layer/cycle checks, lint/format, unit/component tests, four builds and module
isolation checks. verify:all adds locally owned Auth/Firestore/Hosting instances,
Rules/integration checks and Chromium tests. It stops those instances after tests.
Do not run concurrent emulator suites on the same ports.

## Local execution

- npm run dev: ordinary compatibility status surface on http://127.0.0.1:5173.
- npm run dev:proof: separate Foundation entry on the same development port;
  memory adapter by default. Its controls change synthetic memory data only.
- npm run build: ordinary dist output, including the gate and Firestore reader but excluding proof/harness controls.
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
Firestore websocket9150, proof preview4173, ordinary preview4174, compatibility preview4175 and dev5173.
An occupied port causes an error; the runner never kills an unrelated process.
It uses demo-taskify-foundation and its own .local/emulators cache. The first full
run downloads the CLI-selected Firestore binary; frozen gate1's old binary is not
silently reused. Network access is required for dependency/browser/emulator downloads.

Local configuration is in firebase.local.json and the Firebase adapter's strict
config decoder. Project/host/port substitutions are rejected; adding another
configuration needs deliberate implementation and tests. No .firebaserc is required; explicit deployment configurations pin approved targets. Public build configuration is not a place for credentials.

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

## Slice2 compatibility configuration and operations

Default builds deliberately fail closed without an explicit backend target and do
not contact cloud. Copy the public values in .env.example only when intentionally
running against the PoC. VITE_TASKIFY_PROJECT_ID=taskify-dev-dpdhole is sufficient
for this Firestore-only public-read client; API key and Web App ID are optional.
Do not put operator credentials in Vite configuration. Auth setup belongs to a
later slice. The adapter rejects unexpected projects and cloud/emulator mixing.

npm run build:compatibility builds the separate test harness in dist-compatibility.
It is never a Hosting publication artifact. Cloud Rules are exclusively
firestore.compatibility.rules through firebase.compatibility.json; Rules under
tests/support are emulator-only. Ordinary Hosting policy permits connections only
to https://firestore.googleapis.com. release.json is build metadata, never gate
policy; its build ID matches the compiled client.

Validate a contract offline:

~~~powershell
node tools/publish-compatibility.mjs --candidate config/compatibility/poc.json
~~~

The already executed revision 1 bootstrap must not be repeated. Subsequent
approved publications require --apply --account EMAIL --expected-revision N and
a candidate at N+1. The tool checks existing noninteractive credentials, target
identity, disabled billing, exact deployed Rules and transaction preconditions.
It does not retry conflicts or unknown outcomes; inspect the authoritative
revision and canonical hash before deciding what to do. Retained schemas cannot
be silently removed. Do not bypass this tool with an ad hoc overwrite.

Publication artifact preparation uses node tools/build-hosting.mjs, which rejects
a dirty source tree. --allow-dirty-local is exclusively for local checks; its
manifest explicitly says publishable:false. node tools/validate-hosting.mjs uses
owned loopback ports5002/4400/4500 and headless browsers to validate the Hosting
policy. Do not publish before review and a clean source commit. No live promotion
is approved.

The owner permits automated headless browser/emulator tests after port preflight.
Ask before visible browser windows, interactive sign-in or other interactive
tests because a parallel project may be active. Never stop unrelated processes.
See [Slice2 validation](slices/02-compatibility-validation.md) for cloud observations,
remaining acceptance gates and audit/bundle limitations.

## Hosting destination policy

Use only dev, qc and uat preview channels. A hosting/deployment instruction must
name the destination; ask if unclear. Do not host or renew automatically after
implementation, validation or commits. Promote verified artifact versions through
dev → qc → uat without rebuilding. UAT → live needs explicit owner approval when
the product is ready. See [channel policy](hosting_channels.md) for the current
URLs, expiry and migration evidence. Earlier per-slice channel names are historical.

## Slice3 configuration checkpoint

Auth-mode public SDK settings are kept in ignored `.env.auth.local`, separate
from ordinary test/build configuration. Run `node tools/check-auth-config.mjs`
to validate identity and the exact channel host allowlist without displaying the
key. The stable app factory composes Auth/session and Google/Microsoft flows in
Auth mode. See [configuration and provider verification](slices/03-provider-sign-in-configuration.md)
for callback URIs and Microsoft personal/work-school audience; see the
[closure record](slices/03-provider-sign-in-closure.md) for current acceptance.

## Auth/session implementation checkpoint

Run `npm run dev -- --mode auth` and open [localhost:5173](http://localhost:5173/).
Use localhost for real local OAuth; 127.0.0.1 is not an authorized real Auth origin
in the client configuration. `npm run build:auth` writes ignored `dist-auth`;
ordinary mode retains the compatibility-only surface. Auth mode reads
`.env.auth.local`. Both Google and Microsoft controls are implemented.

The [session checkpoint](slices/03-provider-sign-in-session.md) records restoration
and Logout. The [Google checkpoint](slices/03-provider-sign-in-google.md) and
[Microsoft checkpoint](slices/03-provider-sign-in-microsoft.md) record provider
behavior and historical local validation. Slice3 and the current responsive login
presentation are owner-accepted as of 2 November 2026. Google and Microsoft
personal-account workflows were owner-verified on desktop/mobile; work/school
testing is deferred until product/features mature. Retain technical diagnostics
during slice development. See the [closure record](slices/03-provider-sign-in-closure.md).
The [presentation checkpoint](slices/03-provider-sign-in-presentation.md) and
[earlier desktop acceptance record](slices/03-provider-sign-in-acceptance.md) retain
their original source/test scope; the newer closure record controls current status.

On 23 October 2026 the owner requested this local Auth preview; the server started
on a checked-free port 5173 and localhost returned HTTP 200. No interactive OAuth result
is inferred from server availability. Do not stop this server or another project's
process without explicit direction. Full headless checks need port 5173 free and add an
owned session-test Vite server on port 5176; its emulator fixture is denied in ordinary
dev and excluded from static artifacts. The runner refuses occupied ports.
Confirm before interactive tests. Existing dev still serves the earlier Google-only
snapshot; Microsoft changes require a separate channel-specific deployment request.

## Current acceptance review

Acceptance tests served the clean `c765972` artifact with
`npm run preview -- --outDir dist-auth --port 5173`, rather than a changing Vite
development build. Interactive automation is paused; the preview was left running
for owner manual testing. Do not stop it or resume interactive tests as a side
effect of documentation, staging or commits. Manual Microsoft personal results
are owner-reported; the browser/OS was not separately identified. Work/school,
hosted mobile and operational provider checks remain open. No new test results or
provider success are implied by staging these acceptance records.

## Slice4 incremental Sign-in methods screen

In Auth mode, the authenticated landing now opens Sign-in methods. Opening or
explicitly refreshing the screen reloads provider status from Firebase Auth for
the current UID. The screen shows Google/Microsoft Linked or Not linked only
after verification; failures/blocked compatibility show unavailable status.
Back restores keyboard focus and Logout remains accessible. Adding another
method is not available yet. Linked Google/Microsoft methods now offer popup
verification of the current account. No account linking or Firestore permissions/records change.

The [Slice4 status checkpoint](slices/04-identity-linking-status.md) records tests,
project preflight and the owner-accepted SDK mutation boundary. The [popup proof checkpoint](slices/04-identity-linking-proof.md) adds fresh
reauthentication, wrong-account guidance and cancellation. Popup blockers require
allowing popups or explicit redirect verification. The [redirect checkpoint](slices/04-identity-linking-redirect.md) adds an isolated SDK-managed session context for the same UID; hosted coarse-pointer devices select redirect. Return handling opens Sign-in methods only after session/compatibility readiness and a current provider reload. Linking/outcome verification is next.
Provider automatic-resolution behavior remains a feasibility item. This work has
not been deployed; interactive provider testing remains separately approved.


### Verification and browser visibility

[Visibility recovery](slices/04-identity-linking-visibility.md) corrects the popup-return
case where the session was ready but Sign-in methods remained blocked. Nonmutating
proof waits for resumed server readiness and a fresh provider reload. Logout,
identity changes and hard compatibility failures still invalidate proof. The
headless session fixture now shares production lifecycle event wiring, with explicit
hidden/resume ordering checks; hosted Google/Chrome retest remains outstanding.


[Provider-status feedback correction](slices/04-identity-linking-checking.md) keeps
metadata reads off primary Auth notifications using a memory-only SDK-owned copy.
The shared Auth/Firestore browser case detects listener-driven retry loops; automatic
recovery is bounded. Refresh the local page after these controller/runtime changes
before manual acceptance. The running manual preview is preserved during focused tests.


### Linking checkpoint — unit validation only

[Explicit provider linking](slices/04-identity-linking-implementation.md) adds fresh
current-method proof, explicit target continuation, UID-bound SDK linking and status
reconciliation. Standalone verification is not reused as a grant. Redirect return
processing cannot automatically replay mutation; uncertain status checks are reads.
The owner requested unit-only tests and held full-slice/regression testing until
prompted. Do not treat staging/commit or this implementation as revoking that hold.
The existing browser fixture has action wiring, but no linking browser/emulator or
real-provider acceptance is claimed. No new provisioning template is needed.

## Current owner hold and next development slice

Slice 4 is open and on hold; defer the reported local verification-cancellation
defect and proceed to Slice 5 provisioning. See the
[hold and handoff](slices/04-identity-linking-hold.md) for impact and resumption
criteria. Do not treat historical unit evidence as reproduction of the defect or
proof that shared sign-in/restoration/Logout are unaffected. Keep full-slice and
regression testing held until prompted. Single-provider provisioning must not
require current-account linking proof. No Slice 5 code is included in this update.

## Slice5 initialization policy commands

Generate/check the reviewed source policy with `npm run generate:workspace-rules`
and `npm run check:workspace-rules`. The latter is part of `npm run verify`.
Run the isolated loopback production-policy suite with
`npm run test:workspace-rules:local`; Java21+, installed dependencies and the
cached emulator are required. It preserves the manual preview on5173 and never
deploys. See the [Rules checkpoint](slices/05-workspace-provisioning-rules.md)
for test evidence, shared timezone/profile limits and outstanding adapter/UI work.
New `firebase.workspace.json` is an explicit future deploy target; using the test
command does not publish that policy or change current cloud compatibility Rules.
