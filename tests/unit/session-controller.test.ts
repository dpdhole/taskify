import { expect, it, vi } from 'vitest';
import {
  createSessionController,
  SessionError,
} from '../../src/application/session-controller';
import type {
  AuthPort,
  SessionIdentity,
} from '../../src/application/session-controller';
import { createCompatibilityGate } from '../../src/application/compatibility-gate';
import { capabilities, contract } from '../support/compatibility-fixtures';
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e?: unknown) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
function setup() {
  const initializations: ReturnType<typeof deferred<void>>[] = [];
  const signouts: ReturnType<typeof deferred<void>>[] = [];
  const watchers: {
    next: (identity: SessionIdentity | null) => void;
    error: () => void;
    stopped: boolean;
  }[] = [];
  const timers: { fn: () => void; stopped: boolean }[] = [];
  const clock = {
    schedule(fn: () => void) {
      const timer = { fn, stopped: false };
      timers.push(timer);
      return () => {
        timer.stopped = true;
      };
    },
  };
  const gate = createCompatibilityGate(
    {
      readServer: async () => contract(),
      watch(next) {
        next(contract(), true);
        return () => {};
      },
    },
    capabilities,
    clock,
  );
  gate.start();
  const auth: AuthPort = {
    initialize() {
      const d = deferred<void>();
      initializations.push(d);
      return d.promise;
    },
    observe(next, error) {
      const w = { next, error, stopped: false };
      watchers.push(w);
      return () => {
        w.stopped = true;
      };
    },
    signOut() {
      const d = deferred<void>();
      signouts.push(d);
      return d.promise;
    },
    dispose: vi.fn(),
  };
  const clear = vi.fn();
  const session = createSessionController(auth, gate, clock, clear);
  session.start();
  const finish = async (
    identity: SessionIdentity | null = { uid: 'first' },
  ) => {
    watchers.at(-1)!.next(identity);
    initializations.at(-1)!.resolve();
    await flush();
  };
  return {
    session,
    gate,
    auth,
    clear,
    watchers,
    initializations,
    signouts,
    timers,
    finish,
  };
}
it('does not flash login or admit before persistence and observer initialization both complete', async () => {
  const t = setup();
  t.watchers[0]!.next({ uid: 'first' });
  expect(t.session.getState().status).toBe('restoring');
  expect(() => t.session.admit()).toThrow();
  t.initializations[0]!.resolve();
  await flush();
  expect(t.session.getState().protectedReady).toBe(true);
  t.session.dispose();
  t.gate.dispose();
});
it('handles initialization before initial null observation', async () => {
  const t = setup();
  t.initializations[0]!.resolve();
  await flush();
  expect(t.session.getState().status).toBe('restoring');
  t.watchers[0]!.next(null);
  expect(t.session.getState().status).toBe('signed-out');
  t.session.dispose();
  t.gate.dispose();
});
it('restores identity with a closed compatibility gate, keeps Logout and expires old tickets across rechecks', async () => {
  const t = setup();
  await t.finish();
  const ticket = t.session.admit();
  t.gate.suspend('offline');
  expect(t.session.getState().identity?.uid).toBe('first');
  expect(t.session.getState().canLogout).toBe(true);
  expect(t.session.isCurrent(ticket)).toBe(false);
  t.gate.recheck();
  expect(t.session.getState().protectedReady).toBe(true);
  expect(t.session.isCurrent(ticket)).toBe(false);
  t.session.dispose();
  t.gate.dispose();
});
it('clears account state and expires async work on UID switch or cross-tab Logout', async () => {
  const t = setup();
  await t.finish();
  const ticket = t.session.admit();
  t.clear.mockClear();
  t.watchers[0]!.next({ uid: 'second' });
  expect(t.clear).toHaveBeenCalledTimes(1);
  expect(t.session.isCurrent(ticket)).toBe(false);
  expect(() => t.session.submit(ticket, () => {})).toThrow();
  t.watchers[0]!.next(null);
  expect(t.session.getState().identity).toBeNull();
  expect(t.session.getState().status).toBe('signed-out');
  t.session.dispose();
  t.gate.dispose();
});
it('hides identity immediately on Logout and requires both SDK completion and null observer', async () => {
  const t = setup();
  await t.finish();
  const ticket = t.session.admit();
  const pending = t.session.signOut();
  expect(t.session.getState().identity).toBeNull();
  expect(t.session.isCurrent(ticket)).toBe(false);
  expect(t.session.getState().status).toBe('signing-out');
  await t.session.signOut();
  expect(t.signouts).toHaveLength(1);
  t.signouts[0]!.resolve();
  await pending;
  expect(t.session.getState().status).toBe('signing-out');
  t.watchers[0]!.next(null);
  expect(t.session.getState().status).toBe('signed-out');
  t.session.dispose();
  t.gate.dispose();
});
it('does not claim Logout on observer null before a failed SDK acknowledgement; retry can confirm already-null state', async () => {
  const t = setup();
  await t.finish();
  const pending = t.session.signOut();
  t.watchers[0]!.next(null);
  t.signouts[0]!.reject();
  await pending;
  expect(t.session.getState().status).toBe('error');
  expect(t.session.getState().canLogout).toBe(true);
  expect(t.session.getState().identity).toBeNull();
  const retry = t.session.signOut();
  t.signouts[1]!.resolve();
  await retry;
  expect(t.session.getState().status).toBe('signed-out');
  t.session.dispose();
  t.gate.dispose();
});
it('quarantines non-null identity observations after failed Logout until successful retry', async () => {
  const t = setup();
  await t.finish();
  const pending = t.session.signOut();
  t.signouts[0]!.reject();
  await pending;
  t.watchers[0]!.next({ uid: 'second' });
  expect(t.session.getState().identity).toBeNull();
  expect(t.session.getState().protectedReady).toBe(false);
  t.session.retry();
  expect(t.initializations).toHaveLength(1);
  const retry = t.session.signOut();
  t.watchers[0]!.next(null);
  t.signouts[1]!.resolve();
  await retry;
  expect(t.session.getState().status).toBe('signed-out');
  t.session.dispose();
  t.gate.dispose();
});
it('times out restoration, ignores late success and recovers only through a new generation', async () => {
  const t = setup();
  t.timers.at(-1)!.fn();
  t.initializations[0]!.resolve();
  t.watchers[0]!.next({ uid: 'late' });
  await flush();
  expect(t.session.getState().reason).toBe('timeout');
  t.session.retry();
  t.watchers[0]!.next({ uid: 'stale' });
  await t.finish({ uid: 'fresh' });
  expect(t.session.getState().identity?.uid).toBe('fresh');
  expect(t.watchers[0]!.stopped).toBe(true);
  t.session.dispose();
  t.gate.dispose();
});
it('does not reopen restoration after observer error followed by late initialization success', async () => {
  const t = setup();
  t.watchers[0]!.next({ uid: 'first' });
  t.watchers[0]!.error();
  t.initializations[0]!.resolve();
  await flush();
  expect(t.session.getState().status).toBe('error');
  expect(t.session.getState().protectedReady).toBe(false);
  t.session.retry();
  await t.finish();
  expect(t.session.getState().protectedReady).toBe(true);
  t.session.dispose();
  t.gate.dispose();
});
it('reports persistence failure without accepting subsequent observer updates', async () => {
  const t = setup();
  t.watchers[0]!.next({ uid: 'first' });
  t.initializations[0]!.reject(new SessionError('persistence'));
  await flush();
  t.watchers[0]!.next({ uid: 'second' });
  expect(t.session.getState().reason).toBe('persistence');
  expect(t.session.getState().identity).toBeNull();
  t.session.dispose();
  t.gate.dispose();
});
it('allows retry after Logout timeout and ignores stale SDK settlement', async () => {
  const t = setup();
  await t.finish();
  const first = t.session.signOut();
  t.timers.at(-1)!.fn();
  expect(t.session.getState().reason).toBe('logout-timeout');
  expect(t.session.getState().canLogout).toBe(true);
  const second = t.session.signOut();
  t.signouts[0]!.resolve();
  await first;
  expect(t.session.getState().canLogout).toBe(false);
  t.watchers[0]!.next(null);
  t.signouts[1]!.resolve();
  await second;
  expect(t.session.getState().status).toBe('signed-out');
  t.session.dispose();
  t.gate.dispose();
});
it('disposes observers, projections and deadlines; late work cannot publish', async () => {
  const t = setup();
  const listener = vi.fn();
  t.session.subscribe(listener);
  t.session.dispose();
  const calls = listener.mock.calls.length;
  t.initializations[0]!.resolve();
  t.watchers[0]!.next({ uid: 'late' });
  t.gate.suspend('offline');
  await flush();
  expect(listener).toHaveBeenCalledTimes(calls);
  expect(t.watchers[0]!.stopped).toBe(true);
  expect(t.auth.dispose).toHaveBeenCalledOnce();
  expect(t.session.getState().status).toBe('disposed');
  t.gate.dispose();
});
it('can confirm Logout with a fresh observer after the restoration observer has failed', async () => {
  const t = setup();
  await t.finish();
  t.watchers[0]!.error();
  expect(t.session.getState().status).toBe('error');
  const pending = t.session.signOut();
  expect(t.watchers).toHaveLength(2);
  t.watchers[1]!.next(null);
  t.signouts[0]!.resolve();
  await pending;
  expect(t.session.getState().status).toBe('signed-out');
  expect(t.watchers[1]!.stopped).toBe(true);
  t.session.dispose();
  t.gate.dispose();
});

