import { deleteApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp, Query, type Transaction } from "firebase-admin/firestore";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { categoryTimestamp, DEFAULT_CATEGORY_NAMES } from "./category-values.js";

const OWNER = "owner@example.com";
const OTHER = "other@example.com";

describe("Category Firestore operations", () => {
  let db: ReturnType<typeof getFirestore>;
  let create: typeof import("./create-category.js").createCategory;
  let rename: typeof import("./rename-category.js").renameCategory;
  let archive: typeof import("./set-category-archived.js").setCategoryArchived;
  let reset: typeof import("./reset-category-order.js").resetCategoryOrder;
  let register: typeof import("./complete-registration.js").completeRegistration;
  let guard: typeof import("./category-persistence.js").nameGuard;
  let metadata: typeof import("./category-persistence.js").ownerMetadata;

  beforeAll(async () => {
    if (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8080") throw new Error("Local Firestore emulator required");
    process.env.GCLOUD_PROJECT = "taskify-local";
    ({ createCategory: create } = await import("./create-category.js"));
    ({ renameCategory: rename } = await import("./rename-category.js"));
    ({ setCategoryArchived: archive } = await import("./set-category-archived.js"));
    ({ resetCategoryOrder: reset } = await import("./reset-category-order.js"));
    ({ completeRegistration: register } = await import("./complete-registration.js"));
    ({ nameGuard: guard, ownerMetadata: metadata } = await import("./category-persistence.js"));
    db = getFirestore();
  });
  beforeEach(async () => {
    const collections = await db.listCollections();
    await Promise.all(collections.map((collection) => db.recursiveDelete(collection)));
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => { await Promise.all(getApps().map((app) => deleteApp(app))); });

  const category = (id: string) => db.collection("categories").doc(id);
  const owned = (owner = OWNER) => db.collection("categories").where("owner_email", "==", owner).get();
  async function state() {
    const snapshot = await owned();
    return Object.fromEntries(snapshot.docs.map((doc) => [doc.id, doc.data()]));
  }
  async function seed(id: string, name: string, order: number, options: { owner?: string; archived?: boolean; default?: boolean } = {}) {
    const now = new Timestamp(1791360000, 123456000);
    await category(id).set({ owner_email: options.owner ?? OWNER, name, normalized_name: name.toLowerCase(),
      display_order: order, is_default: options.default ?? false, archived_at: options.archived ? now : null,
      created_at: now, updated_at: now });
    return categoryTimestamp(now);
  }

  it("creates the complete schema, protects trusted identity and appends after archived/foreign records correctly", async () => {
    await seed("old", "Old", 42, { archived: true });
    await seed("foreign", "Foreign", 999, { owner: OTHER });
    const result = await create({ name: "  Cafe\u0301  " , owner_email: OTHER, is_default: true } as never, OWNER);
    const stored = await category(result.category_id).get();
    expect(Object.keys(stored.data()!).sort()).toEqual(["archived_at", "created_at", "display_order", "is_default", "name", "normalized_name", "owner_email", "updated_at"]);
    expect(stored.data()).toMatchObject({ name: "Café", normalized_name: "café", owner_email: OWNER,
      display_order: 43, is_default: false, archived_at: null });
    expect(stored.get("created_at").isEqual(stored.get("updated_at"))).toBe(true);
    expect(result.updated_at).toBe(categoryTimestamp(stored.get("updated_at")));
    expect((await guard(OWNER, "café").get()).data()).toEqual({ owner_email: OWNER, normalized_name: "café", category_id: result.category_id });
  });
  it.each([false, true])("rejects duplicate names against active/archived records (%s), without guard dependence", async (archived) => {
    await seed("legacy", "Café", 0, { archived });
    await expect(create({ name: "CAFE\u0301" }, OWNER)).rejects.toMatchObject({ code: "DUPLICATE_ARGUMENT" });
    expect((await owned()).size).toBe(1);
    expect((await guard(OWNER, "café").get()).exists).toBe(false);
  });
  it("allows matching names for distinct owners", async () => {
    const a = await create({ name: "Same" }, OWNER);
    const b = await create({ name: "Same" }, OTHER);
    expect(a.category_id).not.toBe(b.category_id);
    expect((await owned()).size).toBe(1);
  });
  it("serializes concurrent same-name creations and appends different names", async () => {
    const results = await Promise.allSettled([create({ name: "Same" }, OWNER), create({ name: "SAME" }, OWNER)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected")).toMatchObject({ reason: { code: "DUPLICATE_ARGUMENT" } });
    await Promise.all([create({ name: "Next" }, OWNER), create({ name: "Last" }, OWNER)]);
    expect((await owned()).docs.map((doc) => doc.get("display_order")).sort()).toEqual([0, 1, 2]);
  });
  it("renames atomically, moves the guard, and preserves Category/Task identity", async () => {
    const original = await create({ name: "Original" }, OWNER);
    await db.collection("tasks").doc("task").set({ category_id: original.category_id, updated_at: new Timestamp(100, 0) });
    const beforeTask = (await db.collection("tasks").doc("task").get()).data();
    const renamed = await rename({ ...original, name: "Renamed", expected_updated_at: original.updated_at }, OWNER);
    expect(renamed.category_id).toBe(original.category_id);
    expect((await guard(OWNER, "original").get()).exists).toBe(false);
    expect((await guard(OWNER, "renamed").get()).get("category_id")).toBe(original.category_id);
    expect((await db.collection("tasks").doc("task").get()).data()).toEqual(beforeTask);
    await expect(create({ name: "Original" }, OWNER)).resolves.toHaveProperty("category_id");
  });
  it("treats casing-only edits as real, preserves the key, and rejects stale matching-state requests", async () => {
    const original = await create({ name: "Original" }, OWNER);
    const before = (await category(original.category_id).get()).data();
    const edited = await rename({ category_id: original.category_id, name: "ORIGINAL", expected_updated_at: original.updated_at }, OWNER);
    expect(edited.updated_at).not.toBe(original.updated_at);
    const after = (await category(original.category_id).get()).data()!;
    expect(after.normalized_name).toBe(before!.normalized_name);
    expect(after.created_at).toEqual(before!.created_at);
    expect((await guard(OWNER, "original").get()).get("category_id")).toBe(original.category_id);
    await expect(rename({ category_id: original.category_id, name: "ORIGINAL", expected_updated_at: original.updated_at }, OWNER))
      .rejects.toMatchObject({ code: "CONFLICT" });
    await expect(rename({ category_id: edited.category_id, name: " ORIGINAL ", expected_updated_at: edited.updated_at }, OWNER)).resolves.toEqual(edited);
    expect((await category(original.category_id).get()).data()).toEqual(after);
  });
  it("rejects duplicate rename, including archived targets, without changing either guard", async () => {
    const a = await create({ name: "Alpha" }, OWNER);
    const b = await create({ name: "Beta" }, OWNER);
    await archive({ category_id: b.category_id, archived: true, expected_updated_at: b.updated_at }, OWNER);
    const before = await state();
    await expect(rename({ category_id: a.category_id, name: "BETA", expected_updated_at: a.updated_at }, OWNER))
      .rejects.toMatchObject({ code: "DUPLICATE_ARGUMENT" });
    expect(await state()).toEqual(before);
    expect((await guard(OWNER, "alpha").get()).get("category_id")).toBe(a.category_id);
  });
  it("serializes competing renames to the same key", async () => {
    const a = await create({ name: "Alpha" }, OWNER);
    const b = await create({ name: "Beta" }, OWNER);
    const results = await Promise.allSettled([a, b].map((value) => rename({ category_id: value.category_id,
      expected_updated_at: value.updated_at, name: "Winner" }, OWNER)));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected")).toMatchObject({ reason: { code: "DUPLICATE_ARGUMENT" } });
    expect((await owned()).docs.filter((doc) => doc.get("normalized_name") === "winner")).toHaveLength(1);
  });
  it("archives/reactivates without releasing names, changing references, or refreshing no-op timestamps", async () => {
    const created = await create({ name: "Personal" }, OWNER);
    await db.collection("tasks").doc("task").set({ category_id: created.category_id });
    const archived = await archive({ category_id: created.category_id, archived: true, expected_updated_at: created.updated_at }, OWNER);
    const before = (await category(created.category_id).get()).data();
    await expect(archive({ category_id: created.category_id, archived: true, expected_updated_at: archived.updated_at }, OWNER)).resolves.toEqual(archived);
    expect((await category(created.category_id).get()).data()).toEqual(before);
    await expect(archive({ category_id: created.category_id, archived: true, expected_updated_at: created.updated_at }, OWNER)).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(create({ name: "Personal" }, OWNER)).rejects.toMatchObject({ code: "DUPLICATE_ARGUMENT" });
    const active = await archive({ category_id: created.category_id, archived: false, expected_updated_at: archived.updated_at }, OWNER);
    expect(active.category_id).toBe(created.category_id);
    expect((await category(created.category_id).get()).get("archived_at")).toBeNull();
    expect((await db.collection("tasks").doc("task").get()).get("category_id")).toBe(created.category_id);
  });
  it("protects default changes, permits matching-state no-ops, and checks stale tokens first", async () => {
    const timestamp = await seed("default", "Work", 0, { default: true });
    const before = await state();
    await expect(rename({ category_id: "default", name: "WORK", expected_updated_at: timestamp }, OWNER)).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    await expect(archive({ category_id: "default", archived: true, expected_updated_at: timestamp }, OWNER)).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    await expect(rename({ category_id: "default", name: " Work ", expected_updated_at: timestamp }, OWNER)).resolves.toMatchObject({ updated_at: timestamp });
    await expect(archive({ category_id: "default", archived: false, expected_updated_at: timestamp }, OWNER)).resolves.toMatchObject({ updated_at: timestamp });
    await expect(rename({ category_id: "default", name: "Work", expected_updated_at: "2026-10-07T00:00:00.000000000Z" }, OWNER)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await state()).toEqual(before);
  });
  it.each(["missing", "foreign"])("hides %s mutation targets", async (id) => {
    const timestamp = await seed("foreign", "Foreign", 0, { owner: OTHER });
    await expect(rename({ category_id: id, name: "Changed", expected_updated_at: timestamp }, OWNER)).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    await expect(archive({ category_id: id, archived: true, expected_updated_at: timestamp }, OWNER)).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    expect((await category("foreign").get()).get("name")).toBe("Foreign");
  });
  it("detects submillisecond conflicts even after a direct server-time reorder", async () => {
    const timestamp = await seed("precise", "Precise", 0);
    const previous = (await category("precise").get()).get("updated_at") as Timestamp;
    await category("precise").update({ display_order: 4, updated_at: new Timestamp(previous.seconds, previous.nanoseconds + 1000) });
    await expect(rename({ category_id: "precise", name: "Precise", expected_updated_at: timestamp }, OWNER)).rejects.toMatchObject({ code: "CONFLICT" });
    const now = categoryTimestamp((await category("precise").get()).get("updated_at"));
    await expect(rename({ category_id: "precise", name: "Precise", expected_updated_at: now }, OWNER)).resolves.toMatchObject({ updated_at: now });
  });
  it("provisions exactly 13 defaults once, retaining IDs/state under concurrent completion and later retries", async () => {
    const [first, concurrent] = await Promise.all([register({}, OWNER), register({}, OWNER)]);
    expect(concurrent).toEqual(first);
    const snapshot = await owned();
    expect(snapshot.size).toBe(13);
    expect(first.category_ids.map((id) => snapshot.docs.find((doc) => doc.id === id)!.get("name"))).toEqual([...DEFAULT_CATEGORY_NAMES]);
    expect(first.category_ids.map((id) => snapshot.docs.find((doc) => doc.id === id)!.get("display_order"))).toEqual(Array.from({ length: 13 }, (_, i) => i));
    for (const doc of snapshot.docs) {
      expect(doc.get("is_default")).toBe(true);
      expect(doc.get("archived_at")).toBeNull();
      expect((await guard(OWNER, doc.get("normalized_name")).get()).get("category_id")).toBe(doc.id);
    }
    await category(first.category_ids[0]!).update({ display_order: 99 });
    const before = await state();
    const marker = (await metadata(OWNER).get()).data();
    await expect(register({}, OWNER)).resolves.toEqual(first);
    expect(await state()).toEqual(before);
    expect((await metadata(OWNER).get()).data()).toEqual(marker);
  });
  it("does not overwrite a preexisting default-name custom Category or provision partial defaults", async () => {
    await create({ name: "Work" }, OWNER);
    const before = await state();
    await expect(register({}, OWNER)).rejects.toMatchObject({ code: "DUPLICATE_ARGUMENT" });
    expect(await state()).toEqual(before);
    expect((await metadata(OWNER).get()).get("registration_completed_at")).toBeUndefined();
  });
  it("does not make registration retries a default repair endpoint", async () => {
    const provisioned = await register({}, OWNER);
    await category(provisioned.category_ids[0]!).delete();
    await register({}, OWNER);
    expect((await owned()).size).toBe(12);
    await reset({}, OWNER);
    expect((await owned()).size).toBe(12);
  });
  it("returns empty Reset without provisioning or creating metadata", async () => {
    await expect(reset({}, OWNER)).resolves.toEqual({ changed_count: 0, categories: [] });
    expect((await metadata(OWNER).get()).exists).toBe(false);
    expect((await owned()).empty).toBe(true);
  });
  it("keeps gaps and every timestamp when effective order is already alphabetical", async () => {
    await seed("b", "Beta", 17, { archived: true });
    await seed("a", "Alpha", -3, { default: true });
    const before = await state();
    const result = await reset({}, OWNER);
    expect(result.changed_count).toBe(0);
    expect(result.categories.map((entry) => [entry.category_id, entry.display_order])).toEqual([["a", -3], ["b", 17]]);
    expect(await state()).toEqual(before);
  });
  it("resets defaults/custom/archived together, updating only changed positions and preserving Task references", async () => {
    await seed("alpha", "Alpha", 2, { archived: true });
    await seed("beta", "Beta", 1, { default: true });
    await seed("gamma", "Gamma", 0);
    await seed("foreign", "Foreign", 5, { owner: OTHER });
    await db.collection("tasks").doc("task").set({ category_id: "alpha", updated_at: new Timestamp(123, 0) });
    const before = await state();
    const task = (await db.collection("tasks").doc("task").get()).data();
    const result = await reset({}, OWNER);
    expect(result.changed_count).toBe(2);
    expect(result.categories.map((entry) => [entry.category_id, entry.display_order])).toEqual([["alpha", 0], ["beta", 1], ["gamma", 2]]);
    const after = await state();
    for (const id of ["alpha", "beta", "gamma"]) {
      const { display_order: oldOrder, updated_at: oldTimestamp, ...oldFields } = before[id]!;
      const { display_order: newOrder, updated_at: newTimestamp, ...newFields } = after[id]!;
      expect(newFields).toEqual(oldFields);
      if (id === "beta") expect(newTimestamp).toEqual(oldTimestamp);
      else expect(newTimestamp).not.toEqual(oldTimestamp);
      expect(result.categories.find((entry) => entry.category_id === id)!.updated_at).toBe(categoryTimestamp(newTimestamp));
    }
    expect((await db.collection("tasks").doc("task").get()).data()).toEqual(task);
    expect((await category("foreign").get()).get("display_order")).toBe(5);
    await expect(reset({}, OWNER)).resolves.toMatchObject({ changed_count: 0 });
    expect(await state()).toEqual(after);
  });
  it("uses ID tie-breakers for equal order/key values and deterministic Unicode code-point sorting", async () => {
    await seed("z", "same", 0);
    await seed("a", "same", 0);
    await seed("emoji", "😀", -1);
    await seed("private", "\uE000", 10);
    const result = await reset({}, OWNER);
    expect(result.categories.map((entry) => entry.category_id)).toEqual(["a", "z", "private", "emoji"]);
    expect(result.categories.map((entry) => entry.display_order)).toEqual([0, 1, 2, 3]);
  });
  it("rolls back every Reset write on a real commit-time failure", async () => {
    await seed("a", "Alpha", 1);
    await seed("b", "Beta", 0);
    const before = await state();
    const original = db.runTransaction.bind(db);
    vi.spyOn(db, "runTransaction").mockImplementation(((callback: (tx: Transaction) => Promise<unknown>) => original(async (tx) => {
      const result = await callback(tx);
      tx.update(category("nonexistent"), { display_order: 99 });
      return result;
    })) as typeof db.runTransaction);
    await expect(reset({}, OWNER)).rejects.toBeDefined();
    expect(await state()).toEqual(before);
  });
  it("retries Reset against current membership and counts only writes from the successful attempt", async () => {
    await seed("a", "Alpha", 2);
    await seed("b", "Beta", 0);
    const original = db.runTransaction.bind(db);
    let attempts = 0;
    vi.spyOn(db, "runTransaction").mockImplementation(((callback: (tx: Transaction) => Promise<unknown>) => original(async (tx) => {
      attempts++;
      // Simulate a membership change between the aborted transaction and its next snapshot.
      if (attempts === 2) {
        await seed("c", "Aardvark", 3, { archived: true });
        await metadata(OWNER).set({ owner_email: OWNER, membership_revision: 1 });
      }
      const result = await callback(tx);
      if (attempts === 1) throw Object.assign(new Error("Injected retry after queued writes"), { code: 10 });
      return result;
    })) as typeof db.runTransaction);
    const result = await reset({}, OWNER);
    expect(attempts).toBe(2);
    expect(result.changed_count).toBe(3);
    expect(result.categories.map((entry) => [entry.category_id, entry.display_order])).toEqual([["c", 0], ["a", 1], ["b", 2]]);
    expect((await category("c").get()).get("archived_at")).not.toBeNull();
  });
  it("preserves a serial outcome under concurrent creation and Reset", async () => {
    await create({ name: "Zulu" }, OWNER);
    await create({ name: "Beta" }, OWNER);
    const [created, result] = await Promise.all([create({ name: "Alpha" }, OWNER), reset({}, OWNER)]);
    const final = (await owned()).docs.sort((a, b) => a.get("display_order") - b.get("display_order"));
    expect(final).toHaveLength(3);
    expect([ ["Alpha", "Beta", "Zulu"], ["Beta", "Zulu", "Alpha"] ]).toContainEqual(final.map((doc) => doc.get("name")));
    expect(new Set(final.map((doc) => doc.get("display_order"))).size).toBe(3);
    expect(final.some((doc) => doc.id === created.category_id)).toBe(true);
    // Creation may commit after Reset's response snapshot; both serialization orders are permitted.
    expect(result.categories.map((entry) => entry.category_id)).toEqual(expect.arrayContaining(final.filter((doc) => doc.id !== created.category_id).map((doc) => doc.id)));
  });
  it("rolls back registration Categories, guards and completion on a real commit-time failure", async () => {
    const original = db.runTransaction.bind(db);
    vi.spyOn(db, "runTransaction").mockImplementation(((callback: (tx: Transaction) => Promise<unknown>) => original(async (tx) => {
      const result = await callback(tx);
      tx.update(category("nonexistent"), { display_order: 99 });
      return result;
    })) as typeof db.runTransaction);
    await expect(register({}, OWNER)).rejects.toBeDefined();
    expect((await owned()).empty).toBe(true);
    expect((await db.collection("category_name_guards").get()).empty).toBe(true);
    expect((await metadata(OWNER).get()).exists).toBe(false);
  });
  it("rejects malformed requests without writes", async () => {
    const original = await create({ name: "Custom" }, OWNER);
    const before = await state();
    for (const value of [null, {}, { name: " " }, { name: 3 }]) {
      await expect(create(value as never, OWNER)).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    }
    for (const value of [null, {}, { category_id: original.category_id, name: "Changed", expected_updated_at: "bad" }]) {
      await expect(rename(value as never, OWNER)).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    }
    await expect(archive({ category_id: original.category_id, archived: "yes", expected_updated_at: original.updated_at } as never, OWNER)).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    await expect(reset({ category_ids: [original.category_id] } as never, OWNER)).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    await expect(register(null as never, OWNER)).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    expect(await state()).toEqual(before);
  });

  it.each(["create", "rename", "archive"])("rolls back %s Category and guard mutations on a real commit-time failure", async (operation) => {
    const created = await create({ name: "Original" }, OWNER);
    const before = await state();
    const guards = (await db.collection("category_name_guards").get()).docs.map((doc) => [doc.id, doc.data()]);
    const marker = (await metadata(OWNER).get()).data();
    const original = db.runTransaction.bind(db);
    vi.spyOn(db, "runTransaction").mockImplementation(((callback: (tx: Transaction) => Promise<unknown>) => original(async (tx) => {
      const result = await callback(tx);
      tx.update(category("nonexistent"), { display_order: 99 });
      return result;
    })) as typeof db.runTransaction);
    const request = { category_id: created.category_id, expected_updated_at: created.updated_at };
    await expect(operation === "create" ? create({ name: "Added" }, OWNER) : operation === "rename" ?
      rename({ ...request, name: "Renamed" }, OWNER) : archive({ ...request, archived: true }, OWNER)).rejects.toBeDefined();
    expect(await state()).toEqual(before);
    expect((await db.collection("category_name_guards").get()).docs.map((doc) => [doc.id, doc.data()])).toEqual(guards);
    expect((await metadata(OWNER).get()).data()).toEqual(marker);
  });
  it.each(["create", "register"])("retries %s without duplicate IDs, guards or membership increments", async (operation) => {
    const original = db.runTransaction.bind(db);
    let attempts = 0;
    const ids: string[][] = [];
    vi.spyOn(db, "runTransaction").mockImplementation(((callback: (tx: Transaction) => Promise<unknown>) => original(async (tx) => {
      attempts++;
      const createWrite = tx.create.bind(tx);
      const attemptIds: string[] = [];
      const createSpy = vi.spyOn(tx, "create").mockImplementation(((ref, data) => {
        if (ref.parent.id === "categories") attemptIds.push(ref.id);
        return createWrite(ref, data);
      }) as typeof tx.create);
      let result: unknown;
      try { result = await callback(tx); }
      finally { createSpy.mockRestore(); }
      ids.push(attemptIds);
      if (attempts === 1) throw Object.assign(new Error("Injected ABORTED"), { code: 10 });
      return result;
    })) as typeof db.runTransaction);
    if (operation === "create") await create({ name: "Custom" }, OWNER);
    else await register({}, OWNER);
    expect(attempts).toBe(2);
    expect(ids[1]).toEqual(ids[0]);
    expect((await owned()).size).toBe(operation === "create" ? 1 : 13);
    expect((await db.collection("category_name_guards").get()).size).toBe(operation === "create" ? 1 : 13);
    expect((await metadata(OWNER).get()).get("membership_revision")).toBe(1);
  });
  it("allows either serial outcome for concurrent empty Reset and creation", async () => {
    const [result, created] = await Promise.all([reset({}, OWNER), create({ name: "Custom" }, OWNER)]);
    expect(result.changed_count).toBe(0);
    expect([[], [created.category_id]]).toContainEqual(result.categories.map((entry) => entry.category_id));
    expect((await category(created.category_id).get()).get("display_order")).toBe(0);
    expect((await owned()).size).toBe(1);
  });
  it("preserves concurrent rename/archive changes or returns stale-token conflicts during Reset", async () => {
    const a = await seed("a", "Alpha", 1);
    const b = await seed("b", "Beta", 0);
    const [resetResult, renameResult, archiveResult] = await Promise.allSettled([
      reset({}, OWNER), rename({ category_id: "b", name: "Aardvark", expected_updated_at: b }, OWNER),
      archive({ category_id: "a", archived: true, expected_updated_at: a }, OWNER),
    ]);
    expect(resetResult.status).toBe("fulfilled");
    const alpha = await category("a").get();
    const beta = await category("b").get();
    if (renameResult.status === "fulfilled") {
      expect(beta.get("name")).toBe("Aardvark");
      expect(beta.get("display_order")).toBe(0);
      expect(alpha.get("display_order")).toBe(1);
    } else {
      expect(renameResult.reason).toMatchObject({ code: "CONFLICT" });
      expect(beta.get("name")).toBe("Beta");
      expect(beta.get("display_order")).toBe(1);
      expect(alpha.get("display_order")).toBe(0);
    }
    if (archiveResult.status === "fulfilled") expect(alpha.get("archived_at")).not.toBeNull();
    else {
      expect(archiveResult.reason).toMatchObject({ code: "CONFLICT" });
      expect(alpha.get("archived_at")).toBeNull();
    }
  });
  it("does not partially mix a concurrent direct reorder batch with Reset", async () => {
    await seed("a", "Alpha", 1);
    await seed("b", "Beta", 0);
    const batch = db.batch();
    batch.update(category("a"), { display_order: 20, updated_at: Timestamp.now() });
    batch.update(category("b"), { display_order: 10, updated_at: Timestamp.now() });
    await Promise.all([reset({}, OWNER), batch.commit()]);
    const final = await state();
    expect([[0, 1], [20, 10]]).toContainEqual([final.a!.display_order, final.b!.display_order]);
  });
  it("returns a single authoritative post-commit snapshot when a later rename changes alphabetical order", async () => {
    await seed("a", "Alpha", 1);
    await seed("b", "Beta", 0);
    const original = Query.prototype.get;
    let observations = 0;
    vi.spyOn(Query.prototype, "get").mockImplementation(async function(this: Query) {
      observations++;
      if (observations === 1) {
        const snapshot = await category("a").get();
        await rename({ category_id: "a", name: "Zulu", expected_updated_at: categoryTimestamp(snapshot.get("updated_at")) }, OWNER);
      }
      return original.call(this);
    });
    const result = await reset({}, OWNER);
    expect(observations).toBe(1);
    expect(result.changed_count).toBe(2);
    expect(result.categories.map((entry) => [entry.category_id, entry.display_order])).toEqual([["b", 1], ["a", 0]]);
    expect(result.categories[1]!.updated_at).toBe(categoryTimestamp((await category("a").get()).get("updated_at")));
  });
  it("fails atomically when numeric order cannot accommodate appended entries", async () => {
    await seed("max", "Maximum", Number.MAX_VALUE);
    const before = await state();
    await expect(create({ name: "Custom" }, OWNER)).rejects.toMatchObject({ code: "INTERNAL" });
    await expect(register({}, OWNER)).rejects.toMatchObject({ code: "INTERNAL" });
    expect(await state()).toEqual(before);
    expect((await metadata(OWNER).get()).exists).toBe(false);
  });
  it("rejects registration when 13 sequential default positions exceed numeric precision", async () => {
    await seed("max", "Maximum", 2 ** 53 - 2);
    const before = await state();
    await expect(register({}, OWNER)).rejects.toMatchObject({ code: "INTERNAL" });
    expect(await state()).toEqual(before);
    expect((await db.collection("category_name_guards").get()).empty).toBe(true);
  });
  it("enforces Unicode uniqueness using complete values even for long graphemes on records without guards", async () => {
    const name = ("a" + "\u0301".repeat(1800)).normalize("NFC");
    expect(Buffer.byteLength(name)).toBeGreaterThan(1500);
    await seed("legacy", name, 0, { archived: true });
    await expect(create({ name: name.toUpperCase() }, OWNER)).rejects.toMatchObject({ code: "DUPLICATE_ARGUMENT" });
    const other = await create({ name: "Other" }, OWNER);
    await expect(rename({ category_id: other.category_id, name, expected_updated_at: other.updated_at }, OWNER))
      .rejects.toMatchObject({ code: "DUPLICATE_ARGUMENT" });
    const different = "b" + "\u0301".repeat(1800);
    const created = await create({ name: different }, OWNER);
    expect((await category(created.category_id).get()).get("name")).toBe(different.normalize("NFC"));
    await expect(create({ name: different }, OWNER)).rejects.toMatchObject({ code: "DUPLICATE_ARGUMENT" });
  });
});
