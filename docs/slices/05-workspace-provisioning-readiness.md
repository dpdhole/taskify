# Slice 5 — Local readiness verification

4 November 2026. Baseline `8320898`, with agreed-contract documentation changes
and one new candidate compatibility unit specification. Owner authorized local
verification, lifting the relevant emulator/headless scope hold for this run.
Slice4 remains open/on hold; no linking or real-provider acceptance is implied.

## Executed results

| Check | Result | Scope |
|---|---|---|
| Focused unit | 81 passed, 5 files | Existing compatibility domain/gate/session/Auth bridge plus 7 new synthetic family-map cases |
| Emulator integration | 7 passed, 2 files | Existing Foundation and compatibility Rules/reader/gate |
| Headless Chromium | 4 passed | Compatibility transitions, retained draft/unknown-outcome state at 390/1280px, emulator contract revoke/recover/reload, ordinary unconfigured fail-closed build |
| TypeScript | Passed | All three configured type targets |
| Targeted lint/format | Passed | New unit specification |
| Local builds | Ordinary and compatibility passed | Large-chunk advisory remains; no performance/bundle certification |

Unit command: `npx vitest run tests/unit/provisioning-compatibility-readiness.test.ts tests/unit/compatibility-domain.test.ts tests/unit/compatibility-gate.test.ts tests/unit/session-controller.test.ts tests/unit/auth-link-bridge.test.ts`.
Other commands: `npm run typecheck`, `npm run build`, `npm run build:compatibility`,
and targeted ESLint/Prettier checks. Dedicated checked emulator runner starts only
loopback demo services, installs existing integration fixture Rules, then executes
`tests/e2e/compatibility.spec.ts` against ports4174/4175. The browser remains headless.
The owner preview on5173 was not stopped/reused. Owned emulators shut down afterward.

## Findings and limits

The nine-family candidate works with the current compatibility evaluator. A new
client blocks against an old family map; unknown retained fence schema blocks even
for a read-only fence client; prohibited workspace write schema blocks. Adding
families alone does **not** retire an old client because the gate checks the client's
declared families. Rollout must deliberately set appropriate app bounds as well.
Synthetic app0.2.0 is illustrative, not an approved release assignment.

Slice5 remains documentation-only in production code. These checks do not validate
its unimplemented seed transactions, receipts/finalization, concurrency/retry,
name reservations or deletion-fence Rules. No full unit/Auth/component/browser
regression, real providers, cloud publication, production capacity or billing checks
were run. Readiness verdict: baseline checks pass; provisioning integrity and
release acceptance remain pending implementation and applicable verification.

## Runner corrections

The sandbox emulator attempt failed before tests. A permitted external-process
retry ran7 integration checks successfully. Its first dedicated browser runner
omitted4174 (3 passed/1 connection-refused). A browser-only retry lacked the
integration-installed fixture Rules (3 passed/1 ready-state failure). The corrected
complete prerequisite sequence passed7 integration and4 browser checks. These
failed preparations are not counted as product failures or hidden as clean runs.

[Machine evidence](05-workspace-provisioning-readiness-evidence.json) records counts,
limitations and source/runner hashes; [execution log](05-workspace-provisioning-readiness.log)
contains the final unit/static/build/integration/browser output. Temporary runner
inputs remain ignored under `.local/slice5-readiness`. No cloud resources, deployment,
staging, commit or push; all new source outside documentation is test-only.

## Evidence audit and remaining readiness gates

Documentation reconciliation verified every recorded source/runner SHA-256 against
the current files. Corrected Windows newline conversion in the execution-log
artifact; its recorded checksum now matches exact LF-normalized UTF-8 bytes. No
test result or count changed, and no tests were rerun for this audit.

The [current decision register](05-workspace-provisioning.md#remaining-gaps-and-decision-register--4-november-2026)
separates settled product contracts from concrete codec bounds, Due precision,
stage/Rules feasibility, fence/runtime integration, release choices and unexecuted
Slice5-specific tests. Baseline readiness is sufficient to start implementation;
it is insufficient for provisioning acceptance or publication of workspace writes.
Temporary runner scripts are hashed but ignored; a fresh checkout must reconstruct
the dedicated runner/config described above before reproducing these results.
