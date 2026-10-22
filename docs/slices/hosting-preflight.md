# Foundation Hosting preflight

**Historical pre-reset snapshot:** the owner later requested a clean start.
Legacy-preservation statements below describe the earlier checkpoint and are
superseded by [clean-start results](firebase-clean-start.md).

22 October 2026. Owner authorized step-by-step implementation of the
[deployment plan](../hosting_deployment_plan.md). Cloud publication is pending.
Recorded inputs, inventory and validation results are in
[preflight evidence](hosting-preflight-evidence.json).

## Verified inventory

Authenticated operator: `dpdhole@gmail.com`, using pinned Firebase CLI 15.34.1.
Firebase Management GET independently matched project `taskify-dev-dpdhole`,
number `243252492098`, display name Taskify Development, state ACTIVE.
Resource inspection used GET requests only; no user documents, Auth users or
Storage objects were read. OAuth login/token handling is separate from resource
inspection. No APIs were enabled or resource configurations changed.

| Resource | Observed metadata | Disposition |
|---|---|---|
| Billing | `billingEnabled:false`; no linked billing account | Consistent with free-only direction; no billing change |
| Hosting | One DEFAULT_SITE, `taskify-dev-dpdhole` | Use existing site |
| Channels/releases | Only `live`; live release list empty, no next page | Preserve live; first validated preview establishes artifact baseline |
| Custom domain | `dev.taskify.it.com`, DOMAIN_ACTIVE, CERT_ACTIVE, DNS_MATCH | Retain binding; no external DNS change or independent reachability claim |
| Firestore | `(default)`, FIRESTORE_NATIVE, `asia-south1` | Retain database/data/Rules/indexes; no content reads |
| Storage | Bucket list empty, no next page | No buckets observed; no changes |
| Functions | HTTP403: API unused or disabled | Unverified; leave API disabled, do not infer that every historical resource is absent |
| Auth | Admin configuration GET returned HTTP404 CONFIGURATION_NOT_FOUND | Unverified; no user/provider setup or changes |

Raw filtered inventory and npm audit remain ignored at
`.local/hosting-preflight/inventory.json` and `audit.json`. They contain no tokens.
Inventory observed at `2026-10-22T11:20:49.267Z`; it is a point-in-time check.

## Deployment tooling reassessment

Fresh npm audit: 12 affected packages, 8 high/4 moderate/0 critical; unchanged
from the [Foundation assessment](01-foundation-dependencies.md).
No dependency pins or overrides changed. Findings remain unresolved.

| Finding | Hosting-only assessment and conditions |
|---|---|
| braces/chokidar | Trusted, fixed repository/config/file patterns only. No uploaded/untrusted glob inputs. Static preparation still loads CLI dependencies; no claim that they are absent |
| OpenTelemetry baggage | No public tracing receiver or inbound untrusted baggage propagation is configured. Pub/Sub is not selected, but its helper can load; this is a bounded reachability assessment, not removal or universal safety proof |
| uuid/gaxios | Previously inspected call uses v4 without caller buffer; deployment uses authenticated HTTPS to Google APIs. Other consumers are not exhaustively proven safe |
| grpc-js/Firestore | Ordinary 15-module app build excludes Firebase. Hosting does not start a gRPC server or use certificate-derived server identity; CLI imports may still load backend modules |

This reassessment covers this owner-operated static preview workflow only;
it does not extend to product backend use or untrusted CI inputs. Reassess after
lock changes or service expansion. The audit-suggested major downgrades are not
applied without compatibility investigation. No claim of a clean audit follows.

References: [OpenTelemetry advisory](https://github.com/advisories/GHSA-8988-4f7v-96qf),
[braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
and the remaining primary-source links in the Foundation assessment.

## Prepared configuration and local checks

`firebase.hosting.json` contains only Hosting: explicit existing site, ordinary
`dist`, SPA fallback, no-cache HTML/release metadata, immutable hashed assets,
nosniff/referrer/CSP headers. CSP disallows network connections for this SDK-free
build; revise deliberately when later slices add backend connectivity.
RE2 rules match both URL separators and Windows emulator-normalized paths.
The build removes `module-graph.json` from publication output, in addition to
config exclusions. No proof entry, test Rules, maps or credentials are included.

Repeat from repository root:

```powershell
# Local preparation only; deliberately marks the artifact non-publishable.
node tools/build-hosting.mjs --allow-dirty-local
node tools/validate-hosting.mjs
```

The validation runner creates an ignored config with the same Hosting policy,
substituting a demo project and loopback ports 5002/4400/4500. It rejects occupied
ports and uses the CLI's emulator cleanup. It does not deploy to Firebase.
Chromium must be installed using the Foundation browser setup.

Passed: root and deep-link refresh, exact served HTML/asset/release hashes,
cache/security headers, excluded-file non-disclosure, no browser console/page
errors, no external/backend/proof requests and no horizontal overflow at 390px
and 1280px. Emulator fallback can return index HTML for excluded paths; a 200
fallback is not disclosure of the excluded file. This is local evidence only.

Initial validation attempts exposed sandbox loopback restrictions, an absolute
path error in the temporary validation config, Windows glob normalization, and
the emulator serving an ignored diagnostic file. The temporary path was fixed,
portable RE2 policies adopted, and diagnostics physically removed by the build.
The final checks passed; cloud behavior still needs independent verification.

## Publication checkpoint and remaining steps

Review and commit the prepared changes before publication, as required by plan
step 7. The default artifact builder rejects a dirty workspace. Its local bypass
does not authorize publishing; current output explicitly has `sourceDirty:true`
and `publishable:false`. Public `release.json` contains only commit/build identity
and dirty state; the detailed SHA256 manifest remains local.

After the reviewed commit, run the artifact builder without the local bypass,
then validate. Save the complete first artifact and its manifest before publishing.
Retain that saved artifact for the update/restoration exercise; rebuilding it
generates a new release identity and is not an exact restoration.

Intended publication command, **not executed**:

```powershell
node node_modules/firebase-tools/lib/bin/firebase.js hosting:channel:deploy foundation-smoke --project taskify-dev-dpdhole --config firebase.hosting.json --expires 7d --no-authorized-domains --non-interactive
```

The explicit `site` in the single Hosting config selects the site. Do not use
`--only hosting`: this preview command interprets `--only` values as Hosting
targets and prefixes them itself. The config contains no other deployable service.
`--no-authorized-domains` is essential: inspected CLI command source otherwise
adds/cleans Firebase Auth domains during preview deployment. Never substitute
`firebase.local.json`, `firebase deploy`, or an unqualified live publish.

Pending: clean committed artifact, publication permission proof, actual HTTPS
desktop/mobile/headers/fallback/identity verification, second preview artifact,
exact first-artifact restoration, final resource-metadata comparison and results.
GitHub push authentication remains a separate issue; a local commit is not a
remote/CI build. No staging, commit, push, channel creation or cloud publish has
occurred in this checkpoint.

Configuration reference: [Firebase Hosting configuration](https://firebase.google.com/docs/hosting/full-config).
Billing inspection: [Cloud Billing GET](https://docs.cloud.google.com/billing/docs/reference/rest/v1/projects/getBillingInfo).
