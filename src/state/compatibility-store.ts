import { createStore } from 'zustand/vanilla';
import type { CompatibilityGate } from '../application/compatibility-gate';
export function createCompatibilityStore(gate: CompatibilityGate) {
  const store = createStore(() => ({ state: gate.getState() }));
  const dispose = gate.subscribe((state) => store.setState({ state }));
  return { store, dispose };
}
