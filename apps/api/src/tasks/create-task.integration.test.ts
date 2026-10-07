import { deleteApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const PROJECT_ID = "taskify-local";
const ACTOR = "owner@example.com";

describe("createTask Firestore integration", () => {
  let createTask: typeof import("./create-task.js").createTask;
  let db: ReturnType<typeof getFirestore>;

  beforeAll(async () => {
    process.env.GCLOUD_PROJECT = PROJECT_ID;
    ({ createTask } = await import("./create-task.js"));
    db = getFirestore();
  });

  beforeEach(async () => {
    const collections = await db.listCollections();
    await Promise.all(
      collections.map(async (collection) => {
        const snapshot = await collection.get();
        await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
      }),
    );
  });

  afterAll(async () => {
    await Promise.all(getApps().map((app) => deleteApp(app)));
  });

  it("creates the canonical root Task and System Changes thread atomically", async () => {
    const category = db.collection("categories").doc("personal");
    await category.set({
      owner_email: ACTOR,
      archived_at: null,
    });

    const result = await createTask(
      {
        title: "  Buy groceries  ",
        description_md: "Milk and bread",
        category_id: category.id,
        start: {
          date: "2026-10-08",
          has_time: false,
          time: null,
          timezone: null,
        },
      },
      ACTOR,
    );

    const task = await db.collection("tasks").doc(result.task_id).get();
    const thread = await task.ref.collection("threads").doc("system_changes").get();

    expect(task.data()).toMatchObject({
      type: "task",
      title: "Buy groceries",
      description_md: "Milk and bread",
      category_id: "personal",
      priority: false,
      lifecycle: { macro: "upcoming", micro: "planned" },
      availability: "working",
      start_date: "2026-10-08",
      due_date: null,
      end_date: null,
      owner_email: ACTOR,
      executor_email: ACTOR,
      created_by_email: ACTOR,
      consultant_emails: [],
      informed_emails: [],
      parent_task_id: null,
      root_task_id: null,
      archived_at: null,
      deleted_at: null,
      purge_after: null,
      completed_at: null,
    });
    expect(task.get("start")).toMatchObject({
      date: "2026-10-08",
      has_time: false,
      time: null,
      timezone: null,
      instant: null,
    });
    expect(thread.data()).toMatchObject({
      type: "system_changes",
      subject: "System Changes",
      created_by_email: ACTOR,
    });
    expect(result.updated_at).toBe(task.get("updated_at").toDate().toISOString());
  });

  it("rejects a category owned by another user without creating a Task", async () => {
    await db.collection("categories").doc("foreign").set({
      owner_email: "other@example.com",
      archived_at: null,
    });

    await expect(
      createTask(
        {
          title: "Should fail",
          description_md: "",
          category_id: "foreign",
        },
        ACTOR,
      ),
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });

    expect((await db.collection("tasks").get()).empty).toBe(true);
  });

  it("rejects an archived category without creating a Task", async () => {
    await db.collection("categories").doc("archived").set({
      owner_email: ACTOR,
      archived_at: new Date(),
    });

    await expect(
      createTask(
        {
          title: "Should fail",
          description_md: "",
          category_id: "archived",
        },
        ACTOR,
      ),
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });

    expect((await db.collection("tasks").get()).empty).toBe(true);
  });
});
