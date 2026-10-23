import { expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionView } from '../../src/ui/SessionView';
import {
  createSessionController,
  SessionError,
} from '../../src/application/session-controller';
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
  const signIn = vi.fn().mockRejectedValue(new SessionError('popup-blocked'));
  const session = createSessionController(
    {
      signIn,
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
      signIn={(provider, transport) => {
        void session.signIn(provider, transport ?? 'popup');
      }}
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
    signIn,
    async restore(
      identity: SessionIdentity | null = {
        uid: 'first',
        displayName: 'Example User',
      },
    ) {
      await act(async () => {
        next(identity);
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

it('keeps Microsoft redirect fallback tied to the selected provider and offers safe conflict recovery', async () => {
  const t = setup();
  await t.restore(null);
  await userEvent.click(
    screen.getByRole('button', { name: 'Continue with Microsoft' }),
  );
  expect(t.signIn).toHaveBeenLastCalledWith('microsoft', 'popup');
  expect(screen.getByRole('alert')).toHaveTextContent('blocked');
  await userEvent.click(
    screen.getByRole('button', { name: 'Continue with redirect' }),
  );
  expect(t.signIn).toHaveBeenLastCalledWith('microsoft', 'redirect');
  t.signIn.mockRejectedValue(new SessionError('account-conflict'));
  await userEvent.click(
    screen.getByRole('button', { name: 'Continue with Microsoft' }),
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'existing sign-in method',
  );
  expect(
    screen.queryByRole('button', { name: 'Continue with redirect' }),
  ).not.toBeInTheDocument();
  act(() => t.gate.suspend('offline'));
  expect(
    screen.queryByRole('button', { name: 'Continue with Microsoft' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Continue with Google' }),
  ).not.toBeInTheDocument();
  t.dispose();
});

for (const provider of ['Google', 'Microsoft']) {
  it(
    provider +
      ' cancellation does not render Logout while the closed popup promise is pending',
    async () => {
      const t = setup();
      await t.restore(null);
      let reject!: (reason: unknown) => void;
      t.signIn.mockImplementation(
        () =>
          new Promise<void>((_resolve, failure) => {
            reject = failure;
          }),
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Continue with ' + provider }),
      );
      expect(
        screen.getByRole('button', { name: 'Cancel sign-in' }),
      ).toBeVisible();
      await userEvent.click(
        screen.getByRole('button', { name: 'Cancel sign-in' }),
      );
      expect(screen.getByRole('status')).toHaveTextContent('signed out');
      expect(
        screen.queryByRole('button', { name: /^Logout$/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Cancel sign-in' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Continue with ' + provider }),
      ).toBeDisabled();
      await act(async () => {
        reject(new SessionError('cancelled'));
      });
      expect(
        screen.queryByRole('button', { name: /^Logout$/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Continue with ' + provider }),
      ).toBeEnabled();
      t.dispose();
    },
  );
}
