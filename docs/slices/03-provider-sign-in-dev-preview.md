# Slice 3 Auth preview — dev

23 October 2026. Published and HTTPS/headless verification passed.

- [Dev preview](https://taskify-dev-dpdhole--dev-por3atkf.web.app).
- Hosting version `ed7c71c3d578e5de`; app0.1.0;
  build `adb902976e4c-6e922f6f8c40361a`.
- Expiry: **22 November 2026, 21:11 IST** (15:41 UTC).
- Source baseline `adb902976e4c47f78b70853ba8ca31430645ed23`,
  **uncommitted snapshot, sourceDirty:true**. The owner explicitly approved this
  exception after being shown the clean-commit deployment requirement. This does
  not change the normal clean-commit requirement for future releases/promotion.
- [Artifact hashes, effective Hosting config and validation evidence](03-provider-sign-in-dev-preview-evidence.json).

The Auth-mode artifact (`dist-auth`) replaces the prior compatibility-only dev
version. It exposes Google sign-in and minimal authenticated session presentation;
Microsoft, linking and workspace provisioning remain pending. The ordinary build
and original step evidence remain separate checkpoints.

Before upload, source hashes matched the validated Google checkpoint. The Auth
artifact was rebuilt with the same build identity, and build diagnostics were
moved out of its publication directory. Local Hosting checks and hosted HTTPS
checks at390/1280px passed: exact HTML/JS/CSS/release hashes, security/cache headers,
deep links and exclusions, enabled Google control after real Firestore readiness,
reload, offline revocation, reconnect and no horizontal overflow/initial errors.
No visible window, sign-in click or interactive OAuth was used. Real Google consent
and provider completion are unverified; the separate local Google tests use the
Auth emulator. Microsoft implementation and complete Slice3 acceptance remain open.

Only dev was published, with30-day expiry and `--no-authorized-domains`. Metadata
comparison confirmed qc/uat/live, billing, database/deletion protection, Rules,
Auth domains/provider configuration, Web Apps and intentional keys unchanged.
No backend deployment, staging, Git commit or push occurred. The temporary root
Hosting config was removed after saving its exact content/hash in evidence.
