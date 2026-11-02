import type { SignInProvider } from '../application/session-controller';
import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import type { createSessionStore } from '../state/session-store';
import type { createCompatibilityStore } from '../state/compatibility-store';
import { CompatibilityView } from './CompatibilityView';
import styles from './session.module.css';
import { SignInMethodsView } from './SignInMethodsView';
import type { SignInMethodsPresentation } from './SignInMethodsView';
export function SessionView({
  projection,
  compatibility,
  retrySession,
  logout,
  signIn,
  retryCompatibility,
  reload,
  appVersion,
  buildId,
  methods,
}: {
  projection: ReturnType<typeof createSessionStore>;
  compatibility: ReturnType<typeof createCompatibilityStore>;
  retrySession: () => void;
  logout: () => void;
  signIn?: (provider: SignInProvider, transport?: 'redirect') => void;
  retryCompatibility: () => void;
  reload: () => void;
  appVersion: string;
  buildId: string;
  methods?: SignInMethodsPresentation | undefined;
}) {
  const state = useStore(projection.store, (s) => s.state);
  const gate = useStore(compatibility.store, (s) => s.state);
  const providerName = state.provider === 'microsoft' ? 'Microsoft' : 'Google';
  const googleButton = useRef<HTMLButtonElement>(null);
  const microsoftButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  useEffect(() => {
    if (
      !returnFocus.current ||
      state.status !== 'signed-out' ||
      !state.canSignIn
    )
      return;
    // Do not steal focus if the user has moved to a recovery or diagnostics control.
    if (document.activeElement === document.body) {
      (state.provider === 'microsoft'
        ? microsoftButton
        : googleButton
      ).current?.focus();
    }
    returnFocus.current = false;
  }, [state.status, state.canSignIn, state.provider]);
  function beginSignIn(provider: SignInProvider, transport?: 'redirect') {
    returnFocus.current = true;
    signIn?.(provider, transport);
  }
  const logoutRecovery =
    state.reason === 'logout' || state.reason === 'logout-timeout';
  const message =
    state.status === 'restoring'
      ? 'Restoring your session…'
      : state.status === 'signing-in'
        ? `Complete ${providerName} sign-in in the provider window.`
        : state.status === 'signing-out'
          ? 'Signing out…'
          : state.status === 'error'
            ? state.reason === 'persistence'
              ? 'Remembered sessions are unavailable. Check browser storage settings and retry.'
              : state.reason === 'configuration'
                ? 'Authentication configuration is missing or invalid.'
                : logoutRecovery
                  ? 'Logout has not been confirmed. Protected content remains hidden; retry Logout.'
                  : 'Session restoration is unavailable. Please retry.'
            : state.status === 'signed-out'
              ? state.reason === 'cancelled'
                ? 'Sign-in was cancelled. You are signed out.'
                : 'You are signed out.'
              : state.protectedReady
                ? 'Your session and compatibility are verified.'
                : 'Your identity is restored. Compatibility verification is required.';
  return (
    <main className={styles.shell}>
      <header className={styles.hero}>
        <div className={styles.brand}>
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 40 40"
            className={styles.mark}
          >
            <rect width="40" height="40" rx="12" fill="currentColor" />
            <path
              d="m11 21 6 6 13-14"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1>Taskify</h1>
          <span className={styles.badge}>Preview</span>
        </div>
        <p className={styles.tagline}>A little clarity for your day.</p>
        <p className={styles.intro}>
          A place to organize what matters, one task at a time.
        </p>
      </header>
      <section className={styles.card} aria-labelledby="session-heading">
        <h2 id="session-heading">
          {state.protectedReady ? 'You’re signed in' : 'Welcome to Taskify'}
        </h2>
        <p role="status" aria-live="polite" className={styles.status}>
          {message}
        </p>
        {state.status === 'signed-in' && methods && (
          <SignInMethodsView
            methods={methods}
            identity={state.identity}
            ready={state.protectedReady}
          />
        )}
        {state.protectedReady && !methods && (
          <section
            aria-label="Authenticated account"
            className={styles.account}
          >
            <p>{state.identity?.displayName || 'Signed in'}</p>
            <p>Your workspace is not available yet.</p>
          </section>
        )}
        {state.status === 'signed-out' && gate.status === 'ready' && (
          <div className={styles.providers}>
            <p className={styles.choice}>Choose your account to continue.</p>
            <button
              disabled={!state.canSignIn || !signIn}
              ref={googleButton}
              className={styles.providerButton}
              onClick={() => beginSignIn('google')}
            >
              Continue with Google
            </button>
            <button
              disabled={!state.canSignIn || !signIn}
              ref={microsoftButton}
              className={styles.providerButton}
              onClick={() => beginSignIn('microsoft')}
            >
              Continue with Microsoft
            </button>
            {state.reason !== 'none' && state.reason !== 'cancelled' && (
              <p role="alert" className={styles.alert}>
                {state.reason === 'popup-blocked'
                  ? 'The sign-in popup was blocked. Allow popups or continue with redirect.'
                  : state.reason === 'account-conflict'
                    ? 'Use your existing sign-in method. Account linking will be available separately.'
                    : state.reason === 'provider-configuration'
                      ? `${providerName} sign-in configuration needs attention.`
                      : state.reason === 'network'
                        ? `Unable to reach ${providerName} sign-in. Check your connection and retry.`
                        : `${providerName} sign-in is unavailable. Please retry.`}
              </p>
            )}
            {state.reason === 'popup-blocked' && (
              <button
                disabled={!state.canSignIn}
                className={styles.providerButton}
                onClick={() =>
                  beginSignIn(state.provider ?? 'google', 'redirect')
                }
              >
                Continue with redirect
              </button>
            )}
            <p className={styles.remember}>
              Your session is remembered on this browser. Use Logout when you’re
              done.
            </p>
          </div>
        )}
        <div className={styles.actions}>
          {state.status === 'error' && !logoutRecovery && (
            <button onClick={retrySession}>Retry session restoration</button>
          )}
          {state.canLogout && (
            <button
              onClick={() => {
                returnFocus.current = true;
                logout();
              }}
            >
              {logoutRecovery
                ? 'Retry Logout'
                : state.status === 'signing-in'
                  ? 'Cancel sign-in'
                  : 'Logout'}
            </button>
          )}
        </div>
        {gate.status !== 'ready' && (
          <CompatibilityView
            projection={compatibility}
            retry={retryCompatibility}
            reload={reload}
            appVersion={appVersion}
            buildId={buildId}
            embedded
          />
        )}
      </section>
      <footer className={styles.footer}>
        <details className={styles.diagnostics}>
          <summary>Technical details</summary>
          <small>
            App {appVersion} · build {buildId} · session {state.status}
          </small>
        </details>
      </footer>
    </main>
  );
}
