import type { SignInProvider } from '../application/session-controller';
import { useStore } from 'zustand';
import type { createSessionStore } from '../state/session-store';
import type { createCompatibilityStore } from '../state/compatibility-store';
import { CompatibilityView } from './CompatibilityView';
import styles from './foundation.module.css';
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
}) {
  const state = useStore(projection.store, (s) => s.state);
  const gate = useStore(compatibility.store, (s) => s.state);
  const providerName = state.provider === 'microsoft' ? 'Microsoft' : 'Google';
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
              ? 'You are signed out.'
              : state.protectedReady
                ? 'Your session and compatibility are verified.'
                : 'Your identity is restored. Compatibility verification is required.';
  return (
    <main className={styles.panel}>
      <h1>Taskify</h1>
      <p role="status" aria-live="polite">
        {message}
      </p>
      {state.protectedReady && (
        <section aria-label="Authenticated account">
          <p>{state.identity?.displayName || 'Signed in'}</p>
          <p>Your workspace is not available yet.</p>
        </section>
      )}
      {state.status === 'signed-out' && gate.status === 'ready' && (
        <div className={styles.actions}>
          <button
            disabled={!state.canSignIn || !signIn}
            onClick={() => signIn?.('google')}
          >
            Continue with Google
          </button>
          <button
            disabled={!state.canSignIn || !signIn}
            onClick={() => signIn?.('microsoft')}
          >
            Continue with Microsoft
          </button>
          {state.reason !== 'none' && (
            <p role="alert">
              {state.reason === 'cancelled'
                ? 'Sign-in was cancelled. You can try again.'
                : state.reason === 'popup-blocked'
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
              onClick={() => signIn?.(state.provider ?? 'google', 'redirect')}
            >
              Continue with redirect
            </button>
          )}
        </div>
      )}
      <div className={styles.actions}>
        {state.status === 'error' && !logoutRecovery && (
          <button onClick={retrySession}>Retry session restoration</button>
        )}
        {state.canLogout && (
          <button onClick={logout}>
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
      <small>
        App {appVersion} · build {buildId} · session {state.status}
      </small>
    </main>
  );
}
