# Foundation Hosting deployment plan

22 October 2026. **Preview checkpoint completed: published, verified, updated and exact original artifact restored.**
See [preflight results](slices/hosting-preflight.md). Authentication and GET-only metadata
inspection occurred. The owner subsequently authorized removal of legacy resources;
see [clean-start results](slices/firebase-clean-start.md).
[Deployment results](slices/hosting-deployment.md) record the completed preview
checkpoint and final cloud comparison; live promotion remains a separate decision.

## Owner-designated target

- Project ID: `taskify-dev-dpdhole`.
- Project number: `243252492098`.
- Purpose: reuse the legacy project as PoC/testing, beginning with Hosting only.

The owner-supplied project ID and number were independently matched through the
Firebase Management API. Billing is disabled with no linked billing account.
The earlier inventory is a historical snapshot. The owner explicitly instructed:
"Do not preserve legacy resources. Perform clean start." Legacy Firestore, Rules,
custom-domain binding and browser API key are now deleted and independently
verified absent from active lists. The project identity and empty default Hosting
container remain. Hosting publication permission is proven; product Auth/Firestore
behavior remains unvalidated.

## Recommended approach

| # | Decision | Recommendation |
|---:|---|---|
| 1 | Initial channel | An expiring preview on the verified empty default Hosting site |
| 2 | Artifact | Ordinary dist only; exclude dist-proof, diagnostics, fixtures and credentials |
| 3 | Configuration | Separate Hosting-only config, explicit project/site selectors; never cloud-deploy firebase.local.json |
| 4 | Legacy resources | Clean start completed under explicit owner instruction; no legacy migration or preservation |
| 5 | Recovery rehearsal | Restore a previously validated static artifact on preview; live promotion is a separate decision |
| 6 | Outcome | Validate Hosting delivery/process; do not claim Auth/Firestore connectivity or platform acceptance |

Selected operator: `dpdhole@gmail.com`; existing site: `taskify-dev-dpdhole`;
preview: `foundation-smoke`, seven days, now deployed and verified; final expiry
is 29 October 2026, 15:25:04 UTC.
Live has no release history; the saved first validated preview artifact established
the restoration baseline and has been restored exactly. The old domain binding and backend database/Rules are
removed; provision new backend resources in their relevant later slices.

## Ordered steps — preview checkpoint completed

| Step | Action when implementation is authorized | Completion evidence |
|---:|---|---|
| 1 | Confirm scope and operator | Named project, Hosting-only preview work, expected channel lifetime and authorized Firebase account |
| 2 | Verify CLI authentication/project identity | Use pinned CLI; authenticate if needed; independently match project ID and number. Firebase permission is separate from GitHub push authentication |
| 3 | Read-only legacy inventory | Inspect plan/billing, sites/domains, live/preview release metadata and presence of Auth/Firestore/Functions/Storage without retrieving user content. Identify exact reset targets and service/platform constraints |
| 4 | Clean start, select Hosting site and restoration baseline | Remove identified legacy application resources under owner authority; verify their active lists are empty. Keep the immutable project identity/default site; select preview baseline |
| 5 | Reassess deployment-tool advisories | Existing exceptions cover local Foundation tools only. Assess authenticated cloud publication and document its conditions before cloud publication |
| 6 | Prepare Hosting-only configuration | Add a separate config containing ordinary dist, SPA fallback, reviewed headers/ignores and explicit site selection. No Firestore, indexes, Auth, Storage, Functions, emulators or functions rewrites |
| 7 | Build an identified artifact | Use pinned runtime/lockfile and an identified clean commit; run relevant checks, build ordinary dist and inspect exclusions. Record Git SHA, build ID, config/asset fingerprints and public release metadata without secrets |
| 8 | Validate proposed configuration locally | Check entry/deep-link fallback, JS/CSS, headers/cache policy, release identity and excluded paths. Existing local tests do not certify the newly added deployment config |
| 9 | Publish expiring preview | Use pinned CLI and explicit project/config/site/channel selection; publish Hosting content/config only. Capture URL, expiry and release/version IDs; use the verified empty baseline without provisioning backend services |
| 10 | Check the actual hosted release | HTTPS, root/deep-link refresh, asset delivery, headers, desktop/mobile smoke, no console errors, correct release identity and no localhost/backend/proof requests or exposed diagnostics/fixtures |
| 11 | Exercise update/restoration | Publish a second identified static artifact on preview, then restore the saved prior artifact. Verify served identity/hashes and absence of stale HTML/asset mismatches; this is artifact restoration, not database rollback or native live-channel rollback proof |
| 12 | Record results and next decision | Record commands, operator/project/site, URLs/expiry, fingerprints, checks, advisory disposition and remaining gaps; compare against the clean-start baseline. Decide separately on live promotion; commit/push only when instructed |

