import type { ContractReader } from '../../application/compatibility-gate';
import type { CompatibilityContract } from '../../domain/compatibility';
export function createMemoryContract(initial: CompatibilityContract) {
  let value: unknown = structuredClone(initial);
  const listeners = new Set<(raw: unknown, authoritative: boolean) => void>();
  const reader: ContractReader = {
    async readServer() {
      return structuredClone(value);
    },
    watch(next) {
      listeners.add(next);
      next(structuredClone(value), true);
      return () => {
        listeners.delete(next);
      };
    },
  };
  return {
    reader,
    publish(raw: unknown, authoritative = true) {
      value = structuredClone(raw);
      for (const next of listeners) next(structuredClone(value), authoritative);
    },
  };
}
