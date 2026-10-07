# Category contract reconciliation

Status: Historical reconciliation context. Decisions through DEC-082 and current implementation/evidence are authoritative in the five-document set loaded through project_status.md. The owner separately approved implementation/specification updates/local verification and then commit/push; this draft supplies no independent authorization. Deployment and formal Verified status remain held.

## Owner-stated decisions

- Normalization is approved: trim, NFC display normalization and locale-independent lowercase uniqueness key; preserve display casing, internal whitespace, accents and punctuation. Maximum display-name length is 15 characters (DEC-075).
- Initial default order is alphabetical. The repeated Growth entry is deduplicated to preserve the existing uniqueness invariant.
- Default catalogue: Family, Finance, Friends, Growth, Hobbies, Household, Leisure, Partner, Self, Social, Spirituality, Wellness, Work.
- The earlier "Reset is not required" discussion is superseded: ordering-only Reset is approved and recorded as DEC-074. It includes all owned defaults/custom/archived Categories and preserves archive state.
- Category-specific missing/duplicate error codes are not required; use the existing public error-code family.
- Repeated unchanged operations do not change timestamps.
- Default Categories cannot be renamed or archived, but may be reordered.
- User-added Categories remain renameable, archiveable, and reorderable under normal owner/concurrency rules.
- Provision defaults at account registration. Append new custom Categories after the last owned Category, including archived entries. DEC-078 selects authenticated completeRegistration({}) and retryable readiness coordination.

## Remaining details for review

1. Registration coordination, Unicode character-count/collation, precise timestamps, persistence and response observation are resolved by DEC-078–DEC-082. Publication is owner-approved. Client readiness integration, formal Verified status and production verification remain separate work.

## Proposed implementation details for review

- The normalization/default/ordering decisions above are recorded in DEC-075; they are no longer proposals.
- Mutation semantics are now approved in DEC-076: duplicate create/rename uses DUPLICATE_ARGUMENT across active/archived Categories without implicit reactivation; missing/foreign targets use generic INVALID_ARGUMENT. Stale tokens return CONFLICT even for no-op requests; matching unchanged requests preserve timestamps. These are no longer proposals.
- Default provisioning occurs through completeRegistration({}); IDs/Task references remain stable under retries and Reset never provisions defaults. See the approved DEC-078 mechanism.

## Affected authoritative areas

- docs/product_spec.md: category editing and default restoration wording.
- docs/data_model.md: default protection/provenance, reset semantics, normalization and ordering.
- docs/backend_architecture.md: supported Category callables and initialization/uniqueness behavior.
- docs/security_model.md and Rules: any restrictions on default reorder.
- docs/decisions.md: partial supersession of DEC-046/DEC-051 and any affected DEC-053 boundary.
- packages/api-contracts/src/categories.ts now implements resetCategoryOrder empty request/multi-Category response and registration completion types; the public enum now includes generic DUPLICATE_ARGUMENT.

Ordering-only Reset has the approved DEC-077 contract with DEC-082 post-commit snapshot observation. Default provisioning remains separate. Preventing default rename removes the need to recover original default identity after rename; no default_key field is adopted.
