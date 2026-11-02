import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import type { createSignInMethodsStore } from '../state/sign-in-methods-store';
import type {
  SessionIdentity,
  SignInProvider,
} from '../application/session-controller';
import styles from './session.module.css';
export interface SignInMethodsPresentation {
  projection: ReturnType<typeof createSignInMethodsStore>;
  open: () => void;
  close: () => void;
  refresh: () => void;
  verify?: (provider: SignInProvider, transport?: 'redirect') => void;
  cancelVerification?: () => void;
}
export function SignInMethodsView({
  methods,
  identity,
  ready,
}: {
  methods: SignInMethodsPresentation;
  identity: SessionIdentity | null;
  ready: boolean;
}) {
  const state = useStore(methods.projection.store, (s) => s.state);
  const heading = useRef<HTMLHeadingElement>(null);
  const entry = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const needsEntryFocus = useRef(false);
  const wasVerifying = useRef(false);
  const verificationButtons = useRef<
    Record<SignInProvider, HTMLButtonElement | null>
  >({ google: null, microsoft: null });
  const isOpen = state.status !== 'closed';
  useEffect(() => {
    if (isOpen && !wasOpen.current) heading.current?.focus();
    if (!isOpen && wasOpen.current) needsEntryFocus.current = true;
    if (
      !isOpen &&
      needsEntryFocus.current &&
      ready &&
      !state.verificationPending
    ) {
      if (document.activeElement === document.body) entry.current?.focus();
      needsEntryFocus.current = false;
    }
    wasOpen.current = isOpen;
  }, [isOpen, ready, state.verificationPending]);
  useEffect(() => {
    if (state.verificationPending) {
      wasVerifying.current = true;
      return;
    }
    if (
      wasVerifying.current &&
      isOpen &&
      ready &&
      state.proof &&
      document.activeElement === document.body
    )
      verificationButtons.current[state.proof.provider]?.focus();
    wasVerifying.current = false;
  }, [state.verificationPending, state.proof, isOpen, ready]);
  if (!isOpen)
    return ready ? (
      <>
        <section aria-label="Authenticated account" className={styles.account}>
          <p>{identity?.displayName || 'Signed in'}</p>
          <p>Your workspace is not available yet.</p>
        </section>
        <div className={styles.actions}>
          <button
            ref={entry}
            disabled={state.verificationPending}
            onClick={methods.open}
          >
            Sign-in methods
          </button>
        </div>
        {state.verificationPending && (
          <p role="status">
            Finishing verification cancellation. Close the provider window to
            continue.
          </p>
        )}
      </>
    ) : null;
  return (
    <section
      aria-labelledby="sign-in-methods-heading"
      className={styles.methods}
    >
      <h3 id="sign-in-methods-heading" ref={heading} tabIndex={-1}>
        Sign-in methods
      </h3>
      <p>Check which methods can access this Taskify account.</p>
      <p role="status" aria-live="polite">
        {state.status === 'checking'
          ? 'Checking sign-in methods…'
          : state.status === 'ready'
            ? 'Sign-in methods verified.'
            : state.reason === 'compatibility'
              ? 'Compatibility verification is required before checking sign-in methods.'
              : 'Sign-in methods could not be verified. Please retry.'}
      </p>
      <ul
        className={styles.methodList}
        aria-label="Supported sign-in providers"
      >
        {(['google', 'microsoft'] as const).map((provider) => (
          <li key={provider}>
            <strong>{provider === 'google' ? 'Google' : 'Microsoft'}</strong>
            <span>
              {state.status === 'ready'
                ? state.providers.includes(provider)
                  ? 'Linked'
                  : 'Not linked'
                : state.status === 'checking'
                  ? 'Checking…'
                  : 'Status unavailable'}
            </span>
          </li>
        ))}
      </ul>
      {state.status === 'ready' && methods.verify && (
        <section aria-label="Verify current account">
          <h4>Verify your current account</h4>
          <p>
            Confirm ownership using a linked method. This will not add a sign-in
            method.
          </p>
          <div className={styles.actions}>
            {state.providers.map((provider) => (
              <button
                key={provider}
                ref={(element) => {
                  verificationButtons.current[provider] = element;
                }}
                disabled={!ready || state.verificationPending}
                onClick={() => methods.verify?.(provider)}
              >
                Verify with {provider === 'google' ? 'Google' : 'Microsoft'}
              </button>
            ))}
          </div>
          {state.proof && (
            <p
              role={
                state.proof.status === 'error' &&
                state.proof.reason !== 'cancelled'
                  ? 'alert'
                  : 'status'
              }
              aria-live="polite"
            >
              {state.proof.status === 'verifying'
                ? 'Complete verification in the provider window.'
                : state.proof.status === 'cancelling'
                  ? 'Verification cancelled. Waiting for the provider window to close.'
                  : state.proof.status === 'verified'
                    ? 'Current account verified. No sign-in method was added.'
                    : state.proof.reason === 'wrong-account'
                      ? 'That is a different account. Use the account already linked here.'
                      : state.proof.reason === 'cancelled'
                        ? 'Verification cancelled. Your existing account remains available.'
                        : state.proof.reason === 'popup-blocked'
                          ? 'The verification popup was blocked. Allow popups or verify with redirect.'
                          : state.proof.reason === 'proof-expired'
                            ? 'Verification expired. Start a fresh verification.'
                            : state.proof.reason === 'network'
                              ? 'Verification could not reach the server. Check your connection and retry.'
                              : 'Account verification is unavailable. Please retry.'}
            </p>
          )}
          {state.proof?.status === 'verifying' && (
            <button onClick={methods.cancelVerification}>
              Cancel verification
            </button>
          )}
          {state.proof?.reason === 'popup-blocked' && (
            <button
              disabled={state.verificationPending || !ready}
              onClick={() =>
                methods.verify?.(state.proof!.provider, 'redirect')
              }
            >
              Verify with redirect
            </button>
          )}
        </section>
      )}
      <p>Adding another sign-in method is not available yet.</p>
      <div className={styles.actions}>
        <button onClick={methods.close}>Back</button>
        <button
          disabled={
            !ready || state.status === 'checking' || state.verificationPending
          }
          onClick={methods.refresh}
        >
          {state.status === 'unavailable'
            ? 'Retry checking methods'
            : 'Refresh sign-in methods'}
        </button>
      </div>
    </section>
  );
}
