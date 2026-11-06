# Slice 4 — Dev preview

2 November 2026. Owner requested committing/pushing the staged checkpoint, then
publishing to dev. Publication and verification completed.

- [Dev preview](https://taskify-dev-dpdhole--dev-por3atkf.web.app/).
- Clean, pushed source: `05adff63914f5997f9b9cb1d43b6d1e0e3718d6f`.
- Implementation commit: `68a8e3b`; source includes the merged upstream Slice5/5A/6
  documentation. Executable inputs still match the validated checkpoint.
- App0.1.0, build `05adff63914f-c559a596a011da9f`, sourceDirty:false.
- Hosting version `eaf55fb912229e6e`; expiry **2 December 2026, 15:51 IST**.
- [Artifact, hosted checks and resource evidence](preview-evidence.json).

This release adds server-refreshed Sign-in methods and Google/Microsoft popup and
isolated redirect current-account verification. Provider linking remains disabled;
Slice4 is not complete. No workspace provisioning or new data permissions are added.

All 89 recorded code/config/test inputs match the 185-unit/component, 7-integration,
41-browser checkpoint. The merge changed documentation only. Auth mode was rebuilt
from the clean merged commit; the isolated publication folder contains only HTML,
JS, CSS and public release identity, with exact hashes recorded.

Local Hosting and destination HTTPS checks passed at 390/1280px: asset hashes,
headers/cache policy, deep-link refresh, internal-file exclusions, public build
identity, real Firestore compatibility readiness, both enabled provider controls,
reload, offline/reconnect recovery, no overflow and no initial browser errors.
No sign-in buttons were clicked; these checks do not establish hosted OAuth or
real mobile redirect acceptance. Those checks remain separate from emulator proof.

Only dev was published, for 30 days, with --no-authorized-domains. Before/after
metadata confirms qc/uat/live, billing, database/deletion protection, Rules,
providers/Auth domains, Web Apps and intentional keys unchanged. No credentials or
key values were retrieved. Only dev/qc/uat preview channels exist; live is unchanged.
The local manual server remains stopped. Deployment documentation is recorded
separately from the published source; it does not trigger another deployment.
