import { expect, it } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionView } from '../../src/ui/SessionView';
import { createSessionController } from '../../src/application/session-controller';
import type { SessionIdentity } from '../../src/application/session-controller';
import { createSessionStore } from '../../src/state/session-store';
import { createCompatibilityStore } from '../../src/state/compatibility-store';
import { createCompatibilityGate } from '../../src/application/compatibility-gate';
import { capabilities, contract } from '../support/compatibility-fixtures';
function setup(failedLogout = false) {
  let next!: (identity: SessionIdentity | null) => void;
  let initialize!: () => void;
  const clock = {
    schedule() {
      return () => {};
    },
  };
  const gate = createCompatibilityGate(
    {
      readServer: async () => contract(),
      watch(next) {
        next(contract(), true);
        return () => {};
      },
    },
    capabilities,
    clock,
  );
  gate.start();
  const session = createSessionController(
    {
      initialize: () =>
        new Promise<void>((resolve) => {
          initialize = resolve;
        }),
      observe(n) {
        next = n;
        return () => {};
      },
      signOut: async () => {
        if (failedLogout) throw Error('failure');
        next(null);
      },
      dispose() {},
    },
    gate,
    clock,
    () => {},
  );
  const projection = createSessionStore(session),
    compatibility = createCompatibilityStore(gate);
  session.start();
  render(
    <SessionView
      projection={projection}
      compatibility={compatibility}
      retrySession={() => session.retry()}
      logout={() => {
        void session.signOut();
      }}
      retryCompatibility={() => gate.recheck()}
      reload={() => {}}
      appVersion="0.1.0"
      buildId="test-build"
    />,
  );
  return {
    gate,
    session,
    async restore() {
      await act(async () => {
        next({ uid: 'first', displayName: 'Example User' });
        initialize();
      });
    },
    dispose() {
      projection.dispose();
      compatibility.dispose();
      session.dispose();
      gate.dispose();
    },
  };
}
it('shows restoration without flashing signed-out UI, then a minimal account and Logout', async () => {
  const t = setup();
  expect(screen.getByRole('status')).toHaveTextContent('Restoring');
  expect(screen.queryByText('You are signed out.')).not.toBeInTheDocument();
  await t.restore();
  expect(
    screen.getByRole('region', { name: 'Authenticated account' }),
  ).toHaveTextContent('Example User');
  await userEvent.click(screen.getByRole('button', { name: /^Logout$/ }));
  expect(
    screen.queryByRole('region', { name: 'Authenticated account' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('signed out');
  t.dispose();
});
it('keeps Logout accessible while compatibility is blocked and hides protected content', async () => {
  const t = setup();
  await t.restore();
  act(() => t.gate.suspend('offline'));
  expect(
    screen.queryByRole('region', { name: 'Authenticated account' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^Logout$/ })).toBeEnabled();
  expect(
    screen.getByRole('button', { name: 'Retry compatibility check' }),
  ).toBeEnabled();
  t.dispose();
});
it('does not restore account presentation after failed Logout and offers an explicit retry', async () => {
  const t = setup(true);
  await t.restore();
  await userEvent.click(screen.getByRole('button', { name: /^Logout$/ }));
  expect(screen.getByRole('status')).toHaveTextContent(
    'Logout has not been confirmed',
  );
  expect(screen.getByRole('button', { name: 'Retry Logout' })).toBeEnabled();
  expect(screen.queryByText('Example User')).not.toBeInTheDocument();
  t.dispose();
});
