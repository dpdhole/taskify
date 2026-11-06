/** Never return response text, headers, identity fields or credential values. */
export function authDeleteDiagnostic(httpStatus: number, body: unknown) {
  const allowed = new Set([
    'PERMISSION_DENIED',
    'UNAUTHENTICATED',
    'INVALID_ARGUMENT',
    'NOT_FOUND',
    'RESOURCE_EXHAUSTED',
    'INTERNAL',
    'UNAVAILABLE',
    'ACCESS_TOKEN_SCOPE_INSUFFICIENT',
    'SERVICE_DISABLED',
    'USER_PROJECT_DENIED',
    'CREDENTIALS_MISSING',
    'CREDENTIALS_INVALID',
  ]);
  let reason = 'unclassified';
  if (body && typeof body === 'object' && 'error' in body) {
    const error = body.error;
    if (error && typeof error === 'object') {
      if (
        'status' in error &&
        typeof error.status === 'string' &&
        allowed.has(error.status)
      )
        reason = error.status;
      if ('details' in error && Array.isArray(error.details)) {
        for (const detail of error.details) {
          if (
            detail &&
            typeof detail === 'object' &&
            'reason' in detail &&
            typeof detail.reason === 'string' &&
            allowed.has(detail.reason)
          )
            reason = detail.reason;
        }
      }
    }
  }
  return { httpStatus, reason };
}
