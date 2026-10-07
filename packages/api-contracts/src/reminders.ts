import type { ApiTimestamp } from "./timestamps.js";

export interface CreateReminderRequest {
  task_id: string;
  remind_at: ApiTimestamp;
}
export interface UpdateReminderRequest {
  task_id: string;
  reminder_id: string;
  remind_at: ApiTimestamp;
}
export interface CancelReminderRequest {
  task_id: string;
  reminder_id: string;
}

export type ReminderDeliveryState = "scheduled" | "cancelled" | "delivered" | "failed";

export interface ReminderMutationResponse {
  task_id: string;
  reminder_id: string;
  remind_at: ApiTimestamp;
  delivery_state: ReminderDeliveryState;
  updated_at: ApiTimestamp;
}
