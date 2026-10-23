# Slice2 implementation and cloud checkpoint

23 October 2026. Implementation and the approved Firestore checkpoint are complete in the working tree. Review and clean-source preview publication remain pending. Changes are prepared for staged owner review; no implementation commit or push has occurred. The accepted [specification](02-compatibility-gate.md)
remains the scope baseline; this record distinguishes implementation choices,
local evidence and the separately gated cloud checkpoint.

## Concrete implementation choices

| Item | Choice |
|---|---|
| App identity | `0.1.0`; build fingerprint combines source/config/environment hash and Git revision |
| Domain/application | Shared strict decoder, numeric version predicate, revocable generation gate, revision regression/reuse protection and protected test consumers |
| Rechecks | Boot/resume/reconnect explicit server read plus one metadata-aware listener; 15-second verification deadline; no per-command fetch or timer retry loop |
| UI | Small ordinary status/retry/update surface; no sign-in or Tasks; unconfigured builds fail closed without contacting a default cloud backend |
| Test entry | Separate `compatibility.html` / `dist-compatibility`; memory/emulator adapters and local command controls; excluded from ordinary bundles/dev access |
| Provider | Memory cache only; demo targets require explicit loopback. Cloud target pinned to `taskify-dev-dpdhole`; optional Web App ID must match its project number |
| Public read configuration | Explicit `VITE_TASKIFY_PROJECT_ID`; this unauthenticated Firestore-only client can initialize without Auth/API-key/Web-App registration. Verified against real Firestore without an API key or Web App registration |
| Cloud Rules candidate | `firestore.compatibility.rules`; exact singleton get, no lists/client writes/other access |
| Emulator write fixture | Separate test-only policy scoped to synthetic test identities/records; never deployed |
| Publication | Trusted local CLI tool reuses the domain decoder, checks project/number/billing/deployed Rules, transactionally compares expected revision and document concurrency token, verifies server result; no automatic login/retry |
| Schema retention | Publication cannot silently remove previously declared retained schemas or regress server policy generation; migration/retirement tooling is outside this slice |
| Hosting CSP | Deliberately permits only `https://firestore.googleapis.com` connections; no general network wildcard |

The operator tool uses the existing pinned CLI's authenticated REST client, not
a new server tier or new dependency. Contract validation is shared with the
browser. An unknown publication result requires revision/hash reconciliation
before another attempt; a rollback request does not undo a committed transaction.

## Validation and checkpoint result

See [validation](02-compatibility-validation.md) and its exact-input evidence.
61 unit/component, 7 integration and 8 Chromium checks passed. The final fast run
passed; a sandbox hub startup timeout was followed by a successful service-only
run outside the sandbox. No browser-test retries were used. Hosting-policy local
checks also passed for the explicitly configured cloud client.

The owner explicitly approved database creation, minimal Rules, revision 1
bootstrap and headless checks using existing Firebase sign-in. Executed:

1. Verified project taskify-dev-dpdhole /243252492098, active state, disabled
   billing and empty database/Rules baseline. DNS failures before submission were
   reconciled with a fresh read before creation; no mutation was blindly retried.
2. Created Standard/Native (default) in asia-south1, freeTier:true and
   DELETE_PROTECTION_ENABLED. PITR stays disabled; user backup/recovery is FUTURE.
3. Deployed only firestore.compatibility.rules through firebase.compatibility.json.
   No emulator fixture was deployed.
4. Transactionally bootstrapped config/compatibility/poc.json revision 1,
   serverRelease 1, app range0.1.0–0.1.0. Independent server read verified its hash.
5. Headless browser observed missing-policy blocking, then listener-driven readiness
   after publication. Offline revoked readiness; reconnect restored it. Narrow/wide
   viewports showed no horizontal overflow and matching app/release build identity.
6. Independent unauthenticated REST: singleton GET200; list, other-document GET
   and attempted PATCH403. Post-inventory: billing disabled; no active API keys,
   Web Apps, custom domains or live Hosting releases.
7. Automatic review rejected an additional revision 2 mutation as outside explicit
   approval. It was omitted, never executed. Contract-change/incompatible/revision
   rollback behavior is evidenced locally, not relabelled as cloud validation.

The configured ordinary bundle is698.87KB /213.91KB gzip; unconfigured ordinary
bundle634.20KB /194.90KB gzip. Size warnings and the existing12 audit findings
(8high/4moderate/0critical) remain disclosed. No dependency pins changed.

## Remaining release gate

Review and owner-authorized commit are pending. Implementation changes are staged for owner review; no implementation commit or push has occurred. The local cloud-check artifact is explicitly dirty
and non-publishable. After a reviewed clean source commit, prepare and verify a
fresh artifact before the accepted compatibility-smoke preview checkpoint.
No cloud Hosting publication occurred in this implementation run. Live promotion
remains deferred until development matures and requires explicit owner approval.

The already completed bootstrap must not be rerun. Future approved publications
use --expected-revision and the next monotonic revision; an unknown outcome needs
revision/hash reconciliation before another attempt. Developer commands are in
[development](../development.md). No user backup/recovery, real Task model, product
sign-in or broad platform acceptance was added. Original Foundation/frozen
evidence remains unchanged.
