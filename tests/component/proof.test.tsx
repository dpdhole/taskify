import { it, expect } from 'vitest';
import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { ProofView } from '../../src/ui/ProofView';
import { createMemoryProbe } from '../../src/infrastructure/memory/probe-reader';
import { createProbeSession } from '../../src/application/probe-session';
import { createProbeStore } from '../../src/state/probe-store';
it('renders a subscribed status and retries without leaking under StrictMode', async () => {
  const memory = createMemoryProbe();
  const projection = createProbeStore();
  const session = createProbeSession(memory.reader, projection.publish);
  const model = { ...projection, ...session };
  const view = render(
    <StrictMode>
      <MemoryRouter>
        <ProofView model={model} />
      </MemoryRouter>
    </StrictMode>,
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    'Memory connection verified',
  );
  expect(memory.subscriberCount).toBe(1);
  await userEvent.click(
    screen.getByRole('button', { name: 'Retry connection' }),
  );
  expect(memory.subscriberCount).toBe(1);
  view.unmount();
  expect(memory.subscriberCount).toBe(0);
});
it('presents malformed data as a recoverable error', () => {
  const memory = createMemoryProbe(null);
  const projection = createProbeStore();
  const model = {
    ...projection,
    ...createProbeSession(memory.reader, projection.publish),
  };
  render(
    <MemoryRouter>
      <ProofView model={model} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Connection unavailable');
  expect(
    screen.getByRole('button', { name: 'Retry connection' }),
  ).toBeEnabled();
});
