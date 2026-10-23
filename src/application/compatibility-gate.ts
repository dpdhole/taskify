import {
  ContractError,
  decodeContract,
  evaluateCompatibility,
  validateClient,
} from '../domain/compatibility';
import type {
  ClientCapabilities,
  CompatibilityContract,
} from '../domain/compatibility';

export interface ContractReader {
  readServer(): Promise<unknown>;
  watch(
    next: (raw: unknown, authoritative: boolean) => void,
    error: () => void,
  ): () => void;
}
export interface GateClock {
  schedule(fn: () => void, milliseconds: number): () => void;
}
export type GateStatus =
  | 'checking'
  | 'ready'
  | 'incompatible'
  | 'configuration-error'
  | 'verification-unavailable'
  | 'disposed';
export interface GateState {
  status: GateStatus;
  generation: number;
  revision: number | null;
  reason: string;
}
export interface Admission {
  readonly generation: number;
  readonly revision: number;
}
export type CompatibilityGate = ReturnType<typeof createCompatibilityGate>;

export function createCompatibilityGate(
  reader: ContractReader,
  client: ClientCapabilities,
  clock: GateClock,
  deadlineMs = 15000,
) {
  validateClient(client);
  if (!Number.isFinite(deadlineMs) || deadlineMs <= 0)
    throw Error('Invalid verification deadline');
  let state: GateState = {
    status: 'checking',
    generation: 0,
    revision: null,
    reason: 'boot',
  };
  let cycle = 0;
  let observation = 0;
  let highestObservedRevision = 0;
  let highest: CompatibilityContract | undefined;
  let unsubscribe: (() => void) | undefined;
  let cancelDeadline: (() => void) | undefined;
  let disposed = false;
  const subscribers = new Set<(state: GateState) => void>();
  function publish(
    status: GateStatus,
    reason: string,
    revoke: boolean,
    revision: number | null = state.revision,
  ) {
    state = {
      status,
      reason,
      revision,
      generation: state.generation + Number(revoke),
    };
    for (const listener of subscribers) listener(state);
  }
  function cleanup() {
    cycle++;
    unsubscribe?.();
    unsubscribe = undefined;
    cancelDeadline?.();
    cancelDeadline = undefined;
  }
  function accept(raw: unknown) {
    cancelDeadline?.();
    cancelDeadline = undefined;
    try {
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const declared = raw as Record<string, unknown>;
        if (
          declared.environmentId === client.environmentId &&
          typeof declared.revision === 'number' &&
          Number.isSafeInteger(declared.revision) &&
          declared.revision > 0
        ) {
          if (declared.revision < highestObservedRevision)
            throw new ContractError('revision-regression');
          highestObservedRevision = declared.revision;
        }
      }
      const contract = decodeContract(raw);
      const reason = evaluateCompatibility(contract, client);
      if (highest && contract.revision < highest.revision)
        throw new ContractError('revision-regression');
      if (
        highest &&
        contract.revision === highest.revision &&
        JSON.stringify(contract) !== JSON.stringify(highest)
      )
        throw new ContractError('revision-reused');
      const unchanged =
        highest && JSON.stringify(contract) === JSON.stringify(highest);
      highest = contract;
      if (state.status === 'ready' && unchanged && !reason) return;
      publish(
        reason ? 'incompatible' : 'ready',
        reason ?? 'compatible',
        true,
        contract.revision,
      );
    } catch (error) {
      publish(
        'configuration-error',
        error instanceof ContractError ? error.code : 'malformed-contract',
        true,
      );
    }
  }
  function recheck(reason = 'retry') {
    if (disposed) return;
    cleanup();
    observation = 0;
    const currentCycle = cycle;
    publish('checking', reason, true);
    cancelDeadline = clock.schedule(() => {
      if (cycle === currentCycle && state.status === 'checking')
        publish('verification-unavailable', 'verification-timeout', true);
    }, deadlineMs);
    try {
      const stop = reader.watch(
        (raw, authoritative) => {
          if (disposed || cycle !== currentCycle) return;
          observation++;
          if (authoritative) accept(raw);
          else publish('verification-unavailable', 'server-unverified', true);
        },
        () => {
          if (disposed || cycle !== currentCycle) return;
          observation++;
          publish('verification-unavailable', 'connection-unavailable', true);
        },
      );
      if (disposed || cycle !== currentCycle) stop();
      else unsubscribe = stop;
      if (disposed || cycle !== currentCycle) return;
      const readObservation = observation;
      void reader.readServer().then(
        (raw) => {
          if (
            !disposed &&
            cycle === currentCycle &&
            observation === readObservation
          )
            accept(raw);
        },
        () => {
          if (
            !disposed &&
            cycle === currentCycle &&
            observation === readObservation &&
            state.status !== 'ready'
          )
            publish('verification-unavailable', 'connection-unavailable', true);
        },
      );
    } catch {
      if (!disposed && cycle === currentCycle)
        publish('verification-unavailable', 'connection-unavailable', true);
    }
  }
  function isCurrent(ticket: Admission) {
    return (
      !disposed &&
      state.status === 'ready' &&
      ticket.generation === state.generation &&
      ticket.revision === state.revision
    );
  }
  return {
    getState: () => state,
    subscribe(listener: (state: GateState) => void) {
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    },
    start: () => recheck('boot'),
    recheck,
    suspend(reason: 'offline' | 'hidden') {
      if (!disposed) {
        cleanup();
        publish('verification-unavailable', reason, true);
      }
    },
    admit(): Admission {
      if (state.status !== 'ready' || state.revision === null)
        throw Error('Compatibility gate is closed');
      return Object.freeze({
        generation: state.generation,
        revision: state.revision,
      });
    },
    isCurrent,
    submit<T>(ticket: Admission, operation: () => T): T {
      if (!isCurrent(ticket)) throw Error('Compatibility admission expired');
      return operation();
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        cleanup();
        publish('disposed', 'disposed', true);
        subscribers.clear();
      }
    },
  };
}
