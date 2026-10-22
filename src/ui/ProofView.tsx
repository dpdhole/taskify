import { useEffect } from 'react';
import { useStore } from 'zustand';
import { Link, useLocation } from 'react-router';
import type { createProbeStore } from '../state/probe-store';
import styles from './foundation.module.css';
export type ProofModel = ReturnType<typeof createProbeStore> & {
  start(): void;
  stop(): void;
  advance?: () => void;
};
export function ProofView({ model }: { model: ProofModel }) {
  const state = useStore(model.store, (s) => s.state);
  const location = useLocation();
  useEffect(() => {
    model.start();
    return model.stop;
  }, [model]);
  return (
    <main className={styles.panel}>
      <p className={styles.eyebrow}>Development proof · synthetic data</p>
      <h1>Taskify Foundation</h1>
      <p>
        This checks application boundaries. It does not create or edit Tasks.
      </p>
      <p
        role={state.status === 'error' ? 'alert' : 'status'}
        aria-live="polite"
      >
        {state.status === 'ready'
          ? state.value.message + ' · revision ' + state.value.revision
          : state.status === 'error'
            ? 'Connection unavailable. Retry or check the local emulator.'
            : 'Connecting…'}
      </p>
      <div className={styles.actions}>
        <button onClick={model.start}>Retry connection</button>
        {model.advance && (
          <button onClick={model.advance}>Update synthetic value</button>
        )}
        <Link to={location.pathname === '/inspect' ? '/' : '/inspect'}>
          {location.pathname === '/inspect'
            ? 'Return to proof'
            : 'Inspect navigation'}
        </Link>
      </div>
      <p>
        Source:{' '}
        {new URLSearchParams(location.search).get('source') === 'emulator'
          ? 'loopback emulator'
          : 'memory adapter'}
      </p>
    </main>
  );
}
