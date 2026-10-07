import type { CategoryMutationResponse, SetCategoryArchivedRequest } from "@taskify/api-contracts";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../persistence/firestore.js";
import { ApiError } from "../shared/errors.js";
import { categoryId, expectedTimestamp, requestObject } from "./category-values.js";
import { mutationResponse, ownedCategory } from "./category-persistence.js";

export async function setCategoryArchived(input: SetCategoryArchivedRequest, owner: string): Promise<CategoryMutationResponse> {
  const request = requestObject(input);
  const id = categoryId(request.category_id);
  const expected = expectedTimestamp(request.expected_updated_at);
  if (typeof request.archived !== "boolean") throw new ApiError("INVALID_ARGUMENT");
  const archived = request.archived;
  const ref = db.collection("categories").doc(id);
  await db.runTransaction(async (transaction) => {
    const category = ownedCategory(await transaction.get(ref), owner);
    if (!category.updated_at.isEqual(expected)) throw new ApiError("CONFLICT");
    if ((category.archived_at !== null) === archived) return;
    if (category.is_default) throw new ApiError("INVALID_ARGUMENT");
    transaction.update(ref, { archived_at: archived ? FieldValue.serverTimestamp() : null, updated_at: FieldValue.serverTimestamp() });
  });
  return mutationResponse(id, owner);
}
