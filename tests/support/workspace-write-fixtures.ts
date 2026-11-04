import { createHash } from 'node:crypto';
import { serverTimestamp } from 'firebase/firestore';
import { createWorkspaceSeedPlan } from '../../src/domain/workspace-seeds';
import { probeStages } from './provisioning-stage-layout';
export function stageWrites(
  uid: string,
  index: number,
): { path: string; data: Record<string, unknown> }[] {
  const at = (kind: string, id: string) => `users/${uid}/${kind}/${id}`;
  const guard = (kind: string, key: string) =>
    `users/${uid}/nameKeys/${kind}/keys/${createHash('sha256').update(key, 'utf8').digest('hex')}`;
  const meta = () => ({
    schemaVersion: 1,
    recordVersion: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const receipt = () => ({
    schemaVersion: 1,
    templateVersion: 1,
    completedAt: serverTimestamp(),
  });
  const stage = probeStages[index]!;
  const plan = createWorkspaceSeedPlan();
  const result: { path: string; data: Record<string, unknown> }[] = [];
  if (stage.kind === 'base')
    result.push(
      {
        path: at('initialization', 'workspace'),
        data: { ...meta(), templateVersion: 1, status: 'initializing' },
      },
      { path: at('profile', 'main'), data: meta() },
      { path: at('settings', 'main'), data: { ...meta(), timezone: 'UTC' } },
    );
  else if (stage.kind === 'views') {
    const seed = plan.views.find((v) => v.id === stage.ids[0])!;
    const { id, ...data } = seed;
    result.push({ path: at('views', id), data: { ...meta(), ...data } });
  } else {
    const seeds =
      stage.kind === 'categories' ? plan.categories : plan.locations;
    for (const id of stage.ids) {
      const seed = seeds.find((s) => s.id === id)!;
      const { id: ignored, ...data } = seed;
      void ignored;
      result.push(
        { path: at(stage.kind, id), data: { ...meta(), ...data } },
        {
          path: guard(stage.kind, seed.nameKey),
          data: {
            schemaVersion: 1,
            nameKey: seed.nameKey,
            entityId: id,
            createdAt: serverTimestamp(),
          },
        },
      );
    }
  }
  result.push({ path: at('initializationStages', stage.id), data: receipt() });
  return result;
}
