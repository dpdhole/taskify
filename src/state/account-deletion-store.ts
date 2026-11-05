import { createStore } from 'zustand/vanilla';
import type { AccountDeletionController } from '../application/account-deletion-controller';
export function createAccountDeletionStore(
  controller: AccountDeletionController,
) {
  const store = createStore(() => ({ state: controller.getState() }));
  const dispose = controller.subscribe((state) => store.setState({ state }));
  return { store, dispose };
}
