import type { ApiTimestamp } from "./timestamps.js";

export interface HideTaskUntilRequest {
  task_id: string;
  hidden_until: ApiTimestamp;
  expected_task_updated_at?: ApiTimestamp;
}
export interface ClearHiddenUntilRequest { task_id: string; }

export interface TaskStateMutationResponse {
  task_id: string;
  hidden_until: ApiTimestamp | null;
}
