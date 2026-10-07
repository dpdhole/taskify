export interface CreateReminderRequest {
  task_id: string;
  remind_at: string;
}

export interface UpdateReminderRequest {
  task_id: string;
  reminder_id: string;
  remind_at: string;
}

export interface CancelReminderRequest {
  task_id: string;
  reminder_id: string;
}
