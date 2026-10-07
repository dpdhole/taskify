import type { CompleteRegistrationRequest, CompleteRegistrationResponse } from "@taskify/api-contracts";
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { db } from "../persistence/firestore.js";
import { ApiError } from "../shared/errors.js";
import { DEFAULT_CATEGORY_NAMES, emptyRequest, normalizeCategoryName } from "./category-values.js";
import { appendOrder, ensureGuardAvailable, ownedCategories, ownerMetadata } from "./category-persistence.js";

export async function completeRegistration(input: CompleteRegistrationRequest, owner: string): Promise<CompleteRegistrationResponse> {
  emptyRequest(input);
  // Allocate once per invocation, outside retry callbacks. A winning completion marker is authoritative on retries.
  const defaults = DEFAULT_CATEGORY_NAMES.map((name) => ({ ref: db.collection("categories").doc(), ...normalizeCategoryName(name) }));
  return db.runTransaction(async (transaction) => {
    const metadataRef = ownerMetadata(owner);
    const metadata = await transaction.get(metadataRef);
    if (metadata.get("registration_completed_at")) return { category_ids: metadata.get("default_category_ids") as string[] };
    const existing = await transaction.get(ownedCategories(owner));
    const start = appendOrder(existing.docs);
    const positions = defaults.map((_, index) => start + index);
    if (positions.some((position, index) => !Number.isFinite(position) || (index > 0 && position <= positions[index - 1]!))) {
      throw new ApiError("INTERNAL");
    }
    const guards: DocumentReference[] = [];
    for (const category of defaults) guards.push(await ensureGuardAvailable(transaction, owner, category.normalized_name, category.ref.id, existing.docs));
    defaults.forEach((category, index) => {
      transaction.create(category.ref, { owner_email: owner, name: category.name, normalized_name: category.normalized_name,
        display_order: positions[index]!, is_default: true, archived_at: null,
        created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp() });
      transaction.create(guards[index]!, { owner_email: owner, normalized_name: category.normalized_name, category_id: category.ref.id });
    });
    const category_ids = defaults.map((category) => category.ref.id);
    transaction.set(metadataRef, { owner_email: owner, membership_revision: FieldValue.increment(1),
      registration_completed_at: FieldValue.serverTimestamp(), default_category_ids: category_ids }, { merge: true });
    return { category_ids };
  });
}
