import { useStore } from 'zustand';
import type { createCompatibilityStore } from '../state/compatibility-store';
import styles from './foundation.module.css';
const messages: Record<string, string> = {
  checking: 'Checking compatibility…',
  ready:
    'Compatibility verified. This build is ready for further feature development.',
  'client-too-old': 'A newer Taskify client is required. Reload to update.',
  'client-ahead':
    'This client is ahead of the available release. Please retry later.',
  'unreadable-data':
    'This build cannot read all supported data formats. Update Taskify or contact the operator.',
  'writer-prohibited':
    'This build cannot use the current write policy. Update Taskify or contact the operator.',
  'configuration-error':
    'Compatibility configuration is missing or invalid. Please retry or contact the operator.',
  'verification-unavailable':
    'Server verification is unavailable. Your input is preserved; please retry.',
};
export function CompatibilityView({
  projection,
  retry,
  reload,
  appVersion,
  buildId,
  embedded = false,
}: {
  projection: ReturnType<typeof createCompatibilityStore>;
  retry: () => void;
  reload: () => void;
  appVersion: string;
  buildId: string;
  embedded?: boolean;
}) {
  const state = useStore(projection.store, (s) => s.state);
  const Container = embedded ? 'section' : 'main';
  return (
    <Container className={embedded ? undefined : styles.panel}>
      {embedded ? <h2>Compatibility</h2> : <h1>Taskify</h1>}
      <p role="status" aria-live="polite">
        {messages[state.reason] ??
          messages[state.status] ??
          messages['configuration-error']}
      </p>
      {state.status !== 'ready' && state.status !== 'checking' && (
        <div className={styles.actions}>
          {state.reason === 'client-too-old' ? (
            <button onClick={reload}>Reload Taskify</button>
          ) : (
            <button onClick={retry}>Retry compatibility check</button>
          )}
        </div>
      )}
      {!embedded && <p>Sign-in and Tasks are not available in this build.</p>}
      <small>
        App {appVersion} · build {buildId} · {state.status}
        {state.revision !== null ? ` · contract ${state.revision}` : ''}
      </small>
    </Container>
  );
}
