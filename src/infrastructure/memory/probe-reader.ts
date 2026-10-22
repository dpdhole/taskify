import type { ProbeReader } from '../../application/probe-session';

export function createMemoryProbe(
  initial: unknown = { message: 'Memory connection verified', revision: 0 },
) {
  let value = initial;
  const subscribers = new Set<(value: unknown) => void>();
  const reader: ProbeReader = {
    watch(next) {
      subscribers.add(next);
      next(value);
      return () => subscribers.delete(next);
    },
  };
  return {
    reader,
    publish(next: unknown) {
      value = next;
      for (const listener of subscribers) listener(value);
    },
    get subscriberCount() {
      return subscribers.size;
    },
  };
}
