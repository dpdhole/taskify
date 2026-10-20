# Gate 2 — name-integrity feasibility probe

**Candidate result: FAIL. Gate 2 acceptance: not achieved; remaining entity work not executed.**

2026-10-20. Repository dpdhole/taskify main remains at 38a7fb7383ae99948f003d68fe7d77e8e4b20dfa, clean. Experiment is outside the checkout, under gate2/name-integrity. No specifications, production code, prior Gate 1 artifacts, cloud resources or repository history changed.

## Why this probe ran first

Gate 2 requires Category/Location unique normalized names and adversarial data integrity, in addition to Discussion, Todo, Activity Log and Saved Views. Current specification §6.1 requires Category names with Unicode NFC/trim normalization, case-insensitive uniqueness across active/archived categories and at most 30 grapheme clusters. §17.5 applies equivalent requirements to Locations. Restricting the alphabet or treating canonical normalization as client-only is not currently an approved substitution.

The user's handoff requires stopping when an essential invariant cannot be secured and presenting alternatives rather than silently weakening it. This probe exposes a failing candidate for that invariant. It does not establish a mathematical impossibility for every encoding or bounded vocabulary design.

## Tested candidate

User-scoped categories/locations plus deterministic per-name reservation records. Entity create and reservation create must be in the same batch, enforced in both directions with getAfter() and pre-write existence checks. Rules require name == name.trim(), nameKey == name.lower(), and name.size() between 1 and 30. Reservations cannot be edited or deleted; archived entities retain their reservation. Malicious clients are not required to use a normalizing JavaScript adapter.

This is a deliberately isolated name-guard probe, not the complete Gate 2 schema or production Rules. Rename, reorder/default protection, Task references and entity deletion contracts have not been implemented here. Literal name-key document IDs also need production encoding to support characters such as slash; no complete name alphabet/path encoding is claimed.

## Actual results

| Run | Executed | Passed | Failed |
|---|---:|---:|---:|
| Initial probe | 20 | 15 | 5 |
| Corrected final capability probe | 20 | 16 | 4 |

The initial fifth failure was a harness assumption: emulator rule upload accepted an expression calling normalize(); actual evaluation, rather than compilation, reveals its absence. The corrected test uploads that expression and issues an otherwise valid write, capturing the runtime `Function not found error: Name: [normalize]` diagnostic. That capability test passes by confirming the limitation, not by proving name security.

Final failing acceptance tests:

- categories: required NFC-equivalent duplicate must be rejected
- categories: required valid 10-grapheme emoji name must be accepted
- locations: required NFC-equivalent duplicate must be rejected
- locations: required valid 10-grapheme emoji name must be accepted

No skipped/cancelled tests. See gate2-final.log and test-inventory.md. The test process exits nonzero intentionally; failing requirements remain failing rather than being relabeled as successful diagnostics.

## Reproduced failures

1. **Canonical-equivalence uniqueness bypass.** `Café` (U+00E9) and `Café` (U+0065 U+0301) normalize to the same NFC value. Both names successfully commit through distinct name guards, since lowercasing alone leaves two distinct keys. The malicious client supplies decomposed name and decomposed key; Rules accept both as mutually consistent. This violates the requested normalized-name contract and effective normalized uniqueness. See categories-normalization-bypass.json and locations-normalization-bypass.json for actual input code points and committed result.
2. **Incorrect grapheme bound.** Ten family emoji sequences contain ten grapheme clusters, as measured by Intl.Segmenter, but 70 Unicode code points. The candidate size()<=30 rejects this otherwise valid input. No claim about the exact underlying size() unit is needed: the observed rejection demonstrates that this candidate does not implement the 30-grapheme policy.
3. **Native normalization unavailable in this runtime.** An otherwise valid ASCII create using name.normalize('NFC').lower() in its Rules expression is rejected with an explicit function-not-found diagnostic. Rule upload alone did not detect this. See normalization-api-diagnostic.txt and firestore-debug.log.

A browser-side NFC call, grapheme counter or hash does not establish a malicious client's compliance. A guard keyed by browser-supplied normalized text secures that literal key; it does not prove how the key relates to a name unless Rules can verify the transformation.

## Checks that passed

For both entity kinds: valid paired create; rejection/rollback of either half missing; identical and case-only exact-key duplicates rejected; archived names reserved; forged owner/key/guard and foreign actors denied; concurrent claims on the same exact key yield one entity; 30 ASCII characters accepted and 31 rejected. Separate ownership/guard test rejects foreign/anonymous reads and reservation update/delete.

These results support the atomic reservation technique for Rules-verifiable keys. They do not establish full Unicode normalization, renaming, reference integrity or full Gate 2 authorization.

## API evidence and interpretation

The documented Firestore Rules String API provides lower/upper, regex matching/replacement/splitting, size, trim and UTF-8 conversion. It does not document NFC normalization or Unicode grapheme segmentation. Its regex operations use RE2. Reference: https://firebase.google.com/docs/reference/rules/rules.String .

The runtime normalize() probe is direct experimental evidence for this emulator/toolchain. The stronger claim that no custom Rules-verifiable Unicode representation can ever work has NOT been proved. No trusted mapping service or pre-provisioned Unicode lookup corpus was introduced.

Runtime: same portable Node 22.16.0 and Java 21.0.12.1; Firebase 11.10.0, Rules Unit Testing 4.0.1, CLI 14.27.0, emulator 1.19.8. Project demo-taskify-gate2; loopback Firestore only. No login, cloud provisioning or deployment. One sandbox launch could not spawn Java; the subsequent outside-sandbox execution completed. That launch failure is not counted as a security test result.

## Scope decision needed before acceptance

Options for the owner, not changes already approved:

A. **Keep Unicode UX; accept client-only NFC and grapheme validation for PoC/beta.** The supported app normalizes names, counts graphemes and uses reservations; Rules still enforce ownership/shape/atomic reservation of literal keys. Explicit limitation: a modified owner client can create non-normalized/duplicate-looking names or bypass the intended client length policy in its own namespace. No stronger adversarial guarantee may be claimed. Exact allowed server payload bounds require separate design.
B. **Restrict the accepted name repertoire to something Rules can fully validate**, for example bounded ASCII names with trim/lower and direct character limits. This changes multilingual/emoji name support and requires approval before implementation. No restriction was silently added to the authoritative specification.
C. **Retain the full strong Unicode invariant and investigate a different verifiable representation/normalization mechanism.** Additional feasibility work is necessary; a backend/infrastructure change would require explicit approval under the existing Spark-only constraint. This report does not recommend automatically adding a backend or paid service.

The remaining Gate 2 Discussion/Todo/implicit-start, link, Saved View, provisioning/reordering/default, classification-reference and complete entity CRUD tests have NOT run. Gate 1 results remain their own scoped evidence; this probe does not invalidate Task/event pairing but does prevent a Gate 2 PASS.

## Reproduce

Here: ./run.ps1. It locates the existing Gate 1 portable runtimes and emulator cache and executes this probe on demo-taskify-gate2. Dependencies are a workspace junction; omitted from the bundle. Elsewhere use Node 22, Java 21, npm ci, then npm test. Expect a nonzero test exit and four acceptance failures. Inspect run.ps1 paths when relocating.
