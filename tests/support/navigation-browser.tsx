import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { createStore } from 'zustand/vanilla';
import { AccountDeletionView } from '../../src/ui/AccountDeletionView';
import { AccountProfile } from '../../src/ui/AccountProfile';
import { NavigationShell } from '../../src/ui/NavigationShell';
import type { AccountDeletionState } from '../../src/application/account-deletion-controller';
import type { NavigationSnapshot } from '../../src/application/navigation-port';
const views = [
  { id: 'focus', name: 'Focus', order: 1000, showOnHome: false },
  { id: 'all-tasks', name: 'All Tasks', order: 2000, showOnHome: true },
  ...Array.from({ length: 24 }, (_, i) => ({
    id: 'view-' + i,
    name: 'Saved View ' + i + ' with a deliberately long contextual title',
    order: 3000 + i,
    showOnHome: true,
  })),
];
const reader = {
  watch(_uid: string, next: (value: NavigationSnapshot) => void) {
    next({ status: 'ready', views });
    const update = (event: Event) =>
      next((event as CustomEvent<NavigationSnapshot>).detail);
    window.addEventListener('navigation-fixture', update);
    return () => window.removeEventListener('navigation-fixture', update);
  },
};
const idleDeletion: AccountDeletionState = {
  status: 'idle',
  uid: 'local-fixture',
  providers: [],
  control: null,
  reason: '',
};
const deletionStore = createStore(() => ({ state: idleDeletion }));
const localDeletion = {
  projection: { store: deletionStore, dispose() {} },
  open: () =>
    deletionStore.setState({
      state: {
        ...idleDeletion,
        status: 'confirming',
        reason:
          'Local preview. Account verification and deletion require a signed-in workspace.',
      },
    }),
  cancel: () => deletionStore.setState({ state: idleDeletion }),
  prove() {},
  submit() {},
  refresh() {},
};
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <NavigationShell
        uid="local-fixture"
        reader={reader}
        account={
          <>
            <AccountProfile
              identity={{
                displayName: 'Local preview account',
                email: 'preview@example.test',
              }}
            />
            <AccountDeletionView
              account="Local preview account"
              deletion={localDeletion}
              ready
            />
          </>
        }
        logout={() =>
          window.dispatchEvent(new Event('navigation-fixture-logout'))
        }
      />
    ),
  },
]);
createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
);
