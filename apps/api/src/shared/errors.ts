import type { ApiErrorCode } from "@taskify/api-contracts";
import { HttpsError } from "firebase-functions/v2/https";

export class ApiError extends Error {
  constructor(public readonly code: ApiErrorCode, message: string = code) {
    super(message);
  }
}

export function toHttpsError(error: unknown): HttpsError {
  const code = error instanceof ApiError ? error.code : "INTERNAL";
  const firebaseCode =
    code === "UNAUTHENTICATED" ? "unauthenticated" :
    code === "NOT_AUTHORIZED" ? "permission-denied" :
    code === "CONFLICT" ? "aborted" :
    code === "DUPLICATE_ARGUMENT" ? "already-exists" :
    code === "INTERNAL" ? "internal" : "invalid-argument";
  return new HttpsError(firebaseCode, code, { code });
}