for (const provider of ['google', 'microsoft'] as const) {
  it(
    provider +
      ' admits once, waits for SDK completion and rechecks the current gate',
    async () => {
      const t = setup();
      await t.finish(null);
      const result = deferred<void>();
      t.auth.signIn = vi.fn(() => result.promise);
      const pending = t.session.signIn(provider, 'popup');
      void t.session.signIn(
        provider === 'google' ? 'microsoft' : 'google',
        'popup',
      );
      expect(t.auth.signIn).toHaveBeenCalledOnce();
      t.watchers[0]!.next({ uid: 'google-user' });
      expect(t.session.getState().protectedReady).toBe(false);
      t.gate.suspend('offline');
      result.resolve();
      await pending;
      expect(t.session.getState().status).toBe('signed-in');
      expect(t.session.getState().protectedReady).toBe(false);
      t.session.dispose();
      t.gate.dispose();
    },
  );
  it(
    provider +
      ' offers retry after popup rejection and blocks sign-in while compatibility is closed',
    async () => {
      const t = setup();
      await t.finish(null);
      t.auth.signIn = vi
        .fn()
        .mockRejectedValue(new SessionError('popup-blocked'));
      await t.session.signIn(provider, 'popup');
      expect(t.session.getState()).toMatchObject({
        status: 'signed-out',
        reason: 'popup-blocked',
        canSignIn: true,
      });
      t.gate.suspend('offline');
      await t.session.signIn(provider, 'redirect');
      expect(t.auth.signIn).toHaveBeenCalledOnce();
      t.session.dispose();
      t.gate.dispose();
    },
  );
  it(
    provider +
      ' Logout during sign-in invalidates completion and blocks duplicates until it settles',
    async () => {
      const t = setup();
      await t.finish(null);
      const result = deferred<void>();
      t.auth.signIn = vi.fn(() => result.promise);
      const pending = t.session.signIn(provider, 'popup');
      expect(t.session.getState().canLogout).toBe(true);
      const logout = t.session.signOut();
      t.watchers.at(-1)!.next(null);
      t.signouts[0]!.resolve();
      await logout;
      expect(t.session.getState()).toMatchObject({
        status: 'signed-out',
        canSignIn: false,
      });
      result.reject(new SessionError('cancelled'));
      await pending;
      expect(t.session.getState()).toMatchObject({
        status: 'signed-out',
        reason: 'none',
        canSignIn: true,
        protectedReady: false,
      });
      t.session.dispose();
      t.gate.dispose();
    },
  );
}

