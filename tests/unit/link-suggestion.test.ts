import { it, vi, expect } from 'vitest';
import {
  createSessionController,
  SessionError,
} from '../../src/application/session-controller';
import type { SessionIdentity } from '../../src/application/session-controller';
import { createCompatibilityGate } from '../../src/application/compatibility-gate';
import { contract, capabilities } from '../support/compatibility-fixtures';
async function setup() {
  let notify!: (v: SessionIdentity | null) => void;
  const clock = {
    schedule() {
      return () => {};
    },
  };
  const gate = createCompatibilityGate(
    {
      readServer: async () => contract(),
      watch(fn) {
        fn(contract(), true);
        return () => {};
      },
    },
    capabilities,
    clock,
  );
  const signIn = vi.fn<() => Promise<void>>();
  const session = createSessionController(
    {
      initialize: async () => {},
      observe(fn) {
        notify = fn;
        return () => {};
      },
      signOut: async () => {
        notify(null);
      },
      signIn,
      dispose() {},
    },
    gate,
    clock,
    () => {},
  );
  gate.start();
  session.start();
  notify(null);
  await Promise.resolve();
  await Promise.resolve();
  return {
    session,
    gate,
    signIn,
    notify,
    dispose() {
      session.dispose();
      gate.dispose();
    },
  };
}
it('retains only the attempted provider as an explicit suggestion after conflict and existing-method sign-in', async () => {
  const t = await setup();
  t.signIn.mockRejectedValueOnce(new SessionError('account-conflict'));
  await t.session.signIn('google', 'popup');
  t.signIn.mockImplementation(async () => {
    t.notify({ uid: 'existing-account' });
  });
  await t.session.signIn('microsoft', 'popup');
  expect(t.session.getState()).toMatchObject({
    status: 'signed-in',
    identity: { uid: 'existing-account' },
    linkSuggestion: 'google',
  });
  t.session.clearLinkSuggestion();
  expect(t.session.getState().linkSuggestion).toBeUndefined();
  t.dispose();
});
it.each(['logout', 'switch'] as const)(
  'clears the provider-only suggestion on %s',
  async (action) => {
    const t = await setup();
    t.signIn.mockRejectedValueOnce(new SessionError('account-conflict'));
    await t.session.signIn('google', 'popup');
    t.signIn.mockImplementation(async () => {
      t.notify({ uid: 'owner' });
    });
    await t.session.signIn('microsoft', 'popup');
    if (action === 'logout') await t.session.signOut();
    else t.notify({ uid: 'other' });
    expect(t.session.getState().linkSuggestion).toBeUndefined();
    t.dispose();
  },
);
