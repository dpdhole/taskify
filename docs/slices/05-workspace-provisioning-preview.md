# Slice 5 — Dev preview

Published4 November2026; deployment documentation completed5 November2026.
Owner requested dev deployment and selected app0.2.0 with older clients blocked.

- [Open dev](https://taskify-dev-dpdhole--dev-por3atkf.web.app/).
- Clean, pushed release source: `02458ffb68d1280f86ff4545284fe6d76023ec3a`.
- App0.2.0; build `02458ffb68d1-6a446b9f4ba6aaed`; sourceDirty:false.
- Hosting version `40e35b075db747cb`.
- Expiry: **4 December2026,20:44 IST**.
- Shared compatibility revision2/serverRelease2; minimum/maximum app0.2.0.
- [Artifact, contract, Rules, hosted checks and resource evidence](05-workspace-provisioning-preview-evidence.json).
- [Approved release preparation and rollback floor](05-workspace-provisioning-release.md).

## Published and verified

Exact initialization Rules were deployed, then the compatibility contract was
published with expected-revision1 protection, then the pinned27-file artifact was
published to the existing dev channel. No Auth-domain synchronization was allowed.
App0.1.0 clients are intentionally blocked by the shared project contract. Hosting
channel separation does not isolate backend policy or data.

Destination HTTPS checks at390/1280px passed: all artifact hashes, security/cache
headers, internal-file exclusions, public release identity, actual compatibility
readiness, both enabled provider controls, refresh, offline/reconnect and no initial
browser errors or horizontal overflow. No real-provider sign-in was performed.
The final contract equals the approved candidate and deployed Rules bytes match
`firestore.workspace.rules`. Local release validation records367 unit/component,
70 integration and53 distinct headless browser cases; see release preparation for
initial infrastructure failures and focused successful reruns.

Before/after metadata confirms qc/uat/live Hosting states, billing, protected
asia-south1 database, providers/domains, Web Apps and intentional key metadata
unchanged. No key values or provider secrets were retrieved. Exactly dev/qc/uat
preview channels remain. Temporary verification emulators/servers are stopped;
the existing local5173 server remains available.

## Owner acceptance still pending

1. Open dev and refresh to load app0.2.0; confirm the version in Technical details.
2. Sign in with an existing Google or Microsoft test account. An Auth identity
   without a workspace should receive first-use initialization; deletion is unnecessary.
3. Confirm Loading reaches Workspace ready with the expected name/timezone.
4. Refresh, Logout and sign in again; confirm settings persist and account details
   disappear after Logout. Repeat at desktop/mobile widths and with another account.

This publication does not close Slice5 or accept hosted provisioning/provider
flows. Slice4 stays held; Slice5A deletion and Slice9 onboarding remain separate.
The rollback floor remains0.2.0 with retained schemas/fences and confirmed progress.
Deployment documentation was written after building/publishing; it does not cause
another build, release, commit or push.
