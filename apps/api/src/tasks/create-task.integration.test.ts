import { deleteApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import type { CreateTaskRequest } from "@taskify/api-contracts";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const PROJECT_ID = "taskify-local";
const ACTOR = "owner@example.com";

describe("createTask Firestore integration", () => {
  let createTask: typeof import("./create-task.js").createTask;
  let db: ReturnType<typeof getFirestore>;
  let callable: typeof import("../functions/tasks.js").createTask;

  beforeAll(async () => {
    if (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8080") {
      throw new Error("Integration tests require the configured local Firestore emulator");
    }
    process.env.GCLOUD_PROJECT = PROJECT_ID;
    ({ createTask } = await import("./create-task.js"));
    ({ createTask: callable } = await import("../functions/tasks.js"));
    db = getFirestore();
  });

  beforeEach(async () => {
    const collections = await db.listCollections();
    // Delete collection descendants too, including threads beneath missing Task documents.
    await Promise.all(collections.map((collection) => db.recursiveDelete(collection)));
  });

  afterEach(() => vi.restoreAllMocks());

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

  it("rejects a nonexistent category without creating a Task or thread", async () => {
    await expect(createTask({ title: "Task", description_md: "", category_id: "missing" }, ACTOR))
      .rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    expect((await db.collection("tasks").get()).empty).toBe(true);
    expect((await db.collectionGroup("threads").get()).empty).toBe(true);
  });

  it("persists all timed dates, scalar projections, priority, and matching timestamps", async () => {
    await db.collection("categories").doc("personal").set({ owner_email: ACTOR, archived_at: null });
    const result = await createTask({ title: "Timed", description_md: "", category_id: "personal", priority: true,
      start: { date: "2026-03-08", has_time: true, time: "01:30", timezone: "America/New_York" },
      due: { date: "2026-03-08", has_time: true, time: "03:30", timezone: "America/New_York" },
      end: { date: "2026-03-09", has_time: true, time: "13:40", timezone: "Asia/Kolkata" },
    }, ACTOR);
    const task = await db.collection("tasks").doc(result.task_id).get();
    expect(task.get("priority")).toBe(true);
    for (const [field, date, instant] of [
      ["start", "2026-03-08", "2026-03-08T06:30:00.000Z"],
      ["due", "2026-03-08", "2026-03-08T07:30:00.000Z"],
      ["end", "2026-03-09", "2026-03-09T08:10:00.000Z"],
    ]) {
      expect(task.get(`${field}_date`)).toBe(date);
      expect(task.get(`${field}.instant`)).toBeInstanceOf(Timestamp);
      expect(task.get(`${field}.instant`).toDate().toISOString()).toBe(instant);
    }
    const thread = await task.ref.collection("threads").doc("system_changes").get();
    for (const value of [task.get("created_at"), task.get("updated_at"), thread.get("created_at"), thread.get("updated_at")]) {
      expect(value).toBeInstanceOf(Timestamp);
      expect(value.toDate().toISOString()).toBe(result.updated_at);
    }
  });

  it("derives identity and protected root state from the authenticated callable context", async () => {
    await db.collection("categories").doc("personal").set({ owner_email: ACTOR, archived_at: null });
    const result = await callable.run({ data: { title: "Task", description_md: "", category_id: "personal",
      owner_email: "spoof@example.com", executor_email: "spoof@example.com", type: "event",
      lifecycle: { macro: "completed", micro: "done" }, due_date: "2099-01-01", parent_task_id: "spoof",
    }, auth: { uid: "owner", token: { email: "Owner@Example.COM" } } } as unknown as Parameters<typeof callable.run>[0]);
    const task = await db.collection("tasks").doc(result.task_id).get();
    expect(task.data()).toMatchObject({ owner_email: ACTOR, executor_email: ACTOR, created_by_email: ACTOR,
      type: "task", lifecycle: { macro: "upcoming", micro: "planned" }, parent_task_id: null, due_date: null });
  });

  it.each([
    ["null payload", null], ["missing title", { description_md: "", category_id: "personal" }],
    ["numeric title", { title: 123, description_md: "", category_id: "personal" }],
    ["blank title", { title: "  ", description_md: "", category_id: "personal" }],
    ["missing category", { title: "Task", description_md: "" }],
    ["numeric category", { title: "Task", description_md: "", category_id: 123 }],
    ["category path", { title: "Task", description_md: "", category_id: "personal/nested/id" }],
    ["array payload", []],
    ["missing description", { title: "Task", category_id: "personal" }],
    ["string priority", { title: "Task", description_md: "", category_id: "personal", priority: "yes" }],
    ["null priority", { title: "Task", description_md: "", category_id: "personal", priority: null }],
    ["false date", { title: "Task", description_md: "", category_id: "personal", start: false }],
    ["null date", { title: "Task", description_md: "", category_id: "personal", due: null }],
    ["array date", { title: "Task", description_md: "", category_id: "personal", end: [] }],
    ["invalid timezone", { title: "Task", description_md: "", category_id: "personal",
      due: { date: "2026-10-07", has_time: true, time: "12:30", timezone: "Not/AZone" } }],
    ["nonboolean has_time", { title: "Task", description_md: "", category_id: "personal",
      due: { date: "2026-10-07", has_time: 0, time: null, timezone: null } }],
    ["DST gap", { title: "Task", description_md: "", category_id: "personal",
      start: { date: "2026-03-08", has_time: true, time: "02:30", timezone: "America/New_York" } }],
  ])("returns INVALID_ARGUMENT and writes nothing for %s", async (_name, data) => {
    await db.collection("categories").doc("personal").set({ owner_email: ACTOR, archived_at: null });
    const request = { data, auth: { uid: "owner", token: { email: ACTOR } } } as unknown as Parameters<typeof callable.run>[0];
    const outcome = await callable.run(request).then(() => null, (error: unknown) => error);
    const tasks = await db.collection("tasks").get();
    const threads = await db.collectionGroup("threads").get();
    expect.soft(outcome).toMatchObject({ code: "invalid-argument", details: { code: "INVALID_ARGUMENT" } });
    expect.soft(tasks.empty).toBe(true);
    expect.soft(threads.empty).toBe(true);
  });

  it("rolls back the Task write when the thread create precondition fails", async () => {
    await db.collection("categories").doc("personal").set({ owner_email: ACTOR, archived_at: null });
    const runTransaction = db.runTransaction.bind(db);
    let taskId = "";
    vi.spyOn(db, "runTransaction").mockImplementation((update, options) => runTransaction(async (transaction) => {
      const create = transaction.create.bind(transaction);
      vi.spyOn(transaction, "create").mockImplementation((ref, data) => {
        if (ref.parent.id === "tasks") taskId = ref.id;
        return create(ref, data);
      });
      const result = await update(transaction);
      // Deliberately introduce a real commit-time conflict after both writes are queued.
      await db.collection("tasks").doc(taskId).collection("threads").doc("system_changes").set({ sentinel: true });
      return result;
    }, options));
    await expect(createTask({ title: "Rollback", description_md: "", category_id: "personal" }, ACTOR))
      .rejects.toBeDefined();
    expect(taskId).not.toBe("");
    expect((await db.collection("tasks").doc(taskId).get()).exists).toBe(false);
    expect((await db.collection("tasks").doc(taskId).collection("threads").doc("system_changes").get()).data())
      .toEqual({ sentinel: true });
  });

  it("retries an aborted transaction without duplicating Task or thread writes", async () => {
    await db.collection("categories").doc("personal").set({ owner_email: ACTOR, archived_at: null });
    const runTransaction = db.runTransaction.bind(db);
    const ids: string[] = [];
    let attempts = 0;
    vi.spyOn(db, "runTransaction").mockImplementation((update, options) => runTransaction(async (transaction) => {
      attempts++;
      const create = transaction.create.bind(transaction);
      const createSpy = vi.spyOn(transaction, "create").mockImplementation((ref, data) => {
        if (ref.parent.id === "tasks") ids.push(ref.id);
        return create(ref, data);
      });
      let result;
      try {
        result = await update(transaction);
      } finally {
        // The SDK reuses its Transaction instance across attempts.
        createSpy.mockRestore();
      }
      if (attempts === 1) throw Object.assign(new Error("Injected retryable abort"), { code: 10 });
      return result;
    }, options));
    const result = await createTask({ title: "Retry", description_md: "", category_id: "personal" } as CreateTaskRequest, ACTOR);
    expect(attempts).toBe(2);
    expect(ids).toEqual([result.task_id, result.task_id]);
    expect((await db.collection("tasks").get()).size).toBe(1);
    expect((await db.collectionGroup("threads").get()).size).toBe(1);
  });
});
