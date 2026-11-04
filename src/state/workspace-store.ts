import { createStore } from 'zustand/vanilla';
import type { WorkspaceController } from '../application/workspace-controller';
export function createWorkspaceStore(controller: WorkspaceController) {
  const store = createStore(() => ({ state: controller.getState() }));
  const dispose = controller.subscribe((state) => store.setState({ state }));
  return { store, dispose };
}
