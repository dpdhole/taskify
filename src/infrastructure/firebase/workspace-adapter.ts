import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import type { Firestore, DocumentSnapshot } from 'firebase/firestore';
import { WorkspaceError } from '../../application/workspace-port';
import type {
  WorkspacePort,
  WorkspaceInitialInput,
  WorkspaceInspection,
} from '../../application/workspace-port';
import { decodeFirestoreWorkspaceRecord } from './workspace-record-decoder';
import {
  createWorkspaceSeedPlan,
  validateWorkspaceTimezone,
} from '../../domain/workspace-seeds';
import { workspaceStages } from '../../domain/workspace-stages';
import { decodeWorkspaceRecord } from '../../domain/workspace-records';
import { WorkspaceDataError } from '../../domain/workspace-validation';
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, item]) => JSON.stringify(key) + ':' + canonical(item))
        .join(',') +
      '}'
    );
  return JSON.stringify(value) ?? 'null';
}
/** Shared application database, never an isolated provider-proof Auth context. */
export function createWorkspaceAdapter(db: Firestore): WorkspacePort {
  let disposed = false;
  const watches = new Set<() => void>();
  const check = (current: () => boolean) => {
    if (disposed || !current()) throw new WorkspaceError('revoked');
  };
  const path = (uid: string, kind: string, id: string) =>
    `users/${uid}/${kind}/${id}`;
  const fence = (uid: string) => doc(db, `accountDeletion/${uid}`);
  const root = (uid: string) =>
    doc(db, path(uid, 'initialization', 'workspace'));
  const receipt = (uid: string, id: string) =>
    doc(db, path(uid, 'initializationStages', id));
  async function digest(key: string) {
    const bytes = new TextEncoder().encode(key);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(hash)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
  function decode(
    uid: string,
    family: Parameters<typeof decodeFirestoreWorkspaceRecord>[1],
    snap: DocumentSnapshot,
  ) {
    try {
      return decodeFirestoreWorkspaceRecord(uid, family, snap);
    } catch {
      throw new WorkspaceError('inconsistent');
    }
  }
  async function wrap<T>(
    operation: () => Promise<T>,
    write = false,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof WorkspaceError) throw error;
      if (error instanceof WorkspaceDataError)
        throw new WorkspaceError('inconsistent');
      const rawCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? error.code
          : undefined;
      const code =
        typeof rawCode === 'string' &&
        [
          'aborted',
          'already-exists',
          'failed-precondition',
          'permission-denied',
          'unavailable',
          'invalid-argument',
          'unknown',
          'deadline-exceeded',
        ].includes(rawCode)
          ? rawCode
          : undefined;
      throw new WorkspaceError(write ? 'uncertain' : 'unavailable', code);
    }
  }
  const meta = () => ({
    schemaVersion: 1,
    recordVersion: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const dummyTime = { seconds: 0, nanoseconds: 0 };
  async function seedWrites(
    uid: string,
    index: number,
    input: WorkspaceInitialInput,
  ) {
    const stage = workspaceStages[index];
    if (!stage) throw new WorkspaceError('inconsistent');
    const plan = createWorkspaceSeedPlan();
    const data: {
      path: string;
      family: Parameters<typeof decodeFirestoreWorkspaceRecord>[1];
      body: Record<string, unknown>;
    }[] = [];
    if (stage.kind === 'base') {
      let timezone: string;
      try {
        timezone = validateWorkspaceTimezone(input.timezone);
      } catch {
        throw new WorkspaceError('timezone-required');
      }
      const profile = input.profile ?? {};
      try {
        decodeWorkspaceRecord('profile', 'main', {
          schemaVersion: 1,
          recordVersion: 1,
          createdAt: dummyTime,
          updatedAt: dummyTime,
          ...profile,
        });
        if (profile.photoUrl) {
          const url = new URL(profile.photoUrl);
          if (url.protocol !== 'https:' || url.username || url.password)
            throw Error();
        }
      } catch {
        throw new WorkspaceError('profile-invalid');
      }
      data.push(
        {
          path: path(uid, 'initialization', 'workspace'),
          family: 'workspaceInitialization',
          body: { ...meta(), templateVersion: 1, status: 'initializing' },
        },
        {
          path: path(uid, 'profile', 'main'),
          family: 'profile',
          body: { ...meta(), ...profile },
        },
        {
          path: path(uid, 'settings', 'main'),
          family: 'settings',
          body: { ...meta(), timezone },
        },
      );
    } else if (stage.kind === 'views') {
      const { id, ...seed } = plan.views.find(
        (value) => value.id === stage.ids[0],
      )!;
      data.push({
        path: path(uid, 'views', id),
        family: 'view',
        body: { ...meta(), ...seed },
      });
    } else {
      for (const id of stage.ids) {
        const { id: ignored, ...seed } = (
          stage.kind === 'categories' ? plan.categories : plan.locations
        ).find((value) => value.id === id)!;
        void ignored;
        data.push(
          {
            path: path(uid, stage.kind, id),
            family: stage.kind === 'categories' ? 'category' : 'location',
            body: { ...meta(), ...seed },
          },
          {
            path: path(
              uid,
              `nameKeys/${stage.kind}/keys`,
              await digest(seed.nameKey),
            ),
            family: 'nameReservation',
            body: {
              schemaVersion: 1,
              nameKey: seed.nameKey,
              entityId: id,
              createdAt: serverTimestamp(),
            },
          },
        );
      }
    }
    return data;
  }
  async function contents(uid: string, index: number) {
    if (index === 0)
      return [
        {
          path: path(uid, 'initialization', 'workspace'),
          family: 'workspaceInitialization' as const,
          body: {} as Record<string, unknown>,
        },
        {
          path: path(uid, 'profile', 'main'),
          family: 'profile' as const,
          body: {} as Record<string, unknown>,
        },
        {
          path: path(uid, 'settings', 'main'),
          family: 'settings' as const,
          body: {} as Record<string, unknown>,
        },
      ];
    return seedWrites(uid, index, {});
  }
  function validateContent(
    uid: string,
    content: Awaited<ReturnType<typeof contents>>[number],
    snap: DocumentSnapshot,
    receiptValue: ReturnType<typeof decode>,
  ) {
    const value = decode(uid, content.family, snap);
    if (!('completedAt' in receiptValue) || !receiptValue.completedAt)
      throw new WorkspaceError('inconsistent');
    if ('recordVersion' in value && value.recordVersion !== 1)
      throw new WorkspaceError('inconsistent');
    const record = value as unknown as Record<string, unknown>;
    for (const field of [
      'name',
      'nameKey',
      'icon',
      'archived',
      'order',
      'showOnHome',
      'entityId',
    ] as const) {
      if (
        Object.hasOwn(content.body, field) &&
        record[field] !== content.body[field]
      )
        throw new WorkspaceError('inconsistent');
    }
    if (
      'query' in value &&
      content.body.query &&
      canonical(value.query) !== canonical(content.body.query)
    )
      throw new WorkspaceError('inconsistent');
    if (
      'createdAt' in value &&
      canonical(value.createdAt) !== canonical(receiptValue.completedAt)
    )
      throw new WorkspaceError('inconsistent');
    if (
      'updatedAt' in value &&
      canonical(value.updatedAt) !== canonical(receiptValue.completedAt)
    )
      throw new WorkspaceError('inconsistent');
  }
  async function committedStage(
    uid: string,
    index: number,
    current: () => boolean,
  ): Promise<boolean> {
    check(current);
    if ((await getDocFromServer(fence(uid))).exists())
      throw new WorkspaceError('fenced');
    const done = await getDocFromServer(
      receipt(uid, workspaceStages[index]!.id),
    );
    check(current);
    if (!done.exists()) return false;
    const value = decode(uid, 'initializationStage', done),
      init = decode(
        uid,
        'workspaceInitialization',
        await getDocFromServer(root(uid)),
      );
    check(current);
    if (!('status' in init)) throw new WorkspaceError('inconsistent');
    if (init.status === 'initializing')
      for (const content of await contents(uid, index)) {
        check(current);
        validateContent(
          uid,
          content,
          await getDocFromServer(doc(db, content.path)),
          value,
        );
      }
    check(current);
    return true;
  }
  return {
    inspect: (uid, current) =>
      wrap(async () => {
        for (let attempt = 0; attempt < 3; attempt++) {
          check(current);
          if ((await getDocFromServer(fence(uid))).exists())
            throw new WorkspaceError('fenced');
          check(current);
          const before = await getDocFromServer(root(uid));
          check(current);
          const receipts = await getDocsFromServer(
            collection(db, path(uid, 'initializationStages', '').slice(0, -1)),
          );
          check(current);
          const after = await getDocFromServer(root(uid));
          check(current);
          if (
            before.exists() !== after.exists() ||
            (before.exists() &&
              before.data().recordVersion !== after.data()?.recordVersion)
          )
            continue;
          if (!after.exists()) {
            if (!receipts.empty) throw new WorkspaceError('inconsistent');
            return { complete: false, nextStage: 0 };
          }
          const init = decode(uid, 'workspaceInitialization', after);
          if (!('status' in init)) throw new WorkspaceError('inconsistent');
          const ids = new Set<string>();
          for (const snap of receipts.docs) {
            if (!workspaceStages.some((stage) => stage.id === snap.id))
              throw new WorkspaceError('inconsistent');
            decode(uid, 'initializationStage', snap);
            ids.add(snap.id);
          }
          const nextStage = workspaceStages.findIndex(
            (stage) => !ids.has(stage.id),
          );
          const next = nextStage < 0 ? workspaceStages.length : nextStage;
          if (workspaceStages.slice(next).some((stage) => ids.has(stage.id)))
            continue;
          if (init.status === 'complete') {
            if (next !== workspaceStages.length)
              throw new WorkspaceError('inconsistent');
            const required = [
              ['profile', 'profile', 'main'],
              ['settings', 'settings', 'main'],
              ['category', 'categories', 'uncategorized'],
              ['view', 'views', 'all-tasks'],
            ] as const;
            const records = [];
            for (const [family, kind, id] of required) {
              check(current);
              records.push(
                decode(
                  uid,
                  family,
                  await getDocFromServer(doc(db, path(uid, kind, id))),
                ),
              );
            }
            check(current);
            if ((await getDocFromServer(fence(uid))).exists())
              throw new WorkspaceError('fenced');
            check(current);
            const settings = records[1]!;
            if (!('timezone' in settings))
              throw new WorkspaceError('inconsistent');
            return {
              complete: true,
              nextStage: next,
              profile: {
                ...('displayName' in records[0]! &&
                typeof records[0]!.displayName === 'string'
                  ? { displayName: records[0]!.displayName }
                  : {}),
                ...('photoUrl' in records[0]! &&
                typeof records[0]!.photoUrl === 'string'
                  ? { photoUrl: records[0]!.photoUrl }
                  : {}),
              },
              timezone: settings.timezone,
            } as WorkspaceInspection;
          }
          if (!ids.has('base')) throw new WorkspaceError('inconsistent');
          const received = new Map(
            receipts.docs.map((snap) => [snap.id, snap]),
          );
          const checks: (() => Promise<void>)[] = [];
          for (let index = 0; index < next; index++) {
            check(current);
            const prior = decode(
              uid,
              'initializationStage',
              received.get(workspaceStages[index]!.id)!,
            );
            for (const content of await contents(uid, index))
              checks.push(async () => {
                check(current);
                const snap = await getDocFromServer(doc(db, content.path));
                check(current);
                validateContent(uid, content, snap, prior);
              });
          }
          try {
            await Promise.all(checks.map((work) => work()));
          } catch (error) {
            check(current);
            const latest = await getDocFromServer(root(uid));
            check(current);
            // A different client may finalize while the prefix is being inspected.
            if (
              latest.exists() &&
              latest.data().recordVersion !== after.data()?.recordVersion
            )
              continue;
            throw error;
          }
          const confirmedRoot = await getDocFromServer(root(uid));
          check(current);
          if (
            confirmedRoot.exists() !== after.exists() ||
            confirmedRoot.data()?.recordVersion !== after.data()?.recordVersion
          )
            continue;
          return { complete: false, nextStage: next };
        }
        throw new WorkspaceError('unavailable');
      }),
    stage: (uid, index, input, current) =>
      wrap(async () => {
        check(current);
        const stage = workspaceStages[index];
        if (!stage) throw new WorkspaceError('inconsistent');
        if ((await getDocFromServer(fence(uid))).exists())
          throw new WorkspaceError('fenced');
        check(current);
        // Existing receipts preserve first-committed input, so do not require new social/timezone data on resume.
        const receiptSnapshot = await getDocFromServer(receipt(uid, stage.id));
        check(current);
        let writes: Awaited<ReturnType<typeof seedWrites>> | undefined;
        if (!receiptSnapshot.exists())
          writes = await seedWrites(uid, index, input);
        const existingContents = await contents(uid, index);

        check(current);
        let verifyObservedProgress = false;
        try {
          await runTransaction(
            db,
            async (tx) => {
              check(current);
              if ((await tx.get(fence(uid))).exists())
                throw new WorkspaceError('fenced');
              const initSnap = await tx.get(root(uid));
              const completed = await tx.get(receipt(uid, stage.id));
              check(current);
              if (completed.exists()) {
                const receiptValue = decode(
                  uid,
                  'initializationStage',
                  completed,
                );
                if (
                  !('completedAt' in receiptValue) ||
                  !receiptValue.completedAt
                )
                  throw new WorkspaceError('inconsistent');
                if (initSnap.exists()) {
                  const init = decode(uid, 'workspaceInitialization', initSnap);
                  if ('status' in init && init.status === 'initializing') {
                    for (const content of existingContents) {
                      validateContent(
                        uid,
                        content,
                        await tx.get(doc(db, content.path)),
                        receiptValue,
                      );
                    }
                  }
                }
                check(current);
                return;
              }
              if (index === 0) {
                if (initSnap.exists()) throw new WorkspaceError('inconsistent');
              } else {
                if (!initSnap.exists())
                  throw new WorkspaceError('inconsistent');
                const init = decode(uid, 'workspaceInitialization', initSnap);
                if (!('status' in init) || init.status !== 'initializing')
                  throw new WorkspaceError('inconsistent');
                const prior = await tx.get(
                  receipt(uid, workspaceStages[index - 1]!.id),
                );
                decode(uid, 'initializationStage', prior);
              }
              if (!writes) throw new WorkspaceError('uncertain');
              for (const write of writes) {
                const previous = await tx.get(doc(db, write.path));
                if (previous.exists()) {
                  verifyObservedProgress = true;
                  return;
                }
              }
              check(current);
              for (const write of writes)
                tx.set(doc(db, write.path), write.body);
              tx.set(receipt(uid, stage.id), {
                schemaVersion: 1,
                templateVersion: 1,
                completedAt: serverTimestamp(),
              });
            },
            { maxAttempts: 5 },
          );
          if (
            verifyObservedProgress &&
            !(await committedStage(uid, index, current))
          )
            throw new WorkspaceError('inconsistent');
        } catch (error) {
          if (error instanceof WorkspaceError) throw error;
          if (await committedStage(uid, index, current)) return;
          throw error;
        }
      }, true),
    finalize: (uid, current) =>
      wrap(async () => {
        check(current);
        await runTransaction(
          db,
          async (tx) => {
            check(current);
            if ((await tx.get(fence(uid))).exists())
              throw new WorkspaceError('fenced');
            const snap = await tx.get(root(uid)),
              last = await tx.get(receipt(uid, workspaceStages.at(-1)!.id));
            const init = decode(uid, 'workspaceInitialization', snap);
            decode(uid, 'initializationStage', last);
            check(current);
            if (!('status' in init)) throw new WorkspaceError('inconsistent');
            if (init.status === 'complete') return;
            if (init.recordVersion !== 1)
              throw new WorkspaceError('inconsistent');
            tx.update(root(uid), {
              status: 'complete',
              recordVersion: 2,
              updatedAt: serverTimestamp(),
              completedAt: serverTimestamp(),
            });
          },
          { maxAttempts: 5 },
        );
      }, true),
    watchFence(uid, next, error) {
      if (disposed) throw new WorkspaceError('revoked');
      const stop = onSnapshot(
        fence(uid),
        { includeMetadataChanges: true },
        (snap) => {
          if (!disposed)
            next(
              snap.exists(),
              !snap.metadata.fromCache && !snap.metadata.hasPendingWrites,
            );
        },
        () => {
          if (!disposed) error();
        },
      );
      watches.add(stop);
      return () => {
        stop();
        watches.delete(stop);
      };
    },
    dispose() {
      disposed = true;
      for (const stop of watches) stop();
      watches.clear();
    },
  };
}
