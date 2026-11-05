# Slice 5A — Real-provider and T7 verification procedure

5 November 2026. Procedure only; **not executed**, **not destructive-run authority**.
Controlling scope: [DA1](contract.md) and the
[release preflight](release-verification.md).

## Preconditions and evidence discipline

- Publish the reviewed 0.3.0/DA1 Rules/revision 3 to an explicitly approved destination.
  Verify exact deployed identities, policy floor and actual operator ADC permissions.
  Preserve billing, other channels and provider configuration.
- Select a sacrificial Google or Microsoft personal Taskify identity with no needed
  application records. Establish UID A from the authenticated session, never email
  lookup. Keep linked-method testing qualified by the unresolved Slice 4 hold.
- Obtain user confirmation through typed DELETE and fresh provider proof. Record
  accepted UID/job/inventory/control state. Inspect the exact target before obtaining
  explicit authority to run its operator cleanup/Auth deletion. No arbitrary UID,
  fabricated request, test-only proof bypass, global sweep or force flag.
- Tokens stay only in ephemeral memory of the controlled test process/browser.
  Disable HAR, network traces, request-header logs and screenshots containing tokens
  or account details. Persist only test IDs, timings, bounded status/error codes,
  aggregate counts and hashes. Losing the process may require a new test, not raw
  credential recovery from files. Do not expose tokens in chat or source control.

## Provider and UID-isolation matrix

1. For each approved provider, verify normal sign-in/restoration/Logout, then popup
   proof and cancel before submitting intent. Check the original UID is unchanged
   and no request exists. Repeat actual mobile redirect with same-UID return and
   explicit final-request boundary. Record browser/device/build and owner-reported
   versus independently observed evidence separately.
2. Test cancelled/failed/wrong-account verification and account switching. Confirm
   no deletion request is sent. Test compatibility/network loss without bypassing
   admission. Do not claim the held linking defect is resolved by this evidence.
3. For the exact authorized deletion job, observe second-tab recovery and refusal
   to provision while A's Auth still exists, including after data emptiness. Logout
   does not cancel the operator. Unknown outcomes remain blocked/reconcilable.
4. After verified Auth removal, register the same provider identity again and record
   distinct UID B. B may initialize while A remains fenced; it cannot read A's job,
   data or markers. Resuming A's job must leave B untouched. Formerly linked-method
   re-registration/conflict coverage stays pending where linking is unaccepted.

## T7 observations

Keep a normal online client, an offline/queued client and an already-open SDK stream
for A under controlled observation. Capture relevant issuance/expiry metadata in
memory. Use legitimate schema-valid initialization/provisioning writes as probes;
a malformed or intrinsically prohibited write is not proof that fencing works.
Never use B's namespace for A's probes.

| Phase | Required observation |
|---|---|
| Before intent | Baseline admissible write path is established without creating unnecessary user data |
| Intent committed, Auth present | Rules deny new/pending writes and provisioning; second client hides content |
| Data verified, Auth deletion | Independent emptiness and exact pinned identity; interruption/unknown responses reconcile; Auth absence confirmed |
| Auth absent, fence retained | Old credentials cannot refresh; stale/offline/queued attempts cannot recreate data; new B remains independent |
| Safety window | Preserve the fence through at least 4,200 seconds from the resolved trusted absence anchor, not intent or local clock |
| Expiry/stream checks | Distinguish authenticated Rules denial from actual expired/revoked credential rejection; inspect stream closure/reconnection and already-in-flight outcomes |
| Retirement eligibility | Recheck Auth absence, full inventory emptiness, immutable job/anchor and current lease; no unsupported versions or uncertain operations |
| After separately approved retirement canary | Old A cannot recreate data; B remains untouched; no controls are cleared merely to make a test pass |

An expired-token 401/UNAUTHENTICATED response is different from a 403/PERMISSION_DENIED
caused by the retained fence. A fenced denial alone does not establish safety after
fence removal. SDK automatic anonymous fallback on a public read is also not proof
that an old token remains valid. Record the actual authorization layer and outcome.

One-hour ID-token lifetime and refresh-token invalidation on user deletion supply
platform constraints, not complete application proof. The extra ten-minute margin
does not establish an undocumented propagation bound. Review open-stream and delayed
request behavior explicitly; do not replace real elapsed platform behavior with a
fake clock or emulator-only test.

## Retirement gate and failure handling

The current retire command is disabled before connecting. Do not bypass it or remove
the fence by hand to obtain a passing result. A positive retirement canary needs a
reviewed guarded implementation and separately authorized exact lab target after
the preceding safety prerequisites. If the evidence cannot justify that operation,
retain the fence and report T7 inconclusive. No production retirement enablement
follows automatically from a single canary or the scheduled deadline.

Unexpected admitted writes, recreated old UID, unsupported inventory, Auth lookup
uncertainty or a safety-bound failure stops the test. Preserve control metadata,
capture content-free evidence and request explicit reconciliation; never delete a
substitute UID, roll back the job state, fabricate completion or silently expand
scope. Keep real accounts/workspaces outside the selected target unchanged.

After T7 is supported, review contract/implementation changes and targeted local
tests before enabling any retirement path. Slice 5A closure still requires owner
acceptance and coordinated release/rollback evidence.

Platform references reviewed 5 November 2026:
[Firebase sessions](https://firebase.google.com/docs/auth/admin/manage-sessions),
[Firestore Rules conditions](https://firebase.google.com/docs/firestore/security/rules-conditions).
