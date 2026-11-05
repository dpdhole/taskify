import { useEffect, useId, useRef, useState } from 'react';
import { useStore } from 'zustand';
import type { createAccountDeletionStore } from '../state/account-deletion-store';
import type { DeletionProvider } from '../domain/account-deletion';
import styles from './session.module.css';
export interface AccountDeletionPresentation {
  projection: ReturnType<typeof createAccountDeletionStore>;
  open(): void;
  prove(
    typed: string,
    provider: DeletionProvider,
    transport: 'popup' | 'redirect',
  ): void;
  submit(): void;
  cancel(): void;
  refresh(): void;
}
export function AccountDeletionView({
  deletion,
  ready,
  account,
}: {
  deletion: AccountDeletionPresentation;
  ready: boolean;
  account: string;
}) {
  const state = useStore(deletion.projection.store, (s) => s.state);
  const [typed, setTyped] = useState('');
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (
      [
        'confirming',
        'proof-ready',
        'requested',
        'uncertain',
        'blocked',
      ].includes(state.status) &&
      document.activeElement === document.body
    )
      heading.current?.focus();
  }, [state.status]);
  const busy = ['checking', 'proving', 'submitting'].includes(state.status);
  const locked = ['requested', 'uncertain', 'submitting'].includes(
    state.status,
  );
  const message = state.control?.pauseCode
    ? 'Processing needs operator attention. Your workspace remains blocked.'
    : state.control?.state === 'awaiting_retirement'
      ? 'Account removal verified. Temporary deletion metadata is awaiting safe operator retirement.'
      : state.control?.state === 'cleaning'
        ? 'The operator is removing your application data.'
        : ['data_verified', 'auth_deleting'].includes(
              state.control?.state ?? '',
            )
          ? 'Application cleanup verified. The operator is finalizing account removal.'
          : 'Deletion requested — awaiting operator processing';
  return (
    <section
      aria-label="Delete Account"
      className={styles.deletion}
      aria-busy={busy}
    >
      {state.status === 'idle' ? (
        <button onClick={deletion.open} disabled={!ready}>
          Delete Account
        </button>
      ) : (
        <>
          <h3 ref={heading} tabIndex={-1}>
            Delete Account
          </h3>
          {state.status === 'requested' ? (
            <>
              <p role="status">
                {state.control
                  ? message
                  : 'Account deletion is pending. This status format requires operator support.'}
              </p>
              <p>
                Workspace access is blocked. Logout does not cancel processing.
                Completion depends on operator availability.
              </p>
            </>
          ) : (
            <>
              <p>Current account: {account}</p>
              <p>
                Permanently delete your Taskify account, application data and
                linked Taskify sign-in methods. Your Google or Microsoft
                accounts are unaffected. Data cannot be restored.
              </p>
              <p>
                A service operator must process your request. After requesting
                deletion, cancellation is unavailable. No completion time or
                notification is promised.
              </p>
              {state.status === 'confirming' && (
                <>
                  <label htmlFor={id}>
                    Type DELETE to confirm permanent loss
                  </label>
                  <input
                    id={id}
                    autoComplete="off"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                  />
                  {state.providers.map((provider) => (
                    <div key={provider} className={styles.actions}>
                      <button
                        disabled={!ready || typed !== 'DELETE'}
                        onClick={() => deletion.prove(typed, provider, 'popup')}
                      >
                        Verify with{' '}
                        {provider === 'google.com' ? 'Google' : 'Microsoft'}
                      </button>
                      <button
                        disabled={!ready || typed !== 'DELETE'}
                        onClick={() =>
                          deletion.prove(typed, provider, 'redirect')
                        }
                      >
                        Verify with{' '}
                        {provider === 'google.com' ? 'Google' : 'Microsoft'}{' '}
                        using redirect
                      </button>
                    </div>
                  ))}
                </>
              )}
              {state.status === 'proof-ready' && (
                <button disabled={!ready} onClick={deletion.submit}>
                  Request permanent deletion
                </button>
              )}
              {busy && (
                <p role="status">
                  {state.status === 'proving'
                    ? 'Complete provider verification.'
                    : state.status === 'submitting'
                      ? 'Confirming deletion intent with the service…'
                      : 'Checking account status…'}
                </p>
              )}
            </>
          )}
          {state.reason && (
            <p role={state.status === 'uncertain' ? 'alert' : 'status'}>
              {state.reason}
            </p>
          )}
          <div className={styles.actions}>
            {!locked && (
              <button
                onClick={() => {
                  setTyped('');
                  deletion.cancel();
                }}
              >
                Cancel
              </button>
            )}
            {['requested', 'uncertain', 'blocked'].includes(state.status) && (
              <button disabled={busy} onClick={deletion.refresh}>
                Refresh status
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
