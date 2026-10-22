# Foundation Hosting deployment results

22 October 2026. **Preview deployment, HTTPS verification, update and exact
initial-artifact restoration completed.** [Execution evidence](hosting-deployment-evidence.json)
records source/artifact hashes, versions, browser checks and cloud metadata.
This completes the preview checkpoint in the [deployment plan](../hosting_deployment_plan.md).

- Preview: https://taskify-dev-dpdhole--foundation-smoke-jpbwhoel.web.app
- Project/site: `taskify-dev-dpdhole`; project number `243252492098`.
- Channel: `foundation-smoke`; expires **29 October 2026, 15:25:04 UTC**
  (20:55:04 IST), after the final deployment extended its seven-day lifetime.
- Operator: `dpdhole@gmail.com`; Node24.21.0, Firebase CLI15.34.1.
- Source: clean commit `70fbe98af307a0924f47b1d601f8e24f12eee285`.
  Built locally, not CI. No push performed; local tracking comparison shows five
  commits ahead of `origin/main` without a fresh remote fetch.

## Executed sequence

| Stage | Result |
|---|---|
| Clean artifact build | `node tools/build-hosting.mjs`; `sourceDirty:false`, `publishable:true`; saved exact output and SHA256 manifest |
| Local Hosting validation | `node tools/validate-hosting.mjs` passed on the committed artifact |
| Initial preview | Version `b359a67f5014aedb`; HTTPS/headers/hashes and mobile/desktop smoke passed |
| Rehearsal update | Version `86af71d432f9c7b0`; second clean build plus explicit HTML meta marker; release identity and HTML changed, application code unchanged |
| Update verification | Fresh browser checks and existing cached contexts at 390/1280px passed; new HTML marker and hashes observed |
| Exact original restoration | Version `2dc0cc644d30f778`; republished saved initial bytes, preserving original release identity |
| Restoration verification | Fresh and cached browsers observed original HTML without rehearsal marker; all original HTML/asset/release hashes match |
| Final resource comparison | Baseline assertions passed after generated-key cleanup; live Hosting unchanged; backend lists empty; no enabled-API or billing changes |

All three publications used this pinned command:

```powershell
node node_modules/firebase-tools/lib/bin/firebase.js hosting:channel:deploy foundation-smoke --project taskify-dev-dpdhole --config firebase.hosting.json --expires 7d --no-authorized-domains --non-interactive --json
```

Saved artifact copies and manifests remain ignored under
`.local/hosting-release/initial` and `update`. Final `dist` and the current local
manifest have been restored to the initial artifact. Restoring produced a new
Hosting version/release ID; the restored artifact bytes and public build ID are
the originals, not a new rebuild.

## Verified behavior

HTTPS root/deep-link refresh, exact HTML/JS/CSS/release SHA256, no-cache
HTML/release metadata, immutable hashed assets, CSP/nosniff/referrer headers,
excluded diagnostics/proof/Rules/env/maps, and browser loading at 390px/1280px
passed. Browser checks observed no console/page errors, horizontal overflow or
external/backend/proof requests. Excluded paths can return SPA HTML rather than
404; they did not return excluded content.

Existing browser contexts stayed open across update/restoration. Their reloads
served the expected changed/restored HTML, while unchanged hashed assets remained
usable. This exercises static HTML update/cache behavior; it is not a product
feature update or mixed client/schema rollout test.

The first rehearsal attempt timed out during initial browser navigation at
30 seconds, before any update was published. Its failed result is retained in
evidence. A fresh attempt used a 60-second navigation limit with explicit DOM
readiness, heading, hash and marker checks; it completed successfully. No hidden
retry or claim of a failure-free first attempt is made.

## Generated key finding and final cloud state

Post-deployment comparison detected a new `Browser key (auto created by Firebase)`
created at `2026-10-22T15:20:08.884126Z`, during the first deployment. Its exact
trigger was not isolated; this was an observed provider side effect. The old key
removed during the [clean start](firebase-clean-start.md) stayed deleted.

The SDK-free ordinary bundle does not use Firebase or this new key. The unused
new key was deleted, its operation completed, active keys were rechecked empty,
and the actual preview passed HTTPS/browser/hash checks again. No key string was
retrieved or written to evidence. Future deployments must repeat metadata
comparison: do not assume Hosting-only commands prevent every platform side
effect, or automatically delete intentional keys when SDK-backed slices arrive.

Final metadata confirms:

- Exact project ID/number remain ACTIVE; billing disabled, no linked account.
- No Firestore databases, Rules releases/rulesets, app registrations, buckets,
  custom-domain bindings or active API keys.
- Auth configuration still returns CONFIGURATION_NOT_FOUND; Functions API remains
  disabled. Neither was initialized/enabled for the smoke test.
- Live channel timestamp is unchanged and its release list remains empty. Only
  the intended preview gained three releases. Enabled API list is unchanged.
- External DNS remains outside this checkpoint.

## Completion boundary

The checkpoint validates operator permission and the static Hosting deployment
process, hosted delivery, cache/fallback policy, identification and saved-artifact
restoration. It does **not** validate product Auth/Firestore connectivity, Rules,
indexes, compatibility gating, quota fit, native live rollback or database recovery.
The existing 12-package dependency advisory disposition remains bounded and
unresolved; deployment does not make the audit clean.

Overall platform feasibility remains INCONCLUSIVE. User-driven backup/recovery
remains FUTURE. Live promotion is a separate owner decision. This report/evidence
update is not committed or pushed by the deployment action.
