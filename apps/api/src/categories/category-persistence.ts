import { createHash } from "node:crypto";
import { Timestamp, type DocumentSnapshot, type Transaction } from "firebase-admin/firestore";
import { db } from "../persistence/firestore.js";
import { ApiError } from "../shared/errors.js";
import { categoryTimestamp, compareCodePoints } from "./category-values.js";

export interface Category {
  owner_email: string;
  name: string;
  normalized_name: string;
  display_order: number;
  is_default: boolean;
  archived_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const ownerMetadata = (owner: string) => db.collection("category_owner_metadata").doc(hash(owner));
export const nameGuard = (owner: string, name: string) => db.collection("category_name_guards").doc(hash([owner, name]));
export const ownedCategories = (owner: string) => db.collection("categories").where("owner_email", "==", owner);

export function ownedCategory(snapshot: DocumentSnapshot, owner: string): Category {
  if (!snapshot.exists || snapshot.get("owner_email") !== owner) throw new ApiError("INVALID_ARGUMENT");
  const value = snapshot.data() as Category;
  if (!(value.updated_at instanceof Timestamp) || !Number.isFinite(value.display_order)) throw new ApiError("INTERNAL");
  return value;
}

export function appendOrder(categories: DocumentSnapshot[]): number {
  if (!categories.length) return 0;
  const positions = categories.map((category) => category.get("display_order") as number);
  if (positions.some((value) => !Number.isFinite(value))) throw new ApiError("INTERNAL");
  const max = positions.reduce((maximum, position) => Math.max(maximum, position), -Infinity);
  const next = max + 1;
  if (!Number.isFinite(next) || next <= max) throw new ApiError("INTERNAL");
  return next;
}

export function alphabetical(left: DocumentSnapshot, right: DocumentSnapshot): number {
  return compareCodePoints(left.get("normalized_name"), right.get("normalized_name")) || compareCodePoints(left.id, right.id);
}

export function effectiveOrder(left: DocumentSnapshot, right: DocumentSnapshot): number {
  return left.get("display_order") - right.get("display_order") || compareCodePoints(left.id, right.id);
}

export async function ensureGuardAvailable(transaction: Transaction, owner: string, normalized: string, categoryId: string,
  categories?: readonly DocumentSnapshot[]) {
  const ref = nameGuard(owner, normalized);
  const guard = await transaction.get(ref);
  if (guard.exists) {
    if (guard.get("owner_email") !== owner || guard.get("normalized_name") !== normalized) throw new ApiError("INTERNAL");
    if (guard.get("category_id") !== categoryId) throw new ApiError("DUPLICATE_ARGUMENT");
  }
  // Also honor canonical Categories that predate guard creation. Guards are derived metadata.
  // Use complete field values, rather than querying potentially long Unicode uniqueness keys.
  const canonical = categories ?? (await transaction.get(ownedCategories(owner))).docs;
  if (canonical.some((category) => category.id !== categoryId && category.get("normalized_name") === normalized)) {
    throw new ApiError("DUPLICATE_ARGUMENT");
  }
  return ref;
}

export async function mutationResponse(categoryId: string, owner: string) {
  const snapshot = await db.collection("categories").doc(categoryId).get();
  const category = ownedCategory(snapshot, owner);
  return { category_id: categoryId, updated_at: categoryTimestamp(category.updated_at) };
}
