# Slice 5A — QC promotion, 5 November 2026

Owner requested app 0.3.0/revision 3 on qc, then awaiting user UAT verification.
The exact dev Hosting version `16f946a5cd6a587a` was promoted without rebuilding.

- QC: https://taskify-dev-dpdhole--qc-xnxat620.web.app
- Source: clean commit `78e59efd127325e6b40bac7249d7a0035ef31d1a`.
- Build: `78e59efd1273-cf161c48e0041603`, app 0.3.0.
- Shared policy remains revision 3/serverRelease 3, app floor/ceiling 0.3.0.
- Exact DA1 Rules remain active; no backend policy or Rules publication was needed.
- QC expiry preserved: 22 November 2026, 13:19:33 IST.

All 27 HTTPS file hashes match the dev artifact. Cache/security headers pass.
At 390px and 1280px, compatibility becomes ready, both provider buttons are enabled,
refresh passes, and there are no page errors or horizontal overflow. An initial
browser request showed Site Not Found; retrying with a fresh URL passed both widths.
No provider sign-in or account deletion was performed.

Read-back confirmed unchanged billing, database, providers, Auth domains, shared
Rules/policy, dev/uat/live Hosting metadata and qc expiry. Only qc's release changed.
The separately committed button-spacing fix `7dd2be4` is not in this promoted
artifact; promotion preserves the existing dev version exactly.

**Ready and awaiting user UAT verification on qc.** The uat channel was not promoted.
Slice acceptance, real-provider/operator/T7 evidence and rollback rehearsal remain
pending; retirement stays disabled. No commit or push was performed.

[Promotion evidence](05A-delete-account-qc-promotion-evidence.json) records sanitized
metadata and checks. The [UAT procedure](05A-delete-account-t7-verification.md) remains
the controlling provider and safety verification sequence.
