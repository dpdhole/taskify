import { afterEach, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { createCompatibilityGate } from '../../src/application/compatibility-gate';
import { createCompatibilityStore } from '../../src/state/compatibility-store';
import { CompatibilityView } from '../../src/ui/CompatibilityView';
import { CompatibilityHarnessView } from '../../src/ui/CompatibilityHarnessView';
import { createProtectedConsumers } from '../../src/application/protected-consumers';
import { capabilities, contract } from '../support/compatibility-fixtures';
afterEach(cleanup);
function model() {
  let next!: (v: unknown, a: boolean) => void;
  const gate = createCompatibilityGate(
    {
      readServer: () => new Promise(() => {}),
      watch(fn) {
        next = fn;
        return () => {};
      },
    },
    capabilities,
    { schedule: () => () => {} },
  );
  gate.start();
  const projection = createCompatibilityStore(gate);
  return { gate, projection, emit: (v: unknown) => next(v, true) };
}
it('renders distinct accessible blocking states and explicit retry/update actions', () => {
  const m = model();
  const retry = vi.fn(),
    reload = vi.fn();
  const props = {
    projection: m.projection,
    retry,
    reload,
    appVersion: '0.1.0',
    buildId: 'test',
  };
  render(<CompatibilityView {...props} />);
  expect(screen.getByRole('status')).toHaveTextContent('Checking');
  fireEvent.click(document.body);
  m.emit(null);
  cleanup();
  render(<CompatibilityView {...props} />);
  expect(screen.getByRole('status')).toHaveTextContent('missing or invalid');
  fireEvent.click(
    screen.getByRole('button', { name: 'Retry compatibility check' }),
  );
  expect(retry).toHaveBeenCalledOnce();
  m.emit(contract({ minAppVersion: '0.2.0', maxAppVersion: '0.2.0' }));
  cleanup();
  render(<CompatibilityView {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Reload Taskify' }));
  expect(reload).toHaveBeenCalledOnce();
  m.gate.dispose();
  m.projection.dispose();
});
it('preserves draft across gate changes and blocks synthetic submission while closed', () => {
  const m = model();
  const submit = vi.fn(async () => 'confirmed' as const);
  const consumer = createProtectedConsumers(
    m.gate,
    { load: async () => '', submit, reconcile: async () => 'confirmed' },
    () => {},
  );
  render(
    <CompatibilityHarnessView
      projection={m.projection}
      retry={() => {}}
      consumer={consumer}
      change={(kind) =>
        m.emit(kind === 'ready' ? contract({ revision: 2 }) : null)
      }
    />,
  );
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'unsaved draft' },
  });
  expect(
    screen.getByRole('button', { name: 'Submit synthetic command' }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Simulate ready' }));
  expect(
    screen.getByRole('button', { name: 'Submit synthetic command' }),
  ).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Simulate missing' }));
  expect(screen.getByRole('textbox')).toHaveValue('unsaved draft');
  expect(
    screen.getByRole('button', { name: 'Submit synthetic command' }),
  ).toBeDisabled();
  expect(submit).not.toHaveBeenCalled();
  consumer.dispose();
  m.gate.dispose();
  m.projection.dispose();
});
