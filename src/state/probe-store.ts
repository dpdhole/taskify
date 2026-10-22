import { createStore } from 'zustand/vanilla';
import type { ProbeState } from '../application/probe-session';
export function createProbeStore() {
  const store = createStore<{ state: ProbeState }>(() => ({
    state: { status: 'idle' },
  }));
  return {
    store,
    publish(state: ProbeState) {
      store.setState({ state });
    },
  };
}