## Gates and boundaries

- The owner authorized a clean start after inventory, superseding preservation.
  Database deletion, obsolete Rules, old domain binding and legacy browser-key
  deletion are complete. No legacy content is migrated. The default Hosting site
  cannot be deleted; it is empty and reused. Project/IAM/system infrastructure
  stays in place. External DNS was not changed. Live publication remains separate.
- Confirm the free-only PoC direction against actual project configuration. If
  the legacy project is already Blaze/uses paid resources, report and agree next
  steps; do not silently upgrade/downgrade billing or enable paid dependencies.
- Current proof adapter accepts only demo/localhost. Do not repoint it to real
  Firestore or deploy the synthetic local Rules to this project.
- Exclude module-graph.json, sourcemaps/debug output and unnecessary internal
  metadata. A minimal public build identifier may be added during implementation;
  it is not the future app/server compatibility contract.
- Compare metadata after publication. This run observed an auto-created browser
  key and removed it because the SDK-free build did not use it. Do not assume
  every Hosting-only command is free of platform side effects; do not auto-delete
  intentional keys needed by later SDK-backed slices.
- Preview URLs are public and share their configured real backend resources.
  This ordinary build makes no Firebase calls, but future previews require
  deliberate backend isolation; a preview channel alone is not a sandbox.
- No Firebase Web App registration/SDK configuration is needed merely to serve
  the current SDK-free ordinary build. Defer provider/database setup to its scoped work.
- GitHub write authentication remains a distinct outstanding issue. Record if a
  release's source commit is local/unpushed; do not present it as a remote/CI build.

## Validation scope

| Can establish | Does not establish |
|---|---|
| Operator/CLI Hosting publication permission | Google/Apple sign-in, linking or Auth sessions |
| Static delivery, HTTPS, fallback and chosen headers | Browser Firestore reads/writes, deployed Rules/index correctness |
| Build identification, preview update and prior-artifact restoration | Compatibility contract publication and lifecycle gating |
| Hosted-origin browser loading | Product Task behavior, quota fit or full client/server/schema rollout |

Overall platform feasibility remains INCONCLUSIVE. User-driven backup/recovery
remains FUTURE, not a new deployment prerequisite. All preview checkpoint steps
are executed and recorded against clean source commit `70fbe98`. Actual HTTPS,
390/1280px browser checks, cache/header/fallback/hash checks and saved-artifact
restoration passed. A rehearsal navigation timeout and an unexpected generated
key were recorded; the unused key was deleted and final checks passed. No live
release was created. Live promotion and committing the new results remain
separate owner decisions.

## Official references

- [Hosting quickstart](https://firebase.google.com/docs/hosting/quickstart)
- [Preview/deploy and backend behavior](https://firebase.google.com/docs/hosting/test-preview-deploy)
- [Hosting config, headers and ignored paths](https://firebase.google.com/docs/hosting/full-config)
- [Release/channel/version management](https://firebase.google.com/docs/hosting/manage-hosting-resources)
