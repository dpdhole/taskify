import type { CompatibilityGate } from './compatibility-gate';
export type CommandOutcome = 'confirmed' | 'rejected' | 'unknown';
export interface ProtectedPort {
  load(): Promise<string>;
  submit(id: string, input: string): Promise<CommandOutcome>;
  reconcile(id: string): Promise<CommandOutcome>;
}
export function createProtectedConsumers(
  gate: CompatibilityGate,
  port: ProtectedPort,
  publish: (value: string) => void,
) {
  let operation:
    { id: string; outcome: CommandOutcome | 'pending' } | undefined;
  let disposed = false;
  let loadGeneration = 0;
  return {
    async load() {
      if (disposed) throw Error('Consumer disposed');
      const ticket = gate.admit();
      const current = ++loadGeneration;
      const result = await gate.submit(ticket, () => port.load());
      if (!disposed && current === loadGeneration && gate.isCurrent(ticket))
        publish(result);
    },
    async submit(id: string, input: string) {
      if (
        disposed ||
        operation?.outcome === 'pending' ||
        operation?.outcome === 'unknown'
      )
        throw Error('Reconcile the previous operation before retrying');
      const ticket = gate.admit();
      operation = { id, outcome: 'pending' };
      try {
        operation.outcome = await gate.submit(ticket, () =>
          port.submit(id, input),
        );
      } catch {
        operation.outcome = 'unknown';
      }
      return operation.outcome;
    },
    async reconcile() {
      if (disposed || !operation || operation.outcome !== 'unknown')
        throw Error('No unknown operation');
      const ticket = gate.admit();
      operation.outcome = 'pending';
      try {
        operation.outcome = await gate.submit(ticket, () =>
          port.reconcile(operation!.id),
        );
      } catch {
        operation.outcome = 'unknown';
      }
      return operation.outcome;
    },
    getOutcome: () => operation?.outcome,
    dispose() {
      disposed = true;
      loadGeneration++;
    },
  };
}
