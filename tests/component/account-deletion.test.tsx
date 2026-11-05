import { expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore } from 'zustand/vanilla';
import { AccountDeletionView } from '../../src/ui/AccountDeletionView';
import type { AccountDeletionState } from '../../src/application/account-deletion-controller';
function fixture(
  status: AccountDeletionState['status'] = 'confirming',
  ready = true,
) {
  const state: AccountDeletionState = {
    status,
    uid: 'A',
    providers: ['google.com', 'microsoft.com'],
    control: null,
    reason: '',
  };
  const store = createStore(() => ({ state }));
  const deletion = {
    projection: { store, dispose: vi.fn() },
    open: vi.fn(),
    prove: vi.fn(),
    submit: vi.fn(),
    cancel: vi.fn(),
    refresh: vi.fn(),
  };
  const view = render(
    <AccountDeletionView
      deletion={deletion}
      ready={ready}
      account="Current account"
    />,
  );
  return {
    deletion,
    view,
    update: (patch: Partial<AccountDeletionState>) =>
      act(() =>
        store.setState({ state: { ...store.getState().state, ...patch } }),
      ),
  };
}
it('requires exact typed DELETE and exposes popup/redirect choices without sending intent', async () => {
  const f = fixture();
  const verify = screen.getByRole('button', {
    name: 'Verify with Google',
  });
  expect(verify).toBeDisabled();
  await userEvent.type(
    screen.getByLabelText('Type DELETE to confirm permanent loss'),
    'DELETE',
  );
  await userEvent.click(verify);
  expect(f.deletion.prove).toHaveBeenCalledWith(
    'DELETE',
    'google.com',
    'popup',
  );
  await userEvent.click(
    screen.getByRole('button', {
      name: 'Verify with Microsoft using redirect',
    }),
  );
  expect(f.deletion.prove).toHaveBeenCalledWith(
    'DELETE',
    'microsoft.com',
    'redirect',
  );
  expect(f.deletion.submit).not.toHaveBeenCalled();
  expect(
    screen.getByText(/Your Google or Microsoft accounts are unaffected/),
  ).toBeVisible();
});
it('requires a separate final request action after proof', async () => {
  const f = fixture('proof-ready');
  await userEvent.click(
    screen.getByRole('button', { name: 'Request permanent deletion' }),
  );
  expect(f.deletion.submit).toHaveBeenCalledTimes(1);
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(f.deletion.cancel).toHaveBeenCalledTimes(1);
});
it('pending and uncertain states permit status refresh but no cancellation or new proof', async () => {
  const f = fixture('uncertain');
  f.update({
    reason:
      'Intent acknowledgement was not verified. Refresh status or Logout.',
  });
  expect(
    screen.queryByRole('button', { name: 'Cancel' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Request permanent deletion' }),
  ).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Refresh status' }));
  expect(f.deletion.refresh).toHaveBeenCalledTimes(1);
  f.update({ status: 'requested', control: null });
  expect(
    screen.getByText(/status format requires operator support/),
  ).toBeVisible();
});
it('revoked readiness disables the final destructive action', () => {
  fixture('proof-ready', false);
  expect(
    screen.getByRole('button', { name: 'Request permanent deletion' }),
  ).toBeDisabled();
});
it('does not require email to identify the account', () => {
  fixture('idle');
  expect(screen.getByRole('button', { name: 'Delete Account' })).toBeVisible();
});
