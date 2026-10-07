import type { ResetCategoryOrderRequest, ResetCategoryOrderResponse } from "@taskify/api-contracts";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../persistence/firestore.js";
import { categoryTimestamp, emptyRequest } from "./category-values.js";
import { alphabetical, effectiveOrder, ownedCategories, ownedCategory, ownerMetadata } from "./category-persistence.js";

export async function resetCategoryOrder(input: ResetCategoryOrderRequest, owner: string): Promise<ResetCategoryOrderResponse> {
  emptyRequest(input);
  const changed_count = await db.runTransaction(async (transaction) => {
    // Trusted membership additions write this document, including the empty-set case.
    await transaction.get(ownerMetadata(owner));
    const snapshot = await transaction.get(ownedCategories(owner));
    const sorted = [...snapshot.docs].sort(alphabetical);
    const current = [...snapshot.docs].sort(effectiveOrder);
    if (sorted.every((category, index) => category.id === current[index]!.id)) return 0;
    let changed = 0;
    sorted.forEach((category, index) => {
      if (ownedCategory(category, owner).display_order !== index) {
        transaction.update(category.ref, { display_order: index, updated_at: FieldValue.serverTimestamp() });
        changed++;
      }
    });
    return changed;
  });
  // One query snapshot, rather than independent reads with different observation times.
  // A later concurrent mutation may be reflected here; changed_count belongs to our commit.
  const snapshot = await ownedCategories(owner).get();
  return { changed_count, categories: snapshot.docs.sort(alphabetical).map((category) => {
    const value = ownedCategory(category, owner);
    return { category_id: category.id, display_order: value.display_order, updated_at: categoryTimestamp(value.updated_at) };
  }) };
}
