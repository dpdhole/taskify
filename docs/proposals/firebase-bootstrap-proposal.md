# Taskify Firebase development bootstrap

Status: Approved and implemented; archived review record. Owner approved scoped Verified status and publication on 2026-10-07.

This file preserves the bootstrap plan and observations at review time. It is historical context, not a second specification or a command runbook. Current authoritative records:

- [Decisions (DEC-070)](../decisions.md)
- [Project status](../project_status.md)
- [Development environment](../../infrastructure/firebase/development.md)
- [Query-plan evidence and limits](../../infrastructure/firebase/query-plan.md)

## Observed prerequisites

- Firebase CLI 15.32.1 sign-in was refreshed successfully for dpdhole@gmail.com.
- Six existing accessible Firebase projects were listed; none is identified as Taskify. They will not be repurposed without an explicit decision.
- Google Cloud CLI 588.0.0 with bundled Python was downloaded from Google's versioned archive, SHA256 verified, and installed portably under this workspace's verification-tools directory. No system PATH/runtime installation was changed.
- Separate ADC browser sign-in completed successfully and credentials were saved to the standard user-local ADC store, outside the repository. The quota project remains unset until a target is approved.

## Proposed cloud resources

| Setting | Proposed value |
|---|---|
| Purpose | Isolated Taskify development and query-plan verification |
| Project ID | taskify-dev-dpdhole (subject to global availability) |
| Display name | Taskify Development |
| Owning account | dpdhole@gmail.com |
| Firestore database ID | (default) |
| Edition / API | Standard / Firestore Native |
| Location | asia-south1 (Mumbai); proposal assumes primary development/use is in India |
| Initial client Rules | Closed/default-deny; trusted server IAM access remains available |
| Deletion protection | Enabled |
| Point-in-time recovery | Disabled (default) |
| Billing | No billing-account attachment or paid-plan upgrade in this scope |

The location choice applies to this development database only; no production region/project is selected. If the proposed project ID is unavailable, stop and request approval for an alternative ID. Do not select an unrelated existing project or attach billing to work around an error.

## Actions included in approval

1. Create the proposed project and add Firebase services using the existing CLI.
2. Enable any required Firestore API for this project and create the specified database.
3. Verify project/database identity, location, edition, Native API mode and closed client Rules.
4. Add a repository dev alias for this exact project without changing emulator scripts or setting a default cloud target.
5. Set this project as the local ADC quota project after checking access.
6. Deploy only the reviewed index configuration: eight composite indexes plus the approved preferences.user_email collection-group single-field override. Inspect deployed index state and wait for readiness.
7. Run plan-only Query Explain (analyze=false) for all 13 documented query variants using dpdhole@gmail.com and a date in the operator's timezone. Record actual selected indexes, failures, and metadata as evidence.
8. Document approved resource choices, implemented/deployed state, and exact verification scope. Commit/push requires a separate explicit instruction unless included in the owner's approval.

No application functions, Hosting site, Firebase client App, production project, Rules deployment, cloud fixture writes/deletes, additional IAM grants, service-account key, or analyze=true query execution is included.

## Prepared commands

Use the already prepared Node.js 22 / pnpm 10 environment; all cloud commands identify their target explicitly.

```sh
pnpm exec firebase projects:create taskify-dev-dpdhole --display-name "Taskify Development"
pnpm exec firebase firestore:databases:create "(default)" --project taskify-dev-dpdhole --location asia-south1 --edition standard --delete-protection ENABLED --point-in-time-recovery DISABLED
gcloud auth application-default set-quota-project taskify-dev-dpdhole
pnpm exec firebase deploy --only firestore:indexes --project taskify-dev-dpdhole
pnpm firestore:explain --project taskify-dev-dpdhole --database "(default)" --owner dpdhole@gmail.com --today YYYY-MM-DD
```

Plan-only Explain does not execute document retrieval and is charged one read per query. Index creation may consume storage as data is later added. No data will be seeded here; empty-data plans can validate index selection but cannot establish realistic scan efficiency, latency, or workload cost.

References: [Firestore setup](https://firebase.google.com/docs/firestore/quickstart), [locations](https://firebase.google.com/docs/firestore/locations), [Query Explain](https://firebase.google.com/docs/firestore/query-explain), [local ADC](https://docs.cloud.google.com/docs/authentication/set-up-adc-local-dev-environment).
