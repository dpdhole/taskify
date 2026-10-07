import type { CreateTaskRequest, TaskMutationResponse } from "@taskify/api-contracts";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../persistence/firestore.js";
import { ApiError } from "../shared/errors.js";
import { normalizeTaskDate } from "./task-dates.js";

export async function createTask(input: CreateTaskRequest, actorEmail: string): Promise<TaskMutationResponse> {
  const title = input.title.trim();
  if (!title || !input.category_id.trim() || typeof input.description_md !== "string") {
    throw new ApiError("INVALID_ARGUMENT");
  }

  const start = input.start ? normalizeTaskDate(input.start) : null;
  const due = input.due ? normalizeTaskDate(input.due) : null;
  const end = input.end ? normalizeTaskDate(input.end) : null;

  const taskRef = db.collection("tasks").doc();
  const categoryRef = db.collection("categories").doc(input.category_id);
  const threadRef = taskRef.collection("threads").doc("system_changes");
  const now = Timestamp.now();

  await db.runTransaction(async (transaction) => {
    const category = await transaction.get(categoryRef);
    if (!category.exists || category.get("owner_email") !== actorEmail || category.get("archived_at") !== null) {
      throw new ApiError("INVALID_ARGUMENT", "Invalid category");
    }

    transaction.create(taskRef, {
      type: "task",
      title,
      description_md: input.description_md,
      category_id: input.category_id,
      priority: input.priority ?? false,
      lifecycle: { macro: "upcoming", micro: "planned" },
      availability: "working",
      start,
      due,
      end,
      start_date: start?.date ?? null,
      due_date: due?.date ?? null,
      end_date: end?.date ?? null,
      owner_email: actorEmail,
      executor_email: actorEmail,
      created_by_email: actorEmail,
      consultant_emails: [],
      informed_emails: [],
      parent_task_id: null,
      root_task_id: null,
      archived_at: null,
      deleted_at: null,
      purge_after: null,
      completed_at: null,
      created_at: now,
      updated_at: now,
    });

    transaction.create(threadRef, {
      type: "system_changes",
      subject: "System Changes",
      created_by_email: actorEmail,
      created_at: now,
      updated_at: now,
    });
  });

  return { task_id: taskRef.id, updated_at: now.toDate().toISOString() };
}
