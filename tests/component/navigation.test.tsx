import { beforeEach, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { useContext } from 'react';
import {
  NavigationShell,
  NavigationGuardContext,
} from '../../src/ui/NavigationShell';
import type { NavigationSnapshot } from '../../src/application/navigation-port';

let wide = true;
let resize: (() => void) | undefined;
beforeEach(() => {
  sessionStorage.clear();
  wide = true;
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return query.includes('960') ? wide : true;
    },
    addEventListener: (_: string, callback: () => void) => {
      resize = callback;
    },
    removeEventListener: () => {},
  }));
});
function setup(path = '/', account = <p>Account controls</p>) {
  let publish!: (state: NavigationSnapshot) => void;
  const stop = vi.fn();
  const watch = vi.fn((_: string, next: typeof publish) => {
    publish = next;
    return stop;
  });
  const logout = vi.fn();
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <NavigationShell
            uid="owner"
            reader={{ watch }}
            account={account}
            logout={logout}
          />
        ),
      },
    ],
    { initialEntries: [path] },
  );
  const result = render(<RouterProvider router={router} />);
  const views = [
    { id: 'renamable', name: 'Focus', order: 1000, showOnHome: false },
    { id: 'all-tasks', name: 'All Tasks', order: 2000, showOnHome: true },
  ];
  act(() => publish({ status: 'ready', views }));
  return { ...result, router, publish, views, stop, watch, logout };
}
it('shares metadata, includes Home-hidden Views in navigation and follows rename/deletion by ID', async () => {
  const user = userEvent.setup();
  const app = setup();
  expect(
    within(screen.getByRole('main')).queryByRole('link', { name: 'Focus' }),
  ).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Open navigation' }));
  await user.click(
    within(screen.getByRole('navigation')).getByRole('link', { name: 'Focus' }),
  );
  expect(app.router.state.location.pathname).toBe('/views/renamable');
  act(() =>
    app.publish({
      status: 'ready',
      views: app.views.map((v) =>
        v.id === 'renamable' ? { ...v, name: 'Renamed' } : v,
      ),
    }),
  );
  expect(screen.getByRole('heading', { name: 'Renamed' })).toBeInTheDocument();
  expect(app.watch).toHaveBeenCalledTimes(1);
  act(() =>
    app.publish({
      status: 'ready',
      views: app.views.filter((v) => v.id !== 'renamable'),
    }),
  );
  expect(
    screen.getByRole('heading', { name: 'View unavailable' }),
  ).toBeInTheDocument();
  expect(app.router.state.location.pathname).toBe('/views/renamable');
  app.unmount();
  expect(app.stop).toHaveBeenCalledOnce();
  act(() => app.publish({ status: 'ready', views: app.views }));
});
it('traps mobile focus, closes on Escape, restores opener and clears body lock', async () => {
  wide = false;
  const user = userEvent.setup();
  setup();
  const opener = screen.getByRole('button', { name: 'Open navigation' });
  await user.click(opener);
  const dialog = screen.getByRole('dialog');
  expect(document.body.style.overflow).toBe('hidden');
  expect(
    screen.getByRole('button', { name: 'Close navigation' }),
  ).toHaveFocus();
  await user.tab({ shift: true });
  expect(
    within(dialog).getByRole('button', { name: 'Settings' }),
  ).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.body.style.overflow).toBe('');
  expect(opener).toHaveFocus();
});
it('keeps a blocked destination in the drawer and routes allowed changes through the same guard', async () => {
  function Guard() {
    const register = useContext(NavigationGuardContext);
    return (
      <button onClick={() => register(() => false)}>Protect editor</button>
    );
  }
  wide = false;
  const user = userEvent.setup();
  const app = setup('/settings/account', <Guard />);
  await user.click(screen.getByRole('button', { name: 'Protect editor' }));
  await act(() => app.router.navigate('/'));
  expect(app.router.state.location.pathname).toBe('/settings/account');
  expect(
    screen.getByRole('heading', { name: 'My Account' }),
  ).toBeInTheDocument();
});
it('preserves desktop retention across mobile resizing and clears it on Logout', async () => {
  const user = userEvent.setup();
  const app = setup();
  await user.click(screen.getByRole('button', { name: 'Open navigation' }));
  expect(sessionStorage.getItem('taskify.navigation.owner')).toBe('expanded');
  wide = false;
  act(() => resize?.());
  await user.click(screen.getByRole('button', { name: 'Open navigation' }));
  wide = true;
  act(() => resize?.());
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Collapse navigation' }),
  ).toHaveAttribute('aria-expanded', 'true');
  expect(screen.queryByRole('button', { name: 'Logout' })).toBeNull();
  await user.click(screen.getByRole('link', { name: 'My Account' }));
  await user.click(screen.getByRole('button', { name: 'Logout' }));
  expect(sessionStorage.getItem('taskify.navigation.owner')).toBeNull();
  expect(app.logout).toHaveBeenCalledOnce();
});
it('keeps account recovery reachable when metadata is invalid, with direct-link Home fallback', async () => {
  const app = setup('/settings/account');
  act(() => app.publish({ status: 'error', views: [] }));
  expect(screen.getByText('Account controls')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  await act(() => app.router.navigate('/unknown'));
  expect(
    screen.getByRole('heading', { name: 'Page unavailable' }),
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(document.title).toBe('Page unavailable · Taskify'),
  );
});
