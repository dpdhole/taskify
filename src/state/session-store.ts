import { createStore } from 'zustand/vanilla';
import type { SessionController } from '../application/session-controller';
export function createSessionStore(session: SessionController) {
  const store = createStore(() => ({ state: session.getState() }));
  const dispose = session.subscribe((state) => store.setState({ state }));
  return { store, dispose };
}
