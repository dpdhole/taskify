# Slice 5 — Dev release preparation

4 November 2026. Owner explicitly requested deploying Slice5 to **dev**, then
selected **app0.2.0 and blocking older clients**. This authorizes the coordinated
development release; it does not accept Slice5 or promote other Hosting channels.

## Published outcome — documented5 November2026

The sequence below completed4 November: exact initialization Rules, contract
revision2/serverRelease2 and dev Hosting version40e35b075db747cb, from clean pushed
02458ffb68d1280f86ff4545284fe6d76023ec3a. [Deployment report/evidence](05-workspace-provisioning-preview.md)
records hosted checks and expiry4 December2026 at20:44 IST. Publication is complete;
owner first-use/provider acceptance and Slice5 closure remain pending. This record
preserves the approved sequence and rollback constraints for future operations.

## Release contract

- App/package/client version0.2.0. Clean release-preparation commit02458ff follows
  implementation/merge commit5d560ea; exact publication identity is recorded in
  deployment evidence.
- Shared runtime policy revision2/serverRelease2, minimum/maximum app0.2.0.
  `config/workspace-compatibility.json` declares the probe and nine workspace
  families, schema1. Account deletion remains a read-only client capability;
  Rules deny all client fence mutations. Contract write-schema metadata does not
  grant access by itself and retains the existing nonempty-list format.
- Existing0.1.0 clients are intentionally blocked across this Firebase project.
  Preview Hosting channels share the backend; qc/uat/live artifacts are unchanged.
  Actual provider sign-in tests and owned data are not reset or deleted.
- Exact reviewed initialization source is selected explicitly through
  `firebase.workspace.json`. The publisher's new `--rules-profile workspace`
  checks deployed Rules bytes against that source and validates all workspace
  capabilities. The existing compatibility profile remains the default.
- Standalone Node tools and browser builds share a dependency-free family list.
  Explicit TypeScript imports are supported in the no-emit configuration. Synthetic
  workspace/harness fixtures follow the current app version; historical old-client
  contracts remain intentional test inputs.

## Publication sequence and recovery

1. Verify project243252492098, free billing, database/deletion protection, Auth and
   key metadata, current Rules/contract, channel versions and source checks.
2. Validate release locally and commit the reviewed preparation. Build Auth from
   the clean commit into an isolated artifact containing public assets/release
   identity only. Pin artifact hashes; publish neither test fixtures nor credentials.
3. Deploy exact initialization Rules first. The old contract still denies new
   workspace writes because it lacks their families.
4. Publish policy revision2 with expected-revision1 concurrency control. This
   intentionally blocks old clients during the short dev rollout interval.
5. Publish the pinned artifact to the existing dev channel for30 days with
   `--no-authorized-domains`. Do not create channels or change OAuth registrations.
6. Verify destination bytes, headers, release identity, compatibility readiness,
   both sign-in controls and responsive/reload behavior without interactive OAuth.
   Compare before/after resource metadata and preserve other Hosting versions.

After revision2 is published, the rollback floor is app0.2.0 with the same schema
and initialization semantics. Do not lower the floor or restore old deny-all Rules
after workspace records may exist. A failed Hosting step leaves the strict gate
blocked until the matching artifact is retried; inspect uncertain publication
before retrying. Any rollback must preserve retained families, fence behavior and
confirmed user progress. No automatic data reset or policy rollback is permitted.

Slice5 stays open for hosted provisioning/provider acceptance. Slice4 remains held;
Slice5A deletion and Slice9 onboarding integration remain separate work.

## Local release verification

367 unit/component cases pass (two preflight cases excluded while5173 remains
active),70 emulator integration cases pass, and53 distinct headless browser cases
pass across the workspace/session run, four compatibility cases, eight redirect
rechecks and the final shared-runtime check. Initial verification failures were
infrastructure: parallel output cleanup removed traces; Vite watched generated
trace HTML; and the shared fixture waited on delayed third-party emulator UI assets.
Outputs were isolated, generated directories excluded from Vite watching, and the
shared fixture aligned with the existing local/static-script network allowlist.
No production Auth behavior or Rules safeguard was relaxed.

Types,48-file boundaries, Rules generation,22-icon integrity, full lint/format,
four builds and bundle isolation pass. The actual operator CLI validates the
candidate without cloud access; new release tests check version coherence, actual
new-client admission, old-client retirement and invalid Rules-profile rejection.
Vite's existing large-chunk advisory remains. These checks do not constitute
real-provider or hosted first-use acceptance. The owner's manual preview remains
separate from temporary, headless release verification services.
