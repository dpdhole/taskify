# Slice2 Hosting preview

The original compatibility-smoke channel below is retired. Its exact verified
version is now served by [dev](https://taskify-dev-dpdhole--dev-por3atkf.web.app).
See the controlling [dev/QC/UAT policy](../hosting_channels.md) and migration evidence.
The record below describes the original publication.

23 October 2026. **Preview published and HTTPS/headless verification passed.**
The owner authorized preview hosting after committing the implementation. This
completes the pending preview execution checkpoint; owner acceptance/closure
review remains separate. No live promotion or Git push occurred.

- Preview: https://taskify-dev-dpdhole--compatibility-smoke-034mmzi5.web.app
- Project/site: taskify-dev-dpdhole; number243252492098.
- Channel: compatibility-smoke; version9ef40a2ed2ca3b65.
- Expiry: **30 October 2026, 12:59 IST** (07:29 UTC).
- Source: clean commit67e170e9902a98d8c39e119901c3d6137042298b.
- App0.1.0; build67e170e9902a-a937a4bd3a156123; contract revision1.
- [Artifact, cloud inventory and browser evidence](02-compatibility-preview-evidence.json).

## Executed sequence

1. Prepared an ordinary artifact using tools/build-hosting.mjs with the explicit
   PoC project environment. sourceDirty:false and publishable:true; app identity
   matches release.json. Source commit, policy and all artifact hashes were
   rechecked immediately before publication.
2. Passed local Hosting validation with --expect-compatible at390/1280px,
   including real Firestore readiness under the configured CSP.
3. Published only compatibility-smoke for seven days using the pinned CLI and
   --no-authorized-domains. No live release or Auth-domain synchronization.
4. Verified HTTPS HTML/JS/CSS/release hashes, cache/security headers, deep-link
   fallback and exclusions. Headless Chromium at390/1280px verified contract1,
   build identity, reload, no overflow or initial console/page errors, offline
   revocation and reconnect recovery. Network origins were only the preview and
   firestore.googleapis.com.
5. Detected one Browser key (auto created by Firebase) created during deployment,
   absent in the baseline. The Firestore-only client uses no key. Removed only
   that unused generated key after identity/inventory checks; did not request its
   value intentionally. The deletion response unexpectedly included the deleted key
   value; it was removed from evidence before staging/commit. Repeated HTTPS and
   both headless viewport checks successfully afterward.
6. Compared final metadata: billing remains disabled; live releases unchanged;
   database identity/deletion protection and Rules unchanged; no Web Apps, custom
   domains or active keys. Only the requested preview publication persists.

Publication command:

~~~powershell
node node_modules/firebase-tools/lib/bin/firebase.js hosting:channel:deploy compatibility-smoke --project taskify-dev-dpdhole --config firebase.hosting.json --expires 7d --no-authorized-domains --non-interactive --json
~~~

## Completion boundary

This artifact exposes the compatibility status surface, not product sign-in,
Tasks or the synthetic harness. Real Firestore revision1 reads and hosted lifecycle
recovery are verified. Contract-change/adversarial policy behavior retains its
separate local/emulator evidence; no additional policy revision was published.
The original [local/cloud validation](02-compatibility-validation.md) and frozen
Foundation evidence remain checkpoint records and are not rewritten.

Existing audit findings and bundle warnings remain disclosed in that report.
Headless checks were authorized; no visible windows or interactive logins were
used. Live promotion is deferred until development matures and requires explicit
owner approval. User backup/recovery remains FUTURE.
