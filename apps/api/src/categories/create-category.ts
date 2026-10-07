import type { CategoryMutationResponse, CreateCategoryRequest } from "@taskify/api-contracts";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../persistence/firestore.js";
import { normalizeCategoryName, requestObject } from "./category-values.js";
import { appendOrder, ensureGuardAvailable, mutationResponse, ownedCategories, ownerMetadata } from "./category-persistence.js";

export async function createCategory(input: CreateCategoryRequest, owner: string): Promise<CategoryMutationResponse> {
  const name = normalizeCategoryName(requestObject(input).name);
  const ref = db.collection("categories").doc();
  await db.runTransaction(async (transaction) => {
    const metadata = ownerMetadata(owner);
    await transaction.get(metadata);
    const categories = await transaction.get(ownedCategories(owner));
    const guard = await ensureGuardAvailable(transaction, owner, name.normalized_name, ref.id, categories.docs);
    transaction.create(ref, { owner_email: owner, ...name, display_order: appendOrder(categories.docs),
      is_default: false, archived_at: null, created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp() });
    transaction.create(guard, { owner_email: owner, normalized_name: name.normalized_name, category_id: ref.id });
    transaction.set(metadata, { owner_email: owner, membership_revision: FieldValue.increment(1) }, { merge: true });
  });
  return mutationResponse(ref.id, owner);
}
