import type { CompatibilityGate } from '../../application/compatibility-gate';
// Keep the production lifecycle and browser regression fixture on the same path.
export function attachCompatibilityLifecycle(gate: CompatibilityGate) {
  const online = () => gate.recheck('reconnect');
  const offline = () => gate.suspend('offline');
  const visibility = () => {
    if (document.visibilityState === 'hidden') gate.suspend('hidden');
    else gate.recheck('resume');
  };
  const pagehide = () => gate.suspend('hidden');
  const pageshow = (event: PageTransitionEvent) => {
    if (event.persisted) gate.recheck('resume');
  };
  window.addEventListener('online', online);
  window.addEventListener('offline', offline);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('pagehide', pagehide);
  window.addEventListener('pageshow', pageshow);
  if (!navigator.onLine) gate.suspend('offline');
  if (document.visibilityState === 'hidden') gate.suspend('hidden');
  return () => {
    window.removeEventListener('online', online);
    window.removeEventListener('offline', offline);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('pagehide', pagehide);
    window.removeEventListener('pageshow', pageshow);
  };
}
