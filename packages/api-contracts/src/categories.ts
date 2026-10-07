import type { ApiTimestamp } from "./timestamps.js";

export interface CreateCategoryRequest { name: string; }
export interface RenameCategoryRequest {
  category_id: string;
  name: string;
  expected_updated_at: ApiTimestamp;
}
export interface SetCategoryArchivedRequest {
  category_id: string;
  archived: boolean;
  expected_updated_at: ApiTimestamp;
}
export type ResetCategoryOrderRequest = Record<string, never>;
export type CompleteRegistrationRequest = Record<string, never>;

export interface CompleteRegistrationResponse {
  /** Stable default IDs in catalogue order; completed retries return the same IDs. */
  category_ids: string[];
}

export interface ResetCategoryOrderResponse {
  /** Changes made by this invocation's successful transaction. */
  changed_count: number;
  /** One authoritative post-commit snapshot, alphabetically sorted; may include later mutations. */
  categories: Array<CategoryMutationResponse & { display_order: number }>;
}

export interface CategoryMutationResponse {
  category_id: string;
  updated_at: ApiTimestamp;
}
