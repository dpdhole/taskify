import { decodeProbe } from '../domain/probe';
import type { ProbeValue } from '../domain/probe';

export interface ProbeReader {
  watch(next: (value: unknown) => void, error: () => void): () => void;
}
export type ProbeState =
  | { status: 'idle' | 'loading' | 'error' }
  | { status: 'ready'; value: ProbeValue };

export function createProbeSession(
  reader: ProbeReader,
  publish: (state: ProbeState) => void,
) {
  let generation = 0;
  let unsubscribe: (() => void) | undefined;
  const stop = () => {
    generation++;
    unsubscribe?.();
    unsubscribe = undefined;
  };
  return {
    start() {
      stop();
      const current = generation;
      publish({ status: 'loading' });
      try {
        unsubscribe = reader.watch(
          (value) => {
            if (generation !== current) return;
            try {
              publish({ status: 'ready', value: decodeProbe(value) });
            } catch {
              publish({ status: 'error' });
            }
          },
          () => {
            if (generation === current) publish({ status: 'error' });
          },
        );
      } catch {
        if (generation === current) publish({ status: 'error' });
      }
    },
    stop,
  };
}
