import { createStore } from 'zustand/vanilla';
import type { SignInMethodsController } from '../application/sign-in-methods-controller';
export function createSignInMethodsStore(controller: SignInMethodsController) {
  const store = createStore(() => ({ state: controller.getState() }));
  const dispose = controller.subscribe((state) => store.setState({ state }));
  return { store, dispose };
}
