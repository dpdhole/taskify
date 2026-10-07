export interface HideTaskUntilRequest {
  task_id: string;
  hidden_until: string;
  expected_task_updated_at?: string;
}

export interface ClearHiddenUntilRequest {
  task_id: string;
}
