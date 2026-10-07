import type { CallableRequest } from "firebase-functions/v2/https";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../shared/errors.js";

const operations = vi.hoisted(() => ({ create: vi.fn(), rename: vi.fn(), archive: vi.fn(), reset: vi.fn(), register: vi.fn() }));
vi.mock("../categories/create-category.js", () => ({ createCategory: operations.create }));
vi.mock("../categories/rename-category.js", () => ({ renameCategory: operations.rename }));
vi.mock("../categories/set-category-archived.js", () => ({ setCategoryArchived: operations.archive }));
vi.mock("../categories/reset-category-order.js", () => ({ resetCategoryOrder: operations.reset }));
vi.mock("../categories/complete-registration.js", () => ({ completeRegistration: operations.register }));
import { createCategory, renameCategory, setCategoryArchived, resetCategoryOrder, completeRegistration } from "./categories.js";

const handlers = [
  ["create", createCategory, operations.create], ["rename", renameCategory, operations.rename],
  ["archive", setCategoryArchived, operations.archive], ["reset", resetCategoryOrder, operations.reset],
  ["register", completeRegistration, operations.register],
] as const;

describe("Category callable adapters", () => {
  beforeEach(() => Object.values(operations).forEach((operation) => operation.mockReset()));
  for (const [name, handler, operation] of handlers) {
    const run = (data: unknown, auth?: unknown) => handler.run({ data, auth } as CallableRequest<never>);
    it.each([undefined, { uid: "owner", token: {} }, { uid: "owner", token: { email: "  " } }])
      (`${name} authenticates before executing (%j)`, async (auth) => {
        await expect(run({}, auth)).rejects.toMatchObject({ code: "unauthenticated", details: { code: "UNAUTHENTICATED" } });
        expect(operation).not.toHaveBeenCalled();
      });
    it(`${name} resolves canonical trusted identity and passes through the response`, async () => {
      const response = { category_id: "id", updated_at: "2026-10-07T00:00:00.123456000Z" };
      operation.mockResolvedValue(response);
      const data = { owner_email: "spoof@example.com" };
      await expect(run(data, { uid: "owner", token: { email: " Owner@Example.COM " } })).resolves.toEqual(response);
      expect(operation).toHaveBeenCalledExactlyOnceWith(data, "owner@example.com");
    });
    it.each([["DUPLICATE_ARGUMENT", "already-exists"], ["CONFLICT", "aborted"], ["INVALID_ARGUMENT", "invalid-argument"]] as const)
      (`${name} translates %s`, async (code, transport) => {
        operation.mockRejectedValue(new ApiError(code, "private details"));
        await expect(run({}, { uid: "owner", token: { email: "owner@example.com" } }))
          .rejects.toMatchObject({ code: transport, message: code, details: { code } });
      });
    it(`${name} hides unexpected failures`, async () => {
      operation.mockRejectedValue(new Error("private details"));
      await expect(run({}, { uid: "owner", token: { email: "owner@example.com" } }))
        .rejects.toMatchObject({ code: "internal", message: "INTERNAL", details: { code: "INTERNAL" } });
    });
  }
});
