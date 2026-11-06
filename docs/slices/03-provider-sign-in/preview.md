# Slice 3 — Current dev preview

> This is the recorded 23 October publication checkpoint. [2 November acceptance](closure.md)
> supersedes its pending Slice3 acceptance statements; its artifact hashes and
> deployment checks remain historical evidence of that publication.

23 October 2026. Owner requested deployment to dev. Published and verified.

- [Dev preview](https://taskify-dev-dpdhole--dev-por3atkf.web.app).
- Clean source commit `fb629e482551e7474732ebd582b8a818310afd88`.
- App0.1.0, build `fb629e482551-dc4f80bbb0fcdf29`, sourceDirty:false.
- Hosting version `7664413ad02b4666`; expiry **22 November 2026, 22:22 IST**.
- [Artifact, resource and hosted-check evidence](preview-evidence.json).

This release includes Google/Microsoft sign-in, cancellation-button correction and
the shared responsive login presentation. It replaces the earlier Google-only dev
snapshot, whose [original deployment record](dev-preview.md)
remains historical. No workspace provisioning or new data permissions are included.

The source matched the 121-test presentation checkpoint. Built Auth mode from clean
source before preparing the temporary root Hosting config. Local Hosting and HTTPS
checks at 390/1280px passed: exact HTML/JS/CSS/release hashes, headers/cache policy,
exclusions/deep links, both enabled provider controls after real Firestore readiness,
build identity through Technical details, reload, offline/reconnect and no overflow
or initial errors. No sign-in buttons were clicked by these headless checks.

Published only dev for 30 days using `--no-authorized-domains`. Metadata comparisons
confirmed qc/uat/live, billing, database/deletion protection, Rules, provider/domain
settings, Web Apps and intentional keys unchanged. The local manual preview was
left running. Temporary publication config removed after its exact content/hash
were recorded. No staging, Git commit or push.

Interactive automation remains paused. [Acceptance evidence](acceptance.md)
continues to distinguish agent-observed Google localhost checks from owner-reported
Microsoft personal sign-in/refresh/Logout. This deployment does not establish real
hosted OAuth, work/school Microsoft or actual mobile redirect/storage acceptance.
Those checks and Slice3 closure remain pending. No live promotion approved.
