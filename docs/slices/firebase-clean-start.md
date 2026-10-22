# Firebase clean start

22 October 2026. Owner instruction: "Do not preserve legacy resources. Perform
clean start." This supersedes the legacy-preservation boundaries in the earlier
Hosting plan and preflight snapshot. Target remains `taskify-dev-dpdhole`, project
number `243252492098`; do not delete the Google Cloud/Firebase project itself.

## Reset scope

| Legacy resource | Reset action |
|---|---|
| Firestore `(default)`, UID `3e90c621-fe4e-477f-991d-21378e7ee975` | Disable deletion protection, then delete database, including its data/indexes; no export/migration |
| Firestore Rules release `cloud.firestore` | Delete release, then its obsolete ruleset |
| `dev.taskify.it.com` Hosting custom-domain binding | Delete Firebase binding; external registrar/DNS records are separate and not changed |
| Browser key `c210146e-e0a6-4cfe-bba3-12f0734dd8f1` | Delete legacy auto-created Firebase browser API key; do not retrieve key string |
| Hosting default site | Already empty: no versions/releases or preview channels. Firebase prohibits deleting its default site; reuse the empty platform container |
| App registrations, Storage, Realtime Database, Extensions, BigQuery, Pub/Sub | No resources found in inspected lists; no migration/recreation |
| Remote Config | Zero parameters, parameter groups and conditions observed |
| Auth | Configuration/user-ID requests return CONFIGURATION_NOT_FOUND; do not initialize legacy Auth just to reset it |
| Functions | API disabled; do not enable it to perform cleanup |
| App Engine | Application GET returns resource-not-found |

Project identity, owner/operator access, free-only billing state, system service
agents and enabled API infrastructure remain. This is an application-resource
reset inside the owner-selected project, not deletion/recreation of the project
or removal of Google-managed audit/system metadata. Repository history and frozen
local feasibility evidence are outside cloud cleanup scope.

No user-driven backup/recovery feature is introduced. The owner requested a clean
start rather than legacy preservation; no legacy content export is required.
New backend resources will be created deliberately by the relevant later slices;
the SDK-free Foundation Hosting build does not need Firestore or Auth provisioned.

## Execution status

**Completed and independently verified on 22 October 2026.**
[Metadata-only execution evidence](firebase-clean-start-evidence.json) records
the exact targets, completed asynchronous operations and subsequent GET results.

- Firestore deletion protection was disabled for the exact inventoried database
  UID, then database deletion completed. The initial short operation poll expired;
  continuation checked that same operation to completion rather than repeating
  the delete. The database list is now empty.
- The obsolete Firestore Rules release/ruleset were deleted; both lists are empty.
- The old custom-domain binding was deleted; both Hosting domain lists are empty.
- The legacy browser API key deletion completed; active key list is empty and
  the key metadata records a deletion timestamp. Provider soft-deletion retention
  still applies; no permanent physical-erasure claim is made.
- Project ID/number still match, state is ACTIVE, billing is disabled with no
  linked account, and the sole default Hosting site has no versions/releases.
  Only its built-in empty live channel remains. No preview has been created.
- App registrations and Storage bucket lists remain empty. No new backend
  resource, product provider setup, Hosting deployment, Git commit or push
  occurred as part of this reset.

The earlier [preflight snapshot](hosting-preflight.md) is retained as historical
metadata, not as an instruction to preserve deleted resources. The deployment
plan now starts from this clean baseline; its next gate is the reviewed clean
source commit before identified-artifact preparation and preview publication.

## Platform constraints

- [Default Hosting site cannot be deleted](https://firebase.google.com/docs/hosting/default-site).
- [Firestore deletion protection and database deletion](https://firebase.google.com/docs/firestore/manage-databases).
- [Custom-domain deletion](https://firebase.google.com/docs/reference/hosting/rest/v1beta1/projects.sites.customDomains/delete).

Deletion completion must be checked independently of an accepted asynchronous
operation. Provider-managed soft-deletion/retention may outlast active removal;
do not describe an accepted delete request as immediate physical erasure.
