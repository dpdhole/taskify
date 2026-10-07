import type { CallableRequest } from "firebase-functions/v2/https";
import { ApiError } from "../shared/errors.js";

export interface AuthenticatedUser {
  uid: string;
  email: string;
}

export function requireAuthenticatedUser(request: CallableRequest<unknown>): AuthenticatedUser {
  const email = request.auth?.token.email;
  if (!request.auth || typeof email !== "string" || email.trim() === "") {
    throw new ApiError("UNAUTHENTICATED");
  }
  return { uid: request.auth.uid, email: email.trim().toLowerCase() };
}
