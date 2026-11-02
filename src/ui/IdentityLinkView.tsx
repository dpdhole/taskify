import { useEffect, useRef } from 'react';
import type { IdentityLinkState } from '../application/identity-link-controller';
import type { SignInProvider } from '../application/session-controller';
import styles from './session.module.css';
export interface IdentityLinkActions {
  requestLink?: (target: SignInProvider) => void;
  proveLink?: (existing: SignInProvider, transport?: 'redirect') => void;
  submitLink?: () => void;
  checkLink?: () => void;
  cancelLink?: () => void;
}
const name = (p: SignInProvider | null) =>
  p === 'microsoft' ? 'Microsoft' : 'Google';
export function IdentityLinkView({
  state,
  providers,
  ready,
  actions,
}: {
  state: IdentityLinkState;
  providers: readonly SignInProvider[];
  ready: boolean;
  actions: IdentityLinkActions;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (document.activeElement === document.body) heading.current?.focus();
  }, [state.stage]);
  if (state.stage === 'idle' || !state.target) return null;
  const target = name(state.target);
  const error =
    state.reason === 'link-conflict'
      ? 'That identity belongs to another Taskify account. The accounts remain separate.'
      : state.reason === 'wrong-account'
        ? 'Use the account already linked to this Taskify account for verification.'
        : state.reason === 'proof-expired'
          ? 'Verification expired. Start again with fresh verification.'
          : state.reason === 'popup-blocked'
            ? 'The provider popup was blocked. Allow popups or start again using redirect verification.'
            : state.reason === 'compatibility'
              ? 'Compatibility verification is required before continuing.'
              : state.reason === 'cancelled'
                ? 'Verification was cancelled. Your existing account remains available.'
                : state.reason === 'network'
                  ? 'The server could not be reached. Check your connection.'
                  : 'The operation could not be verified. Please retry safely.';
  return (
    <section aria-label={'Link ' + target} className={styles.methods}>
      <h4 ref={heading} tabIndex={-1}>
        Link {target}
      </h4>
      {state.stage === 'confirming' && (
        <>
          <p>
            This will let the {target} identity you choose access this Taskify
            account. First verify ownership through an existing linked method.
          </p>
          {providers
            .filter((p) => p !== state.target)
            .map((p) => (
              <div className={styles.actions} key={p}>
                <button
                  disabled={!ready || state.pending}
                  onClick={() => actions.proveLink?.(p)}
                >
                  Verify with {name(p)}
                </button>
                <button
                  disabled={!ready || state.pending}
                  onClick={() => actions.proveLink?.(p, 'redirect')}
                >
                  Verify with {name(p)} using redirect
                </button>
              </div>
            ))}
        </>
      )}
      <p
        role={
          state.stage === 'error' || state.stage === 'uncertain'
            ? 'alert'
            : 'status'
        }
        aria-live="polite"
      >
        {state.stage === 'proving'
          ? 'Verify your existing account in the provider window.'
          : state.stage === 'ready-to-link'
            ? `Your current account is verified. Continue with ${target} to add that identity.`
            : state.stage === 'linking'
              ? `Complete ${target} in the provider window. Once started, cancellation cannot promise to undo linking.`
              : state.stage === 'checking'
                ? 'Checking sign-in methods to confirm the linking outcome…'
                : state.stage === 'cancelling'
                  ? 'Cancellation requested. Close the provider window; its linking outcome will be checked.'
                  : state.stage === 'linked'
                    ? `${target} is linked to this Taskify account.`
                    : state.stage === 'unchanged'
                      ? `${target} is not linked in the latest server check. Your existing methods remain available.`
                      : state.stage === 'uncertain'
                        ? 'Linking may have completed. Check its status before starting another attempt.'
                        : state.stage === 'error'
                          ? error
                          : ''}
      </p>
      {state.stage === 'unchanged' && state.reason !== 'none' && (
        <p role="alert">{error}</p>
      )}
      <div className={styles.actions}>
        {state.stage === 'ready-to-link' && (
          <button
            disabled={!ready || state.pending}
            onClick={actions.submitLink}
          >
            Continue with {target}
          </button>
        )}
        {state.stage === 'uncertain' && (
          <button
            disabled={!ready || state.pending}
            onClick={actions.checkLink}
          >
            Check link status
          </button>
        )}
        {(state.stage === 'error' || state.stage === 'unchanged') &&
          !providers.includes(state.target) && (
            <button
              disabled={!ready || state.pending}
              onClick={() => actions.requestLink?.(state.target!)}
            >
              Start again with fresh verification
            </button>
          )}
        <button
          disabled={state.stage === 'cancelling'}
          onClick={actions.cancelLink}
        >
          {state.stage === 'linked'
            ? 'Done'
            : state.stage === 'linking'
              ? 'Cancel and check status'
              : 'Cancel linking'}
        </button>
      </div>
    </section>
  );
}
