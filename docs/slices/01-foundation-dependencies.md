# Foundation dependency review

22 October 2026. **Owner accepted all five dependency recommendations.** Exact
pins and the bounded Foundation-only advisory treatment below are agreed. This
does not certify patched dependencies, production/server exposure or new runtime
behavior. Actual-app bundle checks and reassessment remain required.
See [Foundation detailing](01-foundation.md). The [readiness check](readiness-check.md)
and [candidate evidence](readiness-evidence.json) remain historical inputs, not
rewritten to certify this follow-on investigation.

## Accepted exact pins

| Group | Versions |
|---|---|
| Runtime | Node 24.21.0 / npm 11.19.0 |
| UI | React/React DOM 19.3.1; React Router 8.5.0; Zustand 5.0.16 |
| Build | Vite 8.3.5; React plugin 6.1.2 |
| Type/lint | TypeScript 6.0.3; typescript-eslint 8.72.0; ESLint 10.13.0 |
| Tests | Vitest 5.0.5; Playwright 1.64.1; Testing Library React 16.3.3 |
| Firebase | SDK 13.1.0; CLI 15.34.1; Rules unit testing 6.0.0 |

Supporting test/type/format pins are in the readiness evidence. Strict resolution
passed. Latest TypeScript7 exceeds the lint peer range; copied Node22.16 does not
satisfy selected router/Rules tooling. No forced overrides/downgrades are proposed.

## Follow-on checks executed

Read exact published source archives for Firestore4.19.0, CLI15.34.1, gaxios6.7.1
and chokidar3.6.0 without executing package scripts. Built a minimal Vite8 browser
import probe with Firebase13 outside the repository, retaining app initialization,
Firestore initialization, emulator connection, document read and listener APIs.
The scratch install used scripts disabled and added 101 packages. The build exited
0; its 18-module graph used Firestore's browser ESM entry and contained no grpc-js,
Node Firestore entry, Admin SDK, Google Cloud, OpenTelemetry, braces or uuid.

This is a static import/bundle check, not actual browser runtime, Auth, emulator
integration or universal vulnerability reachability proof. No repository app
scaffold or application dependency installation occurred. Original readiness
lock-only checks themselves still performed no installation.

Source findings:

- Firestore's Node entry imports grpc-js; the checked browser graph excludes it.
- CLI's emulator controller imports its Pub/Sub helper even when Pub/Sub startup
  is not selected. Do not claim that its dependencies can never load.
- Inspected gaxios uses uuid v4() for a multipart boundary, rather than the
  caller-buffer v3/v5/v6 paths named in the advisory. This is not an exhaustive
  proof for all other consumers.
- The published latest braces remains 3.0.3 and is included in the advisory;
  selecting latest does not provide a patched release.

Probe artifacts: sibling `foundation-analysis-20261022/browser-bundle-proof`;
archive-source inspection: its `source-review` directory. They remain local
investigation artifacts, not product code or acceptance evidence for Foundation.

## Accepted Foundation-only advisory treatment

The original audit's 12 affected packages (8 high, 4 moderate) include propagated
parents. Findings remain reported; none is relabelled as patched.

| Finding | Evidence / limits | Accepted Foundation treatment |
|---|---|---|
| grpc-js via Firestore | Node import; checked browser graph excludes it | Browser-only SDK imports and actual-app bundle check. Node tests local, with no gRPC server/certificate-derived identity; reassess for any future server tier |
| braces via CLI/chokidar | Dev glob processing; affected release still latest | Temporary local-tooling exception with trusted repository/config/path inputs and loopback services; no untrusted glob input; retain finding and revisit upstream remedy |
| OpenTelemetry via CLI/PubSub | Dev dependency; helper imported even if service not started | Auth/Firestore/Hosting only, demo project IDs, loopback and no live credentials; not a claim of dependency removal or universal CLI safety |
| uuid via gaxios | Reviewed call is v4() without caller buffer; other paths not exhaustively proven | CLI/test-only, retain reviewed call-site evidence, reassess dependency changes; no blind major override |

These are owner-accepted, narrow dispositions for local Foundation work,
not production/server waivers. Recheck exclusions on the actual application build.
New reachable paths, external exposure or changed advisories reopen review.

## Numbered decisions

| # | Decision | Recommendation |
|---:|---|---|
| 1 | Exact UI/build/test pins | Adopt the compatible set above with a lockfile, not latest generators |
| 2 | Firebase SDK | Use SDK13.1.0 browser imports; verify exclusions in the actual app bundle |
| 3 | Local tooling findings | Accept the documented Foundation-only treatment; retain findings/restrictions without claiming a clean audit |
| 4 | Overrides/downgrades | None by default; substitutions require explicit compatibility checks |
| 5 | Reassessment | Repeat after lock changes and before real-provider/release use; server expansion needs a new review |

The owner instructed "Proceed - Accept all" for these five rows. No live
configuration/deployment or formal claim of vulnerability elimination follows.

## Actual Foundation follow-through

The [final validation](01-foundation-validation.md) verifies browser exclusions on
the implemented build. The actual lockfile audit remains12 affected packages
(8 high/4 moderate), matching the accepted conditions. Earlier investigation text
above describes its pre-implementation time; application installation and local
validation have now occurred.

## Sources

- [gRPC certificate-context advisory](https://github.com/advisories/GHSA-m9gg-hp2v-232j)
- [gRPC server error advisory](https://github.com/advisories/GHSA-f596-whhp-79r4)
- [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [OpenTelemetry advisory](https://github.com/advisories/GHSA-8988-4f7v-96qf)
- [uuid advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq)
- [Firestore metadata/source archive](https://registry.npmjs.org/@firebase%2ffirestore/4.19.0)
- [Firebase CLI metadata/source archive](https://registry.npmjs.org/firebase-tools/15.34.1)
- [gaxios metadata/source archive](https://registry.npmjs.org/gaxios/6.7.1)
- [chokidar metadata/source archive](https://registry.npmjs.org/chokidar/3.6.0)
