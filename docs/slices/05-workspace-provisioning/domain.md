# Slice 5 — First implementation checkpoint: query codec and seeds

4 November 2026. Owner authorized beginning Slice5 implementation. Baseline
e0b8e0b contains agreed contracts/readiness. The locally known incoming main
change504de97 is accepted Slice7 detailing; reviewed as a dependency reference,
not merged or implemented in this checkpoint. No Git history changed.

## Implemented

- Provider-independent query decoder with exact envelope/field/operator shapes,
  stable enum tokens, nonempty unique selections, tagged Location operands,
  strict calendar/UTC date parsing, safe relative integers, same-kind Between
  bounds and permanent date contradiction rejection. Grouped fields stay filterable;
  closure outcomes remain stored while Include Closed is off. No query execution.
- Due disallows instant comparison operands in v1. Absolute/relative intersections
  are retained because their evaluation-time emptiness is not a codec failure.
  Timezone-relative execution/date-only precision handling remains future work.
- Fresh seed plans: exact12 Categories,10 Locations,7 explicit queries, approved
  icons, stable seed IDs, all active and Home-visible, order1000/2000/… per family.
  No Unspecified record, starter Tasks, opaque query presets or Scheduled date
  restriction. Completed explicitly filters Closed/Done; Deleted includes both
  scopes and Deleted Date Is Set; All Tasks uses Category grouping.
- Name trim/NFC/lower and30-grapheme validation honor the existing client-only
  PoC boundary. Explicit timezone validator blocks invalid/missing input without
  guessing UTC. Each plan/query decode owns its arrays/objects, preventing shared
  template mutation. Fresh plans are drafts, not an instruction to reseed users.

Code: workspace-validation.ts, workspace-query.ts and workspace-seeds.ts under
src/domain; no SDK imports, global account state, reads/writes or startup hooks.
Nine family names and template1 are declared as domain metadata only; client
capabilities/cloud policy are not activated by this checkpoint.

## Validation

Final focused run:41 tests passed (34 new domain cases plus7 existing readiness
cases). All TypeScript targets passed;38-file layer/cycle check passed; targeted
ESLint and Prettier passed. Initial typing checks caught union inference and a
parameter-table spreading issue; corrected before final recorded checks. Negative
cases now pass condition arrays and assert semantic rejection; valid range and
leap-day controls ensure the parser also accepts actual supported conditions.

[Machine evidence](domain-evidence.json) records source
hashes and final commands/counts; [execution log](domain.log)
contains final output. Prior readiness81/7/4 remains historical baseline, not a
retest of this change. No emulator/browser/build check is needed to establish
pure codec behavior and none is claimed for this checkpoint.

## Concrete tokens and unfinished work

Selection keys: category, location, lifecycle, paused, closureOutcome,
importantUrgent. Lifecycle tokens: draft/inProgress/closed; paused tokens:
paused/notPaused; outcomes: done/cancelled/unableToComplete/noLongerApplicable/
duplicate/other; priority: doFirst/schedule/delegate/eliminate/unclassified.
Date keys: createdAt/plannedStart/due/actualStart/actualEnd/pausedUntil/deletedAt.
Grouping supports category/location/lifecycle/importantUrgent and those dates;
sort supports these plus title, with asc/desc. Closure outcome remains filter-only.
Complete evaluator/field applicability and responsive query editing remain later
query slices. This codec is not advertised as the final exhaustive feature engine.

Remaining before persistence: validated persisted-record envelopes/timestamps,
field/payload bounds and measured budgets, exact stage/receipt/finalization proof,
reservation/fence Rules and concurrency, shared runtime cleanup/late-result
isolation and Loading/recovery presentation. Date bucket/sort evaluation, actual
profile snapshot capture and cloud confirmation are not implemented here. Seed
output contains no timestamps/UID/completion fields and must be completed only
by the eventual admitted infrastructure operation. No capability or Rules rollout.

Next checkpoint is persisted-record codecs and a bounded-stage feasibility design
with Rules tests, using the accepted local-verification authorization. Do not
bypass an integrity limit or resurrect held linking. Changes remain unstaged;
no commit, push, deployment or cloud resources changed. Owner preview preserved.

## Subsequent production-policy checkpoint

This report and its source hashes describe the historical checkpoint. The
[finalized initialization Rules](rules.md) add shared
timezone/profile bounds, confirmed production-policy tests and updated source
evidence. Earlier counts do not imply the current source still matches this snapshot.
