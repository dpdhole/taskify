# Taskify development Firebase environment

The owner-approved environment is defined by DEC-070. This is a development/query-plan verification target; it does not select a production environment or region.

| Property | Approved / observed value |
|---|---|
| Project ID | `taskify-dev-dpdhole` |
| Display name | Taskify Development |
| Project number | `243252492098` |
| Creation account | `dpdhole@gmail.com` |
| Database ID | `(default)` |
| Edition / type | `STANDARD` / `FIRESTORE_NATIVE` |
| Location | `asia-south1` (Mumbai) |
| Deletion protection | `DELETE_PROTECTION_ENABLED` |
| PITR | `POINT_IN_TIME_RECOVERY_DISABLED` |
| Free-tier eligibility | `freeTier: true` reported by the database API |
| Repository alias | `dev`; no default cloud target configured |

## Implementation evidence — 2026-10-07

- Firebase CLI sign-in was refreshed successfully. Portable Google Cloud CLI `588.0.0` with bundled Python was installed from Google's versioned archive after SHA256 verification. System PATH/runtime installation was not changed.
- User Application Default Credentials were saved to the standard user-local store, outside the repository. The ADC quota project is `taskify-dev-dpdhole`. Credentials and tokens are not project artifacts.
- The project was created using `firebase projects:create`. Initial database creation failed because the Firestore API was disabled; the owner-approved API enablement was executed, then the same database creation command succeeded.
- Database API metadata confirms the edition, Native type, location, deletion protection and PITR settings: [database.json](./verification/database.json).
- An unauthenticated read was denied with HTTP 403 / `PERMISSION_DENIED`: [closed-access.json](./verification/closed-access.json). No Firestore Rules release existed before or after index-only deployment: [rules-release-after-indexes.json](./verification/rules-release-after-indexes.json). These observations support closed initial access; Taskify's reviewed Rules have not been published to this database.
- `firebase deploy --only firestore:indexes --project taskify-dev-dpdhole` exited 0. The CLI also compiled the local Rules file for validation, without publishing a Rules release. All eight composites and four configured preference single-field entries became READY and matched the manifest. Exact readiness and plan-only results for all 13 query variants are recorded in [query-plan.md](./query-plan.md) and its raw JSON evidence.
- No application functions, Hosting, Firebase client App, production environment, cloud fixture writes/deletes, billing attachment, paid-plan upgrade, additional IAM grant, or service-account key was created by this workstream.

## Operating this environment

- Identify the target explicitly with `--project taskify-dev-dpdhole` (or the approved `dev` alias). Emulator scripts remain fixed to `taskify-local`.
- Development client access stays closed until a separate approved Rules deployment. Server Query Explain uses IAM; local Rules verification remains independent.
- Real plan inspection uses the prepared `pnpm firestore:explain` command. Query execution through `--analyze`, cloud fixture seeding, additional deployment, or environment changes require project-owner approval.
- Deletion protection is enabled. Removing the project/database or disabling protection is not part of this setup authorization.

[Firebase console](https://console.firebase.google.com/project/taskify-dev-dpdhole/overview)
