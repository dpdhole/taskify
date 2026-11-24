import { beforeEach, expect, it, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { createNavigationReader } from '../../src/infrastructure/firebase/navigation-reader';
import { createWorkspaceSeedPlan } from '../../src/domain/workspace-seeds';
const fixture = vi.hoisted(() => ({
  next: (_: unknown) => {},
  error: () => {},
  stop: vi.fn(),
}));
vi.mock('firebase/firestore', async (original) => ({
  ...(await original<typeof import('firebase/firestore')>()),
  collection: (_db: unknown, ...segments: string[]) => segments.join('/'),
  onSnapshot: (
    _path: unknown,
    _options: unknown,
    next: typeof fixture.next,
    error: typeof fixture.error,
  ) => {
    fixture.next = next;
    fixture.error = error;
    return fixture.stop;
  },
}));
const meta = { fromCache: false, hasPendingWrites: false };
function records() {
  return createWorkspaceSeedPlan().views.map(({ id, ...value }) => ({
    id,
    metadata: meta,
    ref: { path: 'users/owner/views/' + id },
    exists: () => true,
    data: () => ({
      ...value,
      schemaVersion: 1,
      recordVersion: 1,
      createdAt: new Timestamp(0, 0),
      updatedAt: new Timestamp(0, 0),
    }),
  }));
}
beforeEach(() => vi.clearAllMocks());
it('publishes confirmed globally ordered metadata and rejects late callbacks after disposal', () => {
  const next = vi.fn();
  const stop = createNavigationReader({} as Firestore).watch('owner', next);
  fixture.next({ metadata: meta, docs: records().reverse() });
  expect(next.mock.lastCall?.[0]).toMatchObject({
    status: 'ready',
    views: createWorkspaceSeedPlan().views.map(
      ({ id, name, order, showOnHome }) => ({ id, name, order, showOnHome }),
    ),
  });
  stop();
  fixture.next({ metadata: meta, docs: records() });
  fixture.error();
  expect(next).toHaveBeenCalledOnce();
  expect(fixture.stop).toHaveBeenCalledOnce();
});
it('clears metadata on cache/pending snapshots, malformed records, missing All Tasks and read errors', () => {
  const next = vi.fn();
  createNavigationReader({} as Firestore).watch('owner', next);
  fixture.next({ metadata: { ...meta, fromCache: true }, docs: records() });
  expect(next).toHaveBeenLastCalledWith({ status: 'waiting', views: [] });
  fixture.next({
    metadata: { ...meta, hasPendingWrites: true },
    docs: records(),
  });
  expect(next).toHaveBeenLastCalledWith({ status: 'waiting', views: [] });
  fixture.next({
    metadata: meta,
    docs: records().filter((v) => v.id !== 'all-tasks'),
  });
  expect(next).toHaveBeenLastCalledWith({ status: 'error', views: [] });
  const wrongOwner = records();
  wrongOwner[0]!.ref.path = 'users/other/views/focus';
  fixture.next({ metadata: meta, docs: wrongOwner });
  expect(next).toHaveBeenLastCalledWith({ status: 'error', views: [] });
  fixture.error();
  expect(next).toHaveBeenLastCalledWith({ status: 'error', views: [] });
});
