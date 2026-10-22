import { describe, it, expect, vi } from 'vitest';
import { decodeProbe } from '../../src/domain/probe';
import { createProbeSession } from '../../src/application/probe-session';
import type {
  ProbeReader,
  ProbeState,
} from '../../src/application/probe-session';
import { createMemoryProbe } from '../../src/infrastructure/memory/probe-reader';
import { createProbeStore } from '../../src/state/probe-store';
import { decodeLocalConfig } from '../../src/infrastructure/firebase/local-config';
import { inspectSource } from '../../tools/boundaries.mjs';
describe('probe boundaries', () => {
  it('decodes only valid synthetic values', () => {
    expect(decodeProbe({ message: 'Valid', revision: 0 })).toEqual({
      message: 'Valid',
      revision: 0,
    });
  });
  it.each([
    null,
    {},
    [],
    { message: '', revision: 0 },
    { message: 'Value', revision: -1 },
    { message: 'Value', revision: 1.1 },
    { message: 'Value', revision: '1' },
    { message: 9, revision: 1 },
  ])('rejects malformed value %j', (value) => {
    expect(() => decodeProbe(value)).toThrow();
  });
  it('updates two isolated projections and disposes subscriptions', () => {
    const a = createMemoryProbe(),
      b = createMemoryProbe(),
      sa = createProbeStore(),
      sb = createProbeStore();
    const one = createProbeSession(a.reader, sa.publish),
      two = createProbeSession(b.reader, sb.publish);
    one.start();
    two.start();
    a.publish({ message: 'Changed', revision: 2 });
    expect(sa.store.getState().state).toEqual({
      status: 'ready',
      value: { message: 'Changed', revision: 2 },
    });
    expect(sb.store.getState().state).toMatchObject({
      status: 'ready',
      value: { revision: 0 },
    });
    one.start();
    expect(a.subscriberCount).toBe(1);
    one.stop();
    two.stop();
    expect(a.subscriberCount + b.subscriberCount).toBe(0);
  });
  it('ignores late callbacks from previous generations and stopped sessions', () => {
    const callbacks: ((v: unknown) => void)[] = [];
    const reader: ProbeReader = {
      watch(next) {
        callbacks.push(next);
        return () => {};
      },
    };
    const publish = vi.fn();
    const session = createProbeSession(reader, publish);
    session.start();
    session.start();
    publish.mockClear();
    callbacks[0]?.({ message: 'Stale', revision: 1 });
    expect(publish).not.toHaveBeenCalled();
    callbacks[1]?.({ message: 'Current', revision: 2 });
    expect(publish).toHaveBeenCalledOnce();
    session.stop();
    publish.mockClear();
    callbacks[1]?.({ message: 'Late', revision: 3 });
    expect(publish).not.toHaveBeenCalled();
  });
  it('fails closed on malformed data, reader errors and synchronous failure', () => {
    const states: ProbeState[] = [];
    const reader: ProbeReader = {
      watch(next, error) {
        next({ message: 3 });
        error();
        return () => {};
      },
    };
    createProbeSession(reader, (s) => states.push(s)).start();
    expect(states.at(-1)).toEqual({ status: 'error' });
    createProbeSession(
      {
        watch() {
          throw Error('No connection');
        },
      },
      (s) => states.push(s),
    ).start();
    expect(states.at(-1)).toEqual({ status: 'error' });
  });
  it('permits only the explicit demo loopback configuration', () => {
    expect(
      decodeLocalConfig({
        projectId: 'demo-taskify-foundation',
        host: '127.0.0.1',
        firestorePort: 8080,
      }),
    ).toMatchObject({ host: '127.0.0.1' });
    for (const data of [
      null,
      {},
      { projectId: 'real-project', host: '127.0.0.1', firestorePort: 8080 },
      {
        projectId: 'demo-taskify-foundation',
        host: '0.0.0.0',
        firestorePort: 8080,
      },
      {
        projectId: 'demo-taskify-foundation',
        host: '127.0.0.1',
        firestorePort: '8080',
      },
    ])
      expect(() => decodeLocalConfig(data)).toThrow();
  });
  it('rejects forbidden relative, alias, SDK and nonliteral dependencies', () => {
    for (const source of [
      "import x from '../ui/ProofView'",
      "import x from '@/ui/ProofView'",
      "import {getFirestore} from 'firebase/firestore'",
      'import(target)',
    ])
      expect(
        inspectSource('src/domain/forbidden.ts', source).length,
      ).toBeGreaterThan(0);
    expect(
      inspectSource(
        'src/application/allowed.ts',
        "import type {ProbeValue} from '../domain/probe' ",
      ),
    ).toEqual([]);
  });
});
