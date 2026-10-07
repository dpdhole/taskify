export const TASK_ACTIONS = [
  "start",
  "wait_for_input",
  "mark_blocked",
  "put_on_hold",
  "resume",
  "complete",
  "cancel",
  "mark_unable",
  "reopen",
  "archive",
  "restore_archive",
  "delete",
  "restore_delete",
] as const;

export type TaskAction = (typeof TASK_ACTIONS)[number];
