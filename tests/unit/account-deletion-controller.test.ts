import { expect, it, vi } from 'vitest';
import { createAccountDeletionController } from '../../src/application/account-deletion-controller';
import { createCompatibilityGate } from '../../src/application/compatibility-gate';
import { createSessionController } from '../../src/application/session-controller';
import type { SessionIdentity } from '../../src/application/session-controller';
import type {
  DeletionProof,
  DeletionStatus,
  DeletionRequestPort,
} from '../../src/application/account-deletion-port';
import { DeletionError } from '../../src/application/account-deletion-port';
import { capabilities, contract } from '../support/compatibility-fixtures';
const job = '11111111-1111-4111-8111-111111111111';
const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};
async function fixture(pending = false) {
  const clock = { schedule: (_fn: () => void, _ms: number) => () => {} };
  const gate = createCompatibilityGate(
    {
      readServer: async () => contract({ revision: 3 }),
      watch(next) {
        next(contract({ revision: 3 }), true);
        return () => {};
      },
    },
    capabilities,
    clock,
  );
  gate.start();
  let nextSession!: (identity: SessionIdentity | null) => void;
  const session = createSessionController(
    {
      initialize: async () => {},
      observe(next) {
        nextSession = next;
        next({ uid: 'A' });
        return () => {};
      },
      signOut: async () => {
        nextSession(null);
      },
      dispose() {},
    },
    gate,
    clock,
    () => {},
  );
  session.start();
  await flush();
  let watched!: (status: DeletionStatus, authoritative: boolean) => void;
  let watchError!: () => void;
  const evidence: DeletionProof = {
    uid: 'A',
    jobId: job,
    provider: 'google.com',
    authTime: Math.floor(Date.now() / 1000),
  };
  const control = {
    schemaVersion: 1 as const,
    inventoryVersion: 1 as const,
    operatorPolicyVersion: 1 as const,
    admissionRevision: 3,
    jobId: job,
    state: 'requested' as const,
    requestedAt: { seconds: evidence.authTime, nanoseconds: 0 },
    authTime: evidence.authTime,
    proofProvider: 'google.com' as const,
    recordVersion: 1,
    updatedAt: { seconds: evidence.authTime, nanoseconds: 0 },
  };
  const requests = {
    forget: vi.fn(),
    hasPending: () => pending,
    read: vi.fn().mockResolvedValue({ exists: false }),
    request: vi.fn().mockResolvedValue({ exists: true, control }),
    watch: vi.fn<DeletionRequestPort['watch']>((_uid, next, error) => {
      watched = next;
      watchError = error;
      next({ exists: false }, true);
      return vi.fn();
    }),
    dispose: vi.fn(),
  };
  const proof = {
    providers: vi.fn().mockResolvedValue(['google.com']),
    prove: vi.fn().mockResolvedValue(evidence),
    resume: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn(),
    dispose: vi.fn(),
  };
  let online = true;
  const controller = createAccountDeletionController(
    requests,
    proof,
    session,
    clock,
    () => job,
    () => online,
  );
  await flush();
  return {
    controller,
    requests,
    proof,
    session,
    gate,
    control,
    evidence,
    watch: (status: DeletionStatus, authoritative = true) =>
      watched(status, authoritative),
    watchError: () => watchError(),
    switch: async (uid: string | null) => {
      nextSession(uid ? { uid } : null);
      await flush();
    },
    offline: () => {
      online = false;
    },
    finish: () => {
      controller.dispose();
      session.dispose();
      gate.dispose();
    },
  };
}
async function prove(f: Awaited<ReturnType<typeof fixture>>) {
  await f.controller.open();
  await f.controller.prove('DELETE', 'google.com', 'popup');
}
it('requires typed confirmation and provider proof before sending any request', async () => {
  const f = await fixture();
  try {
    await f.controller.open();
    await f.controller.prove('delete', 'google.com', 'popup');
    await f.controller.submit();
    expect(f.proof.prove).not.toHaveBeenCalled();
    expect(f.requests.request).not.toHaveBeenCalled();
    await f.controller.prove('DELETE', 'google.com', 'popup');
    expect(f.controller.getState().status).toBe('proof-ready');
    await f.controller.submit();
    expect(f.requests.request).toHaveBeenCalledTimes(1);
    expect(f.controller.getState().status).toBe('requested');
    f.controller.cancel();
    await f.controller.submit();
    expect(f.controller.getState().status).toBe('requested');
    expect(f.requests.request).toHaveBeenCalledTimes(1);
  } finally {
    f.finish();
  }
});
it('Logout clears local user-scoped intent without cancelling the cloud request', async () => {
  const f = await fixture();
  try {
    await prove(f);
    await f.controller.submit();
    await f.session.signOut();
    expect(f.requests.forget).toHaveBeenCalledWith('A');
    expect(f.controller.getState()).toMatchObject({
      status: 'idle',
      uid: null,
      control: null,
    });
    expect(f.requests.request).toHaveBeenCalledTimes(1);
  } finally {
    f.finish();
  }
});
it('cancellation before intent leaves the account unchanged', async () => {
  const f = await fixture();
  try {
    await prove(f);
    f.controller.cancel();
    await f.controller.submit();
    expect(f.requests.request).not.toHaveBeenCalled();
    expect(f.session.getState().identity?.uid).toBe('A');
  } finally {
    f.finish();
  }
});
it.each([
  { uid: 'B' },
  { jobId: '22222222-2222-4222-8222-222222222222' },
  { provider: 'microsoft.com' },
  { authTime: 1 },
])('rejects invalid proof %j', async (patch) => {
  const f = await fixture();
  try {
    f.proof.prove.mockResolvedValue({ ...f.evidence, ...patch });
    await prove(f);
    await f.controller.submit();
    expect(f.requests.request).not.toHaveBeenCalled();
    expect(f.controller.getState().status).toBe('confirming');
  } finally {
    f.finish();
  }
});
it('unknown acknowledgement cannot cancel or generate another request', async () => {
  const f = await fixture();
  try {
    f.requests.request.mockRejectedValue(new DeletionError('uncertain'));
    await prove(f);
    await f.controller.submit();
    expect(f.controller.getState().status).toBe('uncertain');
    f.controller.cancel();
    await f.controller.open();
    await f.controller.submit();
    expect(f.requests.request).toHaveBeenCalledTimes(1);
    await f.controller.refresh();
    expect(f.controller.getState().status).toBe('uncertain');
    f.requests.read.mockResolvedValue({ exists: true, control: f.control });
    await f.controller.refresh();
    expect(f.controller.getState().status).toBe('requested');
  } finally {
    f.finish();
  }
});
it('restores an uncertain submission marker without repeating proof or request', async () => {
  const f = await fixture(true);
  try {
    expect(f.controller.getState().status).toBe('uncertain');
    expect(f.proof.resume).not.toHaveBeenCalled();
    await f.controller.open();
    expect(f.proof.providers).not.toHaveBeenCalled();
  } finally {
    f.finish();
  }
});
it('cached or locally pending status cannot claim cloud-confirmed intent', async () => {
  const f = await fixture();
  try {
    f.watch({ exists: true, control: f.control }, false);
    expect(f.controller.getState().status).toBe('uncertain');
    f.watch({ exists: true, control: f.control });
    expect(f.controller.getState().status).toBe('requested');
  } finally {
    f.finish();
  }
});
it('unknown control schemas fence the account and status errors never claim completion', async () => {
  const f = await fixture();
  try {
    f.watch({ exists: true, control: null });
    expect(f.controller.getState()).toMatchObject({
      status: 'requested',
      control: null,
    });
    f.watchError();
    expect(f.controller.getState().status).toBe('requested');
  } finally {
    f.finish();
  }
});
it('offline or lost compatibility blocks new requests', async () => {
  const f = await fixture();
  try {
    await prove(f);
    f.offline();
    await f.controller.submit();
    expect(f.requests.request).not.toHaveBeenCalled();
  } finally {
    f.finish();
  }
  const g = await fixture();
  try {
    await prove(g);
    g.gate.suspend('offline');
    await g.controller.submit();
    expect(g.requests.request).not.toHaveBeenCalled();
  } finally {
    g.finish();
  }
});
it('late proof results cannot apply to another UID', async () => {
  const f = await fixture();
  try {
    let release!: (value: DeletionProof) => void;
    f.proof.prove.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    await f.controller.open();
    const work = f.controller.prove('DELETE', 'google.com', 'popup');
    await f.switch('B');
    release(f.evidence);
    await work;
    expect(f.controller.getState().uid).toBe('B');
    expect(f.controller.getState().status).toBe('idle');
    expect(f.requests.request).not.toHaveBeenCalled();
  } finally {
    f.finish();
  }
});
it('redirect return requires an actual matching proof, then an explicit request action', async () => {
  const f = await fixture();
  try {
    f.proof.resume.mockResolvedValue({ ...f.evidence, uid: 'B' });
    await f.switch('B');
    expect(f.controller.getState().status).toBe('proof-ready');
    expect(f.requests.request).not.toHaveBeenCalled();
  } finally {
    f.finish();
  }
});
