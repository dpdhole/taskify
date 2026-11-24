import { expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { createStore } from 'zustand/vanilla';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { SessionView } from '../../src/ui/SessionView';
import type { SessionState } from '../../src/application/session-controller';
import type { WorkspaceState } from '../../src/application/workspace-controller';
import type { AccountDeletionState } from '../../src/application/account-deletion-controller';
import type { GateState } from '../../src/application/compatibility-gate';
import type { NavigationSnapshot } from '../../src/application/navigation-port';
function projection<T>(state: T) {
  return { store: createStore(() => ({ state })), dispose: vi.fn() };
}
it('admits only ready accounts, disposes on deletion/access loss and rejects old-account callbacks', () => {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const session = projection<SessionState>({
    status: 'signed-in',
    identity: { uid: 'A' },
    generation: 1,
    reason: 'none',
    protectedReady: true,
    canLogout: true,
    canSignIn: false,
    provider: null,
  });
  const workspace = projection<WorkspaceState>({
    status: 'checking',
    phase: '',
    reason: null,
    pending: false,
    profileName: null,
    timezone: null,
  });
  const deletion = projection<AccountDeletionState>({
    status: 'idle',
    uid: 'A',
    providers: [],
    control: null,
    reason: '',
  });
  const gate = projection<GateState>({
    status: 'ready',
    generation: 1,
    revision: 3,
    reason: '',
  });
  const stop = vi.fn();
  const callbacks: ((value: NavigationSnapshot) => void)[] = [];
  const watch = vi.fn(
    (_: string, next: (value: NavigationSnapshot) => void) => {
      callbacks.push(next);
      return stop;
    },
  );
  const router = createMemoryRouter([
    {
      path: '*',
      element: (
        <SessionView
          projection={session}
          compatibility={gate}
          workspace={{
            projection: workspace,
            retry: vi.fn(),
            selectTimezone: vi.fn(),
            continueWithoutProfile: vi.fn(),
          }}
          deletion={{
            projection: deletion,
            open: vi.fn(),
            prove: vi.fn(),
            submit: vi.fn(),
            cancel: vi.fn(),
            refresh: vi.fn(),
          }}
          navigation={{ watch }}
          logout={vi.fn()}
          retrySession={vi.fn()}
          retryCompatibility={vi.fn()}
          reload={vi.fn()}
          appVersion="0.3.0"
          buildId="local-test"
        />
      ),
    },
  ]);
  render(<RouterProvider router={router} />);
  expect(watch).not.toHaveBeenCalled();
  act(() =>
    workspace.store.setState({
      state: { ...workspace.store.getState().state, status: 'ready' },
    }),
  );
  expect(watch).toHaveBeenLastCalledWith('A', expect.any(Function));
  act(() =>
    deletion.store.setState({
      state: { ...deletion.store.getState().state, status: 'requested' },
    }),
  );
  expect(stop).toHaveBeenCalledOnce();
  expect(screen.queryByRole('navigation')).toBeNull();
  expect(screen.getByText(/Workspace access is blocked/)).toBeInTheDocument();
  act(() =>
    deletion.store.setState({
      state: { ...deletion.store.getState().state, status: 'idle' },
    }),
  );
  act(() =>
    session.store.setState({
      state: {
        ...session.store.getState().state,
        identity: { uid: 'B' },
        generation: 2,
      },
    }),
  );
  expect(watch).toHaveBeenLastCalledWith('B', expect.any(Function));
  act(() =>
    callbacks[0]!({
      status: 'ready',
      views: [
        { id: 'secret', name: 'Old account name', order: 1, showOnHome: true },
      ],
    }),
  );
  expect(screen.queryByText('Old account name')).toBeNull();
  act(() =>
    session.store.setState({
      state: { ...session.store.getState().state, protectedReady: false },
    }),
  );
  expect(screen.queryByRole('navigation')).toBeNull();
  expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
});
