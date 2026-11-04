import { afterEach, expect, it, vi } from 'vitest';
import { createWorkspaceController } from '../../src/application/workspace-controller';
import { createSessionController } from '../../src/application/session-controller';
import type { SessionIdentity } from '../../src/application/session-controller';
import { createCompatibilityGate } from '../../src/application/compatibility-gate';
import { WorkspaceError } from '../../src/application/workspace-port';
import type {
  WorkspacePort,
  WorkspaceInitialInput,
} from '../../src/application/workspace-port';
import { capabilities, contract } from '../support/compatibility-fixtures';
const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
});
const flush = async () => {
  for (let i = 0; i < 250; i++) await Promise.resolve();
};
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}
function setup(
  timezone: string | undefined = 'Asia/Kolkata',
  name = 'Original owner',
) {
  const timers: { fn: () => void; ms: number; stopped: boolean }[] = [];
  const clock = {
    schedule(fn: () => void, ms: number) {
      const item = { fn, ms, stopped: false };
      timers.push(item);
      return () => {
        item.stopped = true;
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
  let observer: (identity: SessionIdentity | null) => void = () => {};

  const session = createSessionController(
    {
      initialize: async () => {},
      observe(next) {
        observer = next;
        next({ uid: 'owner', displayName: name });
        return () => {};
      },
      signOut: async () => {
        observer(null);
      },
      dispose() {},
    },
    gate,
    clock,
    () => workspace?.clearAccountState(),
  );
  const records = new Map<
    string,
    {
      next: number;
      complete: boolean;
      timezone?: string;
      profile?: { displayName?: string; photoUrl?: string };
    }
  >();
  const record = (uid: string) => {
    let value = records.get(uid);
    if (!value) {
      value = { next: 0, complete: false };
      records.set(uid, value);
    }
    return value;
  };
  const fences: {
    next: (exists: boolean, authoritative: boolean) => void;
    error: () => void;
    stop: ReturnType<typeof vi.fn>;
  }[] = [];
  const port = {
    inspect: vi.fn(async (uid: string, current: () => boolean) => {
      if (!current()) throw new WorkspaceError('revoked');
      const r = record(uid);
      return {
        complete: r.complete,
        nextStage: r.next,
        ...(r.profile ? { profile: r.profile } : {}),
        ...(r.timezone ? { timezone: r.timezone } : {}),
      };
    }),
    stage: vi.fn(
      async (
        uid: string,
        index: number,
        input: WorkspaceInitialInput,
        current: () => boolean,
      ) => {
        if (!current()) throw new WorkspaceError('revoked');
        const r = record(uid);
        if (index === 0 && r.next === 0) {
          if (!input.timezone) throw new WorkspaceError('timezone-required');
          if (input.profile?.displayName === 'invalid')
            throw new WorkspaceError('profile-invalid');
          r.timezone = input.timezone;
          r.profile = { ...input.profile };
        }
        r.next = Math.max(r.next, index + 1);
      },
    ),
    finalize: vi.fn(async (uid: string, current: () => boolean) => {
      if (!current()) throw new WorkspaceError('revoked');
      record(uid).complete = true;
    }),
    watchFence: vi.fn(
      (
        uid: string,
        next: (exists: boolean, authoritative: boolean) => void,
        error: () => void,
      ) => {
        void uid;
        const stop = vi.fn();
        fences.push({ next, error, stop });
        next(false, true);
        return stop;
      },
    ),
    dispose: vi.fn(),
  } satisfies WorkspacePort;
  const workspace = createWorkspaceController(
    port,
    session,
    clock,
    () => timezone,
  );
  session.start();
  const controller = workspace;
  cleanups.push(() => {
    controller.dispose();
    session.dispose();
    gate.dispose();
  });
  return {
    controller,
    port,
    session,
    gate,
    observer: (identity: SessionIdentity | null) => observer(identity),
    record,
    fences,
    timers,
  };
}
it('runs all stages through verified inspection without any provider-status dependency', async () => {
  const s = setup();
  await flush();
  expect(s.controller.getState()).toMatchObject({
    status: 'ready',
    profileName: 'Original owner',
    timezone: 'Asia/Kolkata',
    pending: false,
  });
  expect(s.port.stage.mock.calls.map((call) => call[1])).toEqual(
    Array.from({ length: 24 }, (_, index) => index),
  );
  expect(s.port.finalize).toHaveBeenCalledOnce();
});
it('does not reset or reseed a completed workspace or its persisted profile', async () => {
  const s = setup();
  Object.assign(s.record('owner'), {
    complete: true,
    next: 24,
    timezone: 'UTC',
    profile: { displayName: 'Persisted profile' },
  });
  await flush();
  expect(s.controller.getState()).toMatchObject({
    status: 'ready',
    profileName: 'Persisted profile',
  });
  expect(s.port.stage).not.toHaveBeenCalled();
});
it('requires an explicit timezone choice without silently defaulting UTC', async () => {
  const s = setup('');
  await flush();
  expect(s.controller.getState().status).toBe('timezone-required');
  s.controller.selectTimezone('UTC');
  await flush();
  expect(s.controller.getState()).toMatchObject({
    status: 'ready',
    timezone: 'UTC',
  });
});
it('supports explicit omission of invalid optional profile details', async () => {
  const s = setup('UTC', 'invalid');
  await flush();
  expect(s.controller.getState().status).toBe('profile-invalid');
  s.controller.continueWithoutProfile();
  await flush();
  expect(s.controller.getState()).toMatchObject({
    status: 'ready',
    profileName: null,
  });
});
it('clears account data on Logout and suppresses late operation results', async () => {
  const s = setup(),
    wait = deferred();
  s.port.stage.mockImplementationOnce(async () => wait.promise);
  await flush();
  expect(s.controller.getState().pending).toBe(true);
  await s.session.signOut();
  wait.resolve();
  await flush();
  expect(s.controller.getState()).toMatchObject({
    status: 'idle',
    profileName: null,
    timezone: null,
    pending: false,
  });
  expect(s.port.finalize).not.toHaveBeenCalled();
});
it('never publishes the old UID result after account switching, including same-account generations', async () => {
  const s = setup(),
    wait = deferred();
  s.port.inspect.mockImplementationOnce(async () => {
    await wait.promise;
    return {
      complete: true,
      nextStage: 24,
      profile: { displayName: 'OLD ACCOUNT' },
    };
  });
  await flush();
  s.observer({ uid: 'new-owner', displayName: 'New account' });
  wait.resolve();
  await flush();
  expect(s.controller.getState()).toMatchObject({
    status: 'ready',
    profileName: 'New account',
  });
  expect(s.port.stage.mock.calls.every((call) => call[0] === 'new-owner')).toBe(
    true,
  );
});
it('suspends new writes across gate loss and reconciles on fresh admission', async () => {
  const s = setup(),
    wait = deferred();
  s.port.stage.mockImplementationOnce(async () => wait.promise);
  await flush();
  s.gate.suspend('hidden');
  expect(s.controller.getState().status).toBe('waiting');
  const guard = s.port.stage.mock.calls[0]![3];
  expect(guard()).toBe(false);
  wait.resolve();
  await flush();
  expect(s.port.stage).toHaveBeenCalledTimes(1);
  s.gate.recheck('resume');
  await flush();
  expect(s.controller.getState().status).toBe('ready');
  expect(s.port.inspect).toHaveBeenCalledTimes(3);
});
it('fences setup immediately and ignores callbacks from replaced watchers', async () => {
  const s = setup();
  await flush();
  const old = s.fences[0]!;
  old.error();
  expect(s.controller.getState().status).toBe('error');
  s.controller.retry();
  await flush();
  expect(s.controller.getState().status).toBe('ready');
  old.next(true, true);
  expect(s.controller.getState().status).toBe('ready');
  s.fences.at(-1)!.next(true, true);
  expect(s.controller.getState()).toMatchObject({
    status: 'fenced',
    profileName: null,
    timezone: null,
  });
});
it('never submits stages from an unconfirmed/cache-only fence absence', async () => {
  const s = setup();
  s.port.watchFence.mockImplementationOnce((_uid, next, error) => {
    s.fences.push({ next, error, stop: vi.fn() });
    next(false, false);
    return vi.fn();
  });
  await flush();
  expect(s.port.inspect).not.toHaveBeenCalled();
  s.fences.at(-1)!.next(false, true);
  await flush();
  expect(s.controller.getState().status).toBe('ready');
});
it('does not spin after failed verification; explicit retry inspects server progress', async () => {
  const s = setup();
  s.port.inspect.mockRejectedValueOnce(new WorkspaceError('unavailable'));
  await flush();
  expect(s.controller.getState().status).toBe('error');
  expect(s.port.inspect).toHaveBeenCalledOnce();
  s.controller.retry();
  await flush();
  expect(s.controller.getState().status).toBe('ready');
});
it('holds serialization while a timed-out SDK operation may still settle', async () => {
  const s = setup(),
    wait = deferred();
  s.port.stage.mockImplementationOnce(async () => {
    s.record('owner').next = 1;
    await wait.promise;
  });
  await flush();
  [...s.timers]
    .reverse()
    .find((timer) => timer.ms === 20000 && !timer.stopped)!
    .fn();
  expect(s.controller.getState()).toMatchObject({
    status: 'error',
    reason: 'uncertain',
    pending: true,
  });
  s.controller.retry();
  expect(s.port.inspect).toHaveBeenCalledOnce();
  wait.resolve();
  await flush();
  expect(s.controller.getState().pending).toBe(false);
  s.controller.retry();
  await flush();
  expect(s.controller.getState().status).toBe('ready');
  expect(s.port.stage.mock.calls.filter((call) => call[1] === 0)).toHaveLength(
    1,
  );
});
it('does not reuse updated provider profile metadata once workspace ready', async () => {
  const s = setup();
  await flush();
  const reads = s.port.inspect.mock.calls.length;
  s.observer({
    uid: 'owner',
    displayName: 'Changed provider name',
    photoUrl: 'https://example.invalid/photo',
  });
  await flush();
  expect(s.controller.getState().profileName).toBe('Original owner');
  expect(s.port.inspect).toHaveBeenCalledTimes(reads);
});
it('disposes watchers and prevents late UI resurrection', async () => {
  const s = setup(),
    wait = deferred();
  s.port.inspect.mockImplementationOnce(async () => {
    await wait.promise;
    return { complete: true, nextStage: 24 };
  });
  await flush();
  s.controller.dispose();
  const frozen = s.controller.getState();
  wait.resolve();
  await flush();
  expect(s.controller.getState()).toBe(frozen);
  expect(s.port.dispose).toHaveBeenCalledOnce();
});
