export interface CreateCategoryRequest {
  name: string;
}

export interface RenameCategoryRequest {
  category_id: string;
  name: string;
  expected_updated_at: string;
}

export interface SetCategoryArchivedRequest {
  category_id: string;
  archived: boolean;
  expected_updated_at: string;
}

export type ResetCategoriesToDefaultsRequest = Record<string, never>;
