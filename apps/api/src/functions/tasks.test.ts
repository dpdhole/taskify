import type { CallableRequest } from "firebase-functions/v2/https";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../shared/errors.js";

const operation = vi.hoisted(() => vi.fn());
vi.mock("../tasks/create-task.js", () => ({ createTask: operation }));

import { createTask } from "./tasks.js";

const input = { title: "Task", description_md: "", category_id: "personal" };
function request(auth?: unknown): Parameters<typeof createTask.run>[0] {
  return { data: input, auth } as CallableRequest<typeof input>;
}

describe("createTask callable handler", () => {
  beforeEach(() => { operation.mockReset(); });

  it.each([undefined, { uid: "owner", token: {} }, { uid: "owner", token: { email: "  " } },
    { uid: "owner", token: { email: 123 } }])("rejects missing usable authentication: %j", async (auth) => {
    await expect(createTask.run(request(auth))).rejects.toMatchObject({
      code: "unauthenticated", message: "UNAUTHENTICATED", details: { code: "UNAUTHENTICATED" },
    });
    expect(operation).not.toHaveBeenCalled();
  });

  it("uses the authenticated canonical email and returns the operation response", async () => {
    const response = { task_id: "created", updated_at: "2026-10-07T08:10:00.000Z" };
    operation.mockResolvedValue(response);
    const call = request({ uid: "owner", token: { email: "  Owner@Example.COM  " } });
    call.data = { ...input, owner_email: "spoof@example.com" } as typeof input;
    await expect(createTask.run(call)).resolves.toEqual(response);
    expect(operation).toHaveBeenCalledExactlyOnceWith(call.data, "owner@example.com");
  });

  it.each([
    ["INVALID_ARGUMENT", "invalid-argument"],
    ["NOT_AUTHORIZED", "permission-denied"],
    ["CONFLICT", "aborted"],
    ["INTERNAL", "internal"],
  ] as const)("translates %s to the public callable error", async (code, firebaseCode) => {
    operation.mockRejectedValue(new ApiError(code));
    await expect(createTask.run(request({ uid: "owner", token: { email: "owner@example.com" } })))
      .rejects.toMatchObject({ code: firebaseCode, message: code, details: { code } });
  });

  it("does not expose unexpected error details", async () => {
    operation.mockRejectedValue(new Error("private database details"));
    await expect(createTask.run(request({ uid: "owner", token: { email: "owner@example.com" } })))
      .rejects.toMatchObject({ code: "internal", message: "INTERNAL", details: { code: "INTERNAL" } });
  });
});