for (const provider of ['google', 'microsoft'] as const) {
  it(
    provider +
      ' never offers Logout after cancellation is confirmed while popup close is still settling',
    async () => {
      const t = setup();
      await t.finish(null);
      const result = deferred<void>();
      t.auth.signIn = vi.fn(() => result.promise);
      const seen: { status: string; canLogout: boolean }[] = [];
      const stop = t.session.subscribe((state) =>
        seen.push({ status: state.status, canLogout: state.canLogout }),
      );
      const pending = t.session.signIn(provider, 'popup');
      expect(t.session.getState()).toMatchObject({
        status: 'signing-in',
        canLogout: true,
      });
      // A closed popup can leave its SDK promise pending until the next close poll.
      const cancelling = t.session.signOut();
      t.watchers.at(-1)!.next(null);
      t.signouts[0]!.resolve();
      await cancelling;
      expect(t.session.getState()).toMatchObject({
        status: 'signed-out',
        canLogout: false,
        canSignIn: false,
      });
      t.gate.suspend('offline');
      expect(t.session.getState().canLogout).toBe(false);
      result.reject(new SessionError('cancelled'));
      await pending;
      expect(
        seen
          .filter((state) => state.status === 'signed-out')
          .every((state) => !state.canLogout),
      ).toBe(true);
      expect(t.session.getState()).toMatchObject({
        status: 'signed-out',
        canLogout: false,
        protectedReady: false,
      });
      stop();
      t.session.dispose();
      t.gate.dispose();
    },
  );
}

for (const provider of ['google', 'microsoft'] as const) {
  it(
    provider +
      ' preserves sign-out recovery if the auth observer fails during an active attempt',
    async () => {
      const t = setup();
      await t.finish(null);
      const result = deferred<void>();
      t.auth.signIn = vi.fn(() => result.promise);
      const pending = t.session.signIn(provider, 'popup');
      t.watchers[0]!.error();
      expect(t.session.getState()).toMatchObject({
        status: 'error',
        canLogout: true,
      });
      const cancelling = t.session.signOut();
      t.watchers.at(-1)!.next(null);
      t.signouts[0]!.resolve();
      await cancelling;
      expect(t.session.getState()).toMatchObject({
        status: 'signed-out',
        canLogout: false,
      });
      result.reject(new SessionError('cancelled'));
      await pending;
      t.session.dispose();
      t.gate.dispose();
    },
  );
}
