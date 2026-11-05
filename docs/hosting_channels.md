# Hosting channels and promotion policy

Owner accepted 23 October 2026. This is the controlling channel policy for
project/site `taskify-dev-dpdhole` (project number `243252492098`). It supersedes
slice-specific preview names and the earlier latest/dev proposal. Historical
Foundation and Slice2 deployment evidence remains unchanged.

## Channels

| Channel | Purpose | Last recorded deployment state |
|---|---|---|
| `dev` | Development previews | Slice5 workspace provisioning, app0.2.0, contract2, version40e35b075db747cb from clean commit02458ff |
| `qc` | Testing and verification | Created; no release |
| `uat` | External/beta review | Existing version7664413ad02b4666 preserved by the Slice5 dev release; no new UAT publication |
| `live` | Product release when ready | Unchanged; no live release approved |

Current [dev preview](https://taskify-dev-dpdhole--dev-por3atkf.web.app).
No qc/uat Hosting publication was performed by the Slice5 dev release. The shared
contract now requires app0.2.0; older artifacts cannot be used until separately promoted.
Migration evidence is in [channel migration](slices/hosting_channels-evidence.json).
Latest recorded deployment: [Slice5 provisioning preview](slices/05-workspace-provisioning-preview.md),
clean pushed commit `02458ff`, version `40e35b075db747cb`, published on4 November.
[Slice4 verification preview](slices/04-identity-linking-preview.md) remains historical.
The [23 October Google/Microsoft preview](slices/03-provider-sign-in-preview.md)
remains historical evidence; Slice4 linking remains held and unaccepted.
On 2 November 2026 the owner reported Google and Microsoft personal-account
workflow verification on desktop/mobile at the dev URL and accepted Slice3.
The exact build tested by that later report was not independently captured;
the deployment record supplies publication provenance without identifying the
owner-tested build. Work/school testing is deferred until product/features mature.
See the [closure record](slices/03-provider-sign-in-closure.md).
The earlier Google-only release used an owner-approved uncommitted snapshot;
that exception is historical. The clean-commit policy below remains in effect.

## Explicit instructions

Do not host, promote, renew, delete or deploy automatically as a consequence of
implementation, validation, staging, commit or push. Every hosting/deployment
request must clearly name its destination: dev, qc, uat or live. Ask if omitted,
ambiguous or inconsistent. A bare "host preview" is insufficient; do not default
to dev. For promotion, confirm an unambiguous source version and destination.

Examples of clear requests:

- "Host the committed build to dev."
- "Promote the current verified dev version to qc."
- "Promote the QC-approved version to uat."
- "Promote the UAT-approved version to live." This requires explicit owner release
  approval; live promotion remains deferred until the product is ready.

## Promotion and verification

Use dev → qc → uat → live. Prepare new development artifacts from reviewed,
clean commits, with exact hashes and public build identity. Promote the same
version between channels without rebuilding. Record source/destination,
version/build/commit, validation and owner instruction in deployment evidence.
A build change during QC restarts verification; hold UAT stable during external
review. Keep only these three preview channels; do not create per-slice channels.

Verify destination HTTPS bytes, headers, app/build identity, gate readiness and
applicable mobile/desktop behavior. Recheck billing/resources and generated keys;
do not retrieve key values or delete intentional keys. Preserve the current live
release unless explicitly approved. Channel operations must not synchronize Auth
domains or initialize backend services implicitly.

Preview channels share the same Firebase project and Firestore runtime policy;
frontend separation does not isolate data. Use controlled test identities/data
when later slices introduce product writes. External testing that requires backend
isolation needs a separately agreed environment/project decision.

## Expiry

Use up to30 days for preview channels. The channels created on23 October2026
initially expire **22 November2026 at13:19 IST**. The4 November dev deployment
most recently renewed dev to **4 December2026 at20:44 IST**; qc/uat retain their recorded22 November expiry.
Renew only on explicit instruction; no
scheduled renewal or deployment. Check and report expiry at each hosting action.
Expiry may remove a channel and invalidate its URL; recreating it can change the
URL. Live Hosting has a separate lifecycle and must not be used to avoid preview
expiry.

## Migration performed

Created dev/qc/uat with30-day expiry. Released the exact existing Slice2 version
to dev without rebuilding or changing policy revision. Headless390/1280px checks
passed before removing foundation-smoke and compatibility-smoke. Final inventory
contains only dev/qc/uat plus Firebase's live channel. Old preview URLs are retired.
The Foundation build was not carried forward to a new channel under this revised
agreement. Live Hosting was unchanged. No new commit or push was performed.
