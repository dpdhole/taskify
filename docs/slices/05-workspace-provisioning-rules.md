# Slice 5 — Finalized initialization Rules checkpoint

4 November 2026. Owner requested finalizing production Rules and committing before
further implementation. This checkpoint includes the previously uncommitted query,
seed, record and snapshot codecs and their local evidence, plus the generated
production initialization policy. Slice5 remains incomplete; adapter/controller,
Loading/recovery/ready presentation and coordinated release remain next.

## Policy and supported operations

`firestore.workspace.rules`, selected by `firebase.workspace.json`, is the source
policy for the current Slice5 initialization scope. Existing `firebase.compatibility.json`
and its deployed deny-all workspace policy are unchanged. No Rules, contract, indexes
or Hosting deployment occurred. This is source finalization with local verification,
not proof of cloud configuration, full product readiness or all future CRUD.

- Public get-only runtime/compatibility; clients cannot list/publish runtime policy.
- UID-owned workspace reads while unfenced. Existing accountDeletion/{uid} denies
  workspace reads/writes; only own deletion-status get remains available. Unknown
  fence states/schema still block; no client deletion request/update/delete is enabled.
- Each write checks the authoritative contract format, positive revision/release,
  schema presence/write permission and environment matching authenticated token audience.
  Real app version compatibility stays in the existing client gate; Rules do not
  attest browser code versions. Select actual app bounds/release sequence before cloud use.
- Exact template1 seeds, paired digest-bound name reservations and immutable
  predecessor receipts.24 stages: base,6 Category pairs,10 single Locations,7 Views.
  Finalization follows the last committed receipt, not a forgeable client count.
- Server-confirmed timestamps and initial recordVersion1; only the final initialization
  transition can become version2. Unknown fields/schemas, missing halves, skipped
  stages, reset/reseed, ordinary management edits and client cleanup are denied.
- Initial optional profile capture, valid timezone selection, no provider-driven
  overwrite. All Tasks and Uncategorized are protected through exact seed validation;
  future management/reorder operations must add their own complete policy/contracts.

General Unicode name editing retains the earlier accepted client-only NFC/grapheme
boundary; this initializer provisions the fixed approved catalogue. It does not
claim server-enforced full Unicode normalization for later user-created names.

## Production replacement of fixture assumptions

| Concern | Finalized contract |
|---|---|
| Timezone |597 pinned supported IANA IDs/aliases shared by domain validation and generated Rules; no UTC fallback or normalization that changes the stored ID |
| Profile name | Optional, nonempty/trimmed string, maximum1024 UTF-8 bytes |
| Profile photo | Optional HTTPS shape without authority credentials/ASCII whitespace, maximum8192 UTF-8 bytes; infrastructure additionally performs full URL parsing |
| Oversized/invalid social metadata | Reject explicitly; future initializer/recovery UI must offer a deliberate valid choice/omission of optional fields, never silent truncation/overwrite |
| Read fencing | Workspace data inaccessible after any deletion control exists; owner may still read that control |
| Unknown feature writes | Denied; no broad user subtree write permission or premature Slice5A/Task/management support |

Profile limits are technical payload bounds, not account/category/View quotas.
Domain and Rules use matching UTF-8 byte accounting; Unicode boundaries are tested.
The profile URL server check is structural HTTPS validation, not a URL-resolution
or remote-content guarantee; full parsing also applies at the infrastructure boundary.
No arbitrary account cap, new provider, new server tier or offline write queue.

Timezone policy data is pinned in src/domain/workspace-policy.ts with provenance
in config/workspace-policy-source.json: Node24.21.0/ICU78.3/tz2026c supported IDs,
plus reference-runtime-supported aliases from the public-domain
[IANA2026c backward list](https://data.iana.org/time-zones/tzdb-2026c/backward).
No network call occurs during generation or validation. New IDs require a reviewed
policy update and coordinated compatible client/Rules release. Unsupported browser
zones require explicit selection/recovery; no inference from provider identity.

## Reproduction and results

- `npm run generate:workspace-rules` generates the exact policy from the tested
  seed/receipt template and shared timezone/profile constants.
- `npm run check:workspace-rules` rejects drift; included in `npm run verify`.
- `npm run test:workspace-rules:local` starts only a checked loopback demo Firestore
  emulator and runs both the full stage suite against production Rules and extra
  production-policy checks. It refuses occupied service ports and preserves5173.
- Final72 focused unit tests passed across5 files. Final51 integration tests passed
  across2 files, including every597 timezone ID/alias and differing concurrent initial
  profile/timezone proposals. Same-UID first-commit preservation, all stages/finalization,
  all persisted snapshot decoders, guard/receipt enforcement, cross-UID denial,
  invalid profile/timezone payloads, environment/schema mismatch and fence read/write
  blocking are represented. Exhaustive-zone test resets synthetic fixtures with
  privileged test contexts; that cleanup is never granted to application clients.
- All TypeScript targets,41-file layer/cycle checks, full ESLint, full configured
  Prettier and generated-policy drift check passed. No new browser/build/full linking
  regression run is claimed for this policy-only continuation; earlier results remain historical.

Initial single-regex timezone compilation failed the observed4096-character pattern
limit before tests ran (49 skipped). Splitting the unchanged list into bounded patterns
resolved compilation; no IDs were removed. Trusted test-inspection callback typing
and package formatting were corrected before final checks. A subsequent final-test
launch was not executed when automatic approval review hit usage limits; after the
owner's Continue, authorized local checks completed. No unsafe-action rejection
or permission bypass occurred. These preparations are not relabeled as passing tests.

[Machine evidence](05-workspace-provisioning-rules-evidence.json) binds final staged
source bytes/hashes; [execution log](05-workspace-provisioning-rules.log) contains the
final commands/results. Earlier domain/stage/readiness source hashes describe their
historical snapshots; the source changed during this production-policy checkpoint.
Firebase's [field-control guidance](https://firebase.google.com/docs/firestore/security/rules-fields)
provides background for type/key/diff validation; actual pass claims here are local tests.

## Commit boundary and pending work

Commit includes all Slice5 source dependencies and prior checkpoint docs/evidence,
not just a standalone Rules file that cannot reproduce its tests. Deployed policies,
client capabilities and runtime contract are not changed. No cloud promotion,
push or live user data access. Owned emulators shut down; owner preview preserved.

Pause implementation at this checkpoint as requested. Next authorized development
step will be admitted transactions, safe reconciliation/controller state and UI.
Cloud publication needs a reviewed compatible client/Rules/contract rollout and
explicit target authorization. This checkpoint is not Slice5 closure; Slice4 stays held.
