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
export type ResetCategoriesToDefaultsRequest = Record<string, never>;

export interface CategoryMutationResponse {
  category_id: string;
  updated_at: ApiTimestamp;
}
