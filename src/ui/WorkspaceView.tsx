import { useEffect, useId, useRef, useState } from 'react';
import { useStore } from 'zustand';
import type { createWorkspaceStore } from '../state/workspace-store';
import { WORKSPACE_TIMEZONES } from '../domain/workspace-policy';
import styles from './session.module.css';
export interface WorkspacePresentation {
  projection: ReturnType<typeof createWorkspaceStore>;
  retry: () => void;
  selectTimezone: (timezone: string) => void;
  continueWithoutProfile: () => void;
}
export function WorkspaceView({
  workspace,
  ready,
}: {
  workspace: WorkspacePresentation;
  ready: boolean;
}) {
  const state = useStore(workspace.projection.store, (s) => s.state);
  const [timezone, setTimezone] = useState('');
  const timezoneId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (
      [
        'ready',
        'error',
        'timezone-required',
        'profile-invalid',
        'fenced',
      ].includes(state.status) &&
      document.activeElement === document.body
    )
      heading.current?.focus();
  }, [state.status]);
  const disabled = !ready || state.pending;
  if (state.status === 'idle') return null;
  return (
    <section
      aria-label="Workspace setup"
      className={styles.account + ' ' + styles.workspace}
      aria-busy={state.pending}
    >
      {state.status === 'ready' ? (
        <>
          <h3 ref={heading} tabIndex={-1}>
            Workspace ready
          </h3>
          {state.profileName && <p>{state.profileName}</p>}
          <p>
            Your initial settings, categories, locations and saved views are
            ready.
          </p>
          {state.timezone && <p>Timezone: {state.timezone}</p>}
        </>
      ) : state.status === 'fenced' ? (
        <>
          <h3 ref={heading} tabIndex={-1}>
            Account deletion in progress
          </h3>
          <p role="status">
            Workspace access and setup are blocked. Refresh status or Logout.
          </p>
          <button disabled={disabled} onClick={workspace.retry}>
            Refresh deletion status
          </button>
        </>
      ) : state.status === 'timezone-required' ? (
        <>
          <h3 ref={heading} tabIndex={-1}>
            Choose your timezone
          </h3>
          <p>A supported timezone is required to finish setup.</p>
          <label htmlFor={timezoneId}>Timezone</label>
          <select
            id={timezoneId}
            value={timezone}
            disabled={disabled}
            onChange={(event) => setTimezone(event.target.value)}
          >
            <option value="">Select a timezone</option>
            {WORKSPACE_TIMEZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
          <div className={styles.actions}>
            <button
              disabled={disabled || !timezone}
              onClick={() => workspace.selectTimezone(timezone)}
            >
              Continue setup
            </button>
          </div>
        </>
      ) : state.status === 'profile-invalid' ? (
        <>
          <h3 ref={heading} tabIndex={-1}>
            Profile details need attention
          </h3>
          <p>
            The optional social profile details could not be used. Continue
            without these details or check setup status.
          </p>
          <button
            disabled={disabled}
            onClick={workspace.continueWithoutProfile}
          >
            Continue without profile details
          </button>
        </>
      ) : state.status === 'error' ? (
        <>
          <h3 ref={heading} tabIndex={-1}>
            Setup needs checking
          </h3>
          <p role="alert">
            {state.reason === 'inconsistent'
              ? 'Existing workspace data could not be verified. It will not be reset. Retry checking or ask the service owner for help.'
              : state.reason === 'uncertain'
                ? 'The last setup result could not be confirmed. Check server status before continuing.'
                : 'Workspace setup is unavailable. Check your connection and retry.'}
          </p>
        </>
      ) : (
        <>
          <h3 ref={heading} tabIndex={-1}>
            Loading your workspace
          </h3>
          <p role="status" aria-live="polite">
            {state.status === 'waiting'
              ? 'Waiting for verified session, connection and compatibility.'
              : state.phase || 'Checking your workspace'}
          </p>
          <p>
            Please finish initial setup on this device before opening this
            account elsewhere.
          </p>
        </>
      )}
      {['error', 'timezone-required', 'profile-invalid', 'waiting'].includes(
        state.status,
      ) && (
        <div className={styles.actions}>
          <button disabled={disabled} onClick={workspace.retry}>
            Check setup status
          </button>
        </div>
      )}
    </section>
  );
}
