import type { CreateTaskRequest } from "@taskify/api-contracts";
import { onCall } from "firebase-functions/v2/https";
import { requireAuthenticatedUser } from "../auth/authenticated-user.js";
import { toHttpsError } from "../shared/errors.js";
import { createTask as createTaskOperation } from "../tasks/create-task.js";

export const createTask = onCall<CreateTaskRequest>(async (request) => {
  try {
    const actor = requireAuthenticatedUser(request);
    return await createTaskOperation(request.data, actor.email);
  } catch (error) {
    throw toHttpsError(error);
  }
});
