import { it, expect, vi } from 'vitest';
import {
  publishCandidate,
  toFields,
  fromFields,
  validateTarget,
} from '../../tools/publish-compatibility.mjs';
import { capabilities, contract } from '../support/compatibility-fixtures';
it('validates exact project identity and free-only billing', () => {
  const p = {
    projectId: 'taskify-dev-dpdhole',
    projectNumber: '243252492098',
    state: 'ACTIVE',
  };
  expect(() => validateTarget(p, { billingEnabled: false })).not.toThrow();
  expect(() =>
    validateTarget({ ...p, projectNumber: '1' }, { billingEnabled: false }),
  ).toThrow('identity');
  expect(() => validateTarget(p, { billingEnabled: true })).toThrow('billing');
});
it('round-trips only represented contract field types', () => {
  expect(fromFields(toFields(contract()))).toEqual(contract());
  expect(() => toFields({ x: null })).toThrow();
  expect(() => fromFields({ x: { timestampValue: 'unknown' } })).toThrow();
});
it('publishes atomically with an absence precondition and verifies server result', async () => {
  const c = contract({ environmentId: 'taskify-dev-dpdhole' });
  let persisted: { fields: ReturnType<typeof toFields> } | null = null;
  const post = vi.fn(async (path: string, body: Record<string, unknown>) => {
    if (path.endsWith('beginTransaction'))
      return { body: { transaction: 'transaction-fixture' } };
    if (path.endsWith(':commit')) {
      const writes = body.writes as {
        currentDocument: unknown;
        update: { fields: ReturnType<typeof toFields> };
      }[];
      expect(writes[0]!.currentDocument).toEqual({ exists: false });
      persisted = writes[0]!.update;
    }
    return { body: {} };
  });
  const api = {
    post,
    get: vi.fn(async () => {
      if (!persisted) throw Object.assign(Error('missing'), { status: 404 });
      return { body: persisted };
    }),
  };
  expect(
    (
      await publishCandidate(api, c, null, {
        ...capabilities,
        environmentId: 'taskify-dev-dpdhole',
      })
    ).revision,
  ).toBe(1);
  expect(post.mock.calls.filter((c) => c[0].endsWith(':commit'))).toHaveLength(
    1,
  );
});
it('stops concurrent/stale publishers before overwrite, preserving CAS at commit', async () => {
  const current = contract({ revision: 2 });
  const post = vi.fn(async () => ({ body: { transaction: 'fixture' } }));
  const get = vi.fn(async () => ({
    body: { fields: toFields(current), updateTime: 't2' },
  }));
  await expect(
    publishCandidate({ post, get }, contract({ revision: 2 }), 1, capabilities),
  ).rejects.toThrow('publication-conflict');
  expect(post.mock.calls).toHaveLength(2);
  const p = vi.fn(async (path: string, body: Record<string, unknown>) => {
    if (path.endsWith('beginTransaction'))
      return { body: { transaction: 'fixture' } };
    if (path.endsWith(':commit')) {
      const writes = body.writes as { currentDocument: unknown }[];
      expect(writes[0]!.currentDocument).toEqual({ updateTime: 't2' });
      throw Error('concurrent commit');
    }
    return { body: {} };
  });
  await expect(
    publishCandidate(
      { post: p, get },
      contract({ revision: 3 }),
      2,
      capabilities,
    ),
  ).rejects.toThrow('concurrent commit');
  expect(p.mock.calls.filter((c) => c[0].endsWith(':commit'))).toHaveLength(1);
});
