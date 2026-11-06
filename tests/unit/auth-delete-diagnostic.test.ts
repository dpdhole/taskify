import { expect, test } from 'vitest';
import { authDeleteDiagnostic } from '../../tools/account-deletion/auth-diagnostic';

test('only allowlisted response classifications survive sanitization', () => {
  expect(
    authDeleteDiagnostic(403, {
      error: {
        status: 'PERMISSION_DENIED',
        message: 'secret-token user@example.invalid',
        details: [
          {
            reason: 'ACCESS_TOKEN_SCOPE_INSUFFICIENT',
            metadata: { token: 'secret' },
          },
        ],
      },
    }),
  ).toEqual({ httpStatus: 403, reason: 'ACCESS_TOKEN_SCOPE_INSUFFICIENT' });
});

test('unknown or malformed responses cannot leak arbitrary text', () => {
  for (const body of [
    null,
    'secret',
    { error: { status: 'secret', details: [{ reason: 'secret' }] } },
  ])
    expect(authDeleteDiagnostic(400, body)).toEqual({
      httpStatus: 400,
      reason: 'unclassified',
    });
});
