# Slice 5A — Dev deployment, 5 November 2026

Owner instruction: “deploy to dev channel - including shared DA1 Rules and policy revision 3”.
Publication completed and read back at approximately 19:46 IST.

| Item | Deployed value |
|---|---|
| Destination | [Existing dev channel](https://taskify-dev-dpdhole--dev-por3atkf.web.app) |
| Project | taskify-dev-dpdhole / 243252492098 |
| App | 0.3.0 |
| Source | Clean commit 78e59efd127325e6b40bac7249d7a0035ef31d1a |
| Build | 78e59efd1273-cf161c48e0041603 |
| Hosting version | 16f946a5cd6a587a |
| Policy | Revision 3 / serverRelease 3; minimum and maximum app 0.3.0 |
| Ruleset | 564f5136-8a2f-4016-b851-36c1df0707ef |
| Rules SHA-256, normalized LF | 6bea05acb65fd66f39f71964b7e4356d15057fb8b903dad2792cb7bbe6ff8536 |
| Dev expiry, preserved | 4 December 2026, 20:44:17 IST |

The immutable artifact prepared during [preflight](05A-delete-account-release-verification.md)
was published without rebuilding the documentation-dirty tree. All 27 file hashes
match the reviewed artifact. No commit, push or merge was performed.

## Publication and verification

1. Rechecked exact project, billing-disabled state, revision 2, prior active Rules
   hash, zero pending deletion requests, committed Rules/policy and artifact hashes.
2. Deployed only Firestore Rules using the workspace configuration. Cloud compilation
   and publication succeeded. The policy publisher independently read back exact Rules.
3. Published revision 3 using expected-revision 2 transaction preconditions and
   verified the resulting policy. Policy publication timestamp: 14:14:44.766 UTC.
4. Published the pinned artifact to existing dev with `--no-authorized-domains` and
   no expiry option. Hosting version finalized and released successfully.
5. Verified HTTPS hashes for every public file, cache/security headers, SPA fallback,
   internal-file exclusions and exact release identity. Fresh 390px and 1280px
   contexts show Google/Microsoft sign-in enabled, survive refresh, and have zero
   page errors or horizontal overflow. No sign-in button was clicked.
6. Served the retained clean 0.2.0 artifact in a controlled browser at the dev origin
   against actual shared cloud policy. It shows client-too-old and blocks sign-in.
   This is a controlled old-client check, not another Hosting release or authenticated
   write-admission test.
7. Read back exact active DA1 Rules, policy 3 and dev version. Billing, database
   configuration, providers, Auth domains, qc/uat/live Hosting metadata and dev expiry
   match the pre-deployment snapshot. Pending deletion requests remain zero.

The shared policy intentionally blocks older artifacts across preview channels.
Only dev Hosting changed. The CLI's generic live Hosting URL in its output does
not indicate a live release; channel metadata confirms live was unchanged.

## Owner confirmation and verification handoff

On 5 November 2026 the owner confirmed revision 3 on the dev channel and marked
Slice 5A **ready and awaiting user verification**. The supplied screenshot shows
the signed-in, compatibility-verified Workspace ready screen with Delete Account,
Sign-in methods and Logout available. This is owner-provided UI evidence; revision
and exact build identity are established by the deployment read-back above.
No personal screenshot content is copied into the repository.

This handoff is not final slice acceptance or authorization for an unspecified
destructive operator run. User verification of the deletion flow remains pending.

## Remaining acceptance

Real-provider proof, actual mobile redirect, request/operator cloud execution, T6,
[T7](05A-delete-account-t7-verification.md), release recovery and a deployed rollback
rehearsal remain pending. Operator ADC is absent. No real account was deleted and
retirement remains disabled. Slice 4 is held and Slice 5A remains unaccepted.

A future rollback must preserve DA1 fence semantics and the 0.3.0 floor, using a
compatible recovery artifact. Restoring the previous 0.2.0 policy/Rules or clearing
pending controls is not an approved rollback. No rollback was executed here.

[Machine evidence](05A-delete-account-dev-deployment-evidence.json) records sanitized
before/after metadata, publication identity, artifact hashes and browser checks.
It contains no tokens, provider secrets, account emails or user record contents.
