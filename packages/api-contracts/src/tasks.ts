import type { TaskAction } from "./task-actions.js";
import type { TaskDateInput } from "./task-dates.js";

export interface CreateTaskRequest {
  title: string;
  description_md: string;
  category_id: string;
  priority?: boolean;
  start?: TaskDateInput;
  due?: TaskDateInput;
  end?: TaskDateInput;
}

export interface UpdateTaskDatesRequest {
  task_id: string;
  expected_updated_at: string;
  start?: TaskDateInput | null;
  due?: TaskDateInput | null;
  end?: TaskDateInput | null;
}

export interface ExecuteTaskActionRequest {
  task_id: string;
  action: TaskAction;
  expected_updated_at: string;
  payload?: {
    reason?: string;
  };
}

export interface CreateSubtaskRequest {
  parent_task_id: string;
  expected_parent_updated_at: string;
  task: {
    title: string;
    description_md?: string;
    category_id: string;
    priority?: boolean;
    start?: TaskDateInput;
    due?: TaskDateInput;
    end?: TaskDateInput;
  };
}
