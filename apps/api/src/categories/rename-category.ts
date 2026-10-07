import type { CategoryMutationResponse, RenameCategoryRequest } from "@taskify/api-contracts";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../persistence/firestore.js";
import { ApiError } from "../shared/errors.js";
import { categoryId, expectedTimestamp, normalizeCategoryName, requestObject } from "./category-values.js";
import { ensureGuardAvailable, mutationResponse, nameGuard, ownedCategory } from "./category-persistence.js";

export async function renameCategory(input: RenameCategoryRequest, owner: string): Promise<CategoryMutationResponse> {
  const request = requestObject(input);
  const id = categoryId(request.category_id);
  const expected = expectedTimestamp(request.expected_updated_at);
  const name = normalizeCategoryName(request.name);
  const ref = db.collection("categories").doc(id);
  await db.runTransaction(async (transaction) => {
    const category = ownedCategory(await transaction.get(ref), owner);
    if (!category.updated_at.isEqual(expected)) throw new ApiError("CONFLICT");
    if (category.name === name.name) return;
    if (category.is_default) throw new ApiError("INVALID_ARGUMENT");
    if (category.normalized_name !== name.normalized_name) {
      const newGuard = await ensureGuardAvailable(transaction, owner, name.normalized_name, id);
      const oldGuard = nameGuard(owner, category.normalized_name);
      const old = await transaction.get(oldGuard);
      if (old.exists && (old.get("category_id") !== id || old.get("owner_email") !== owner ||
          old.get("normalized_name") !== category.normalized_name)) throw new ApiError("INTERNAL");
      transaction.set(newGuard, { owner_email: owner, normalized_name: name.normalized_name, category_id: id });
      if (old.exists) transaction.delete(oldGuard);
    }
    transaction.update(ref, { ...name, updated_at: FieldValue.serverTimestamp() });
  });
  return mutationResponse(id, owner);
}
