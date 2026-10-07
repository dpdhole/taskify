# Category contract reconciliation

Status: Draft reconciling owner-stated decisions. The unresolved details below are proposals/questions, not approved requirements. No Category implementation or cloud change is authorized by this draft.

## Owner-stated decisions

- Normalization is approved: trim, NFC display normalization and locale-independent lowercase uniqueness key; preserve display casing, internal whitespace, accents and punctuation. Maximum display-name length is 15 characters (DEC-075).
- Initial default order is alphabetical. The repeated Growth entry is deduplicated to preserve the existing uniqueness invariant.
- Default catalogue: Family, Finance, Friends, Growth, Hobbies, Household, Leisure, Partner, Self, Social, Spirituality, Wellness, Work.
- The earlier "Reset is not required" discussion is superseded: ordering-only Reset is approved and recorded as DEC-074. It includes all owned defaults/custom/archived Categories and preserves archive state.
- Category-specific missing/duplicate error codes are not required; use the existing public error-code family.
- Repeated unchanged operations do not change timestamps.
- Default Categories cannot be renamed or archived, but may be reordered.
- User-added Categories remain renameable, archiveable, and reorderable under normal owner/concurrency rules.
- Provision defaults at account registration. Append new custom Categories after the last owned Category, including archived entries. Registration implementation coordination is not yet selected.

## Remaining details for review

1. Registration coordination and Unicode character-count/collation implementation details before coding. Product behavior, mutation semantics and Reset API are approved through DEC-077.

## Proposed implementation details for review

- The normalization/default/ordering decisions above are recorded in DEC-075; they are no longer proposals.
- Mutation semantics are now approved in DEC-076: duplicate create/rename uses DUPLICATE_ARGUMENT across active/archived Categories without implicit reactivation; missing/foreign targets use generic INVALID_ARGUMENT. Stale tokens return CONFLICT even for no-op requests; matching unchanged requests preserve timestamps. These are no longer proposals.
- Default provisioning occurs at account registration. Its implementation must preserve IDs/Task references under retries and never become a reset endpoint; trigger/coordination details remain to be reviewed.

## Affected authoritative areas

- docs/product_spec.md: category editing and default restoration wording.
- docs/data_model.md: default protection/provenance, reset semantics, normalization and ordering.
- docs/backend_architecture.md: supported Category callables and initialization/uniqueness behavior.
- docs/security_model.md and Rules: any restrictions on default reorder.
- docs/decisions.md: partial supersession of DEC-046/DEC-051 and any affected DEC-053 boundary.
- packages/api-contracts/src/categories.ts: implement approved resetCategoryOrder empty request and multi-Category response; the old request in source has not yet been changed. Add generic DUPLICATE_ARGUMENT to the source error enum during implementation.

Ordering-only Reset now has an approved request/response contract (DEC-077): resetCategoryOrder({}) returns changed_count and all Category IDs/order/individual timestamps, including archived entries, using current server state with no per-Category tokens. Default provisioning remains separate. Preventing default rename removes the need to recover the original default identity after rename; no default_key schema field is proposed.
