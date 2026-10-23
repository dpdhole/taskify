import { useState } from 'react';
import { useStore } from 'zustand';
import type { createCompatibilityStore } from '../state/compatibility-store';
import type { createProtectedConsumers } from '../application/protected-consumers';
import { CompatibilityView } from './CompatibilityView';
export function CompatibilityHarnessView({
  projection,
  retry,
  change,
  consumer,
}: {
  projection: ReturnType<typeof createCompatibilityStore>;
  retry: () => void;
  change?: (kind: 'ready' | 'blocked' | 'cache' | 'missing') => void;
  consumer: ReturnType<typeof createProtectedConsumers>;
}) {
  const state = useStore(projection.store, (s) => s.state);
  const [draft, setDraft] = useState('');
  const [outcome, setOutcome] = useState('none');
  return (
    <>
      <CompatibilityView
        projection={projection}
        retry={retry}
        reload={() => location.reload()}
        appVersion="0.1.0"
        buildId="test-harness"
      />
      <section aria-label="Synthetic compatibility controls">
        <h2>Compatibility test harness</h2>
        <label>
          Unsaved synthetic input
          <input value={draft} onChange={(e) => setDraft(e.target.value)} />
        </label>
        <button
          disabled={
            state.status !== 'ready' ||
            outcome === 'pending' ||
            outcome === 'unknown'
          }
          onClick={async () => {
            setOutcome('pending');
            setOutcome(await consumer.submit(crypto.randomUUID(), draft));
          }}
        >
          Submit synthetic command
        </button>
        <button
          disabled={state.status !== 'ready' || outcome !== 'unknown'}
          onClick={async () => {
            setOutcome('pending');
            setOutcome(await consumer.reconcile());
          }}
        >
          Check original outcome
        </button>
        <p aria-label="Synthetic command outcome" aria-live="polite">
          {outcome}
        </p>
        {change && (
          <div>
            {(['ready', 'blocked', 'cache', 'missing'] as const).map((kind) => (
              <button key={kind} onClick={() => change(kind)}>
                Simulate {kind}
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
