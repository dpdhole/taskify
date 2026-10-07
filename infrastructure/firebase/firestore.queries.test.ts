import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, collectionGroup, doc, getDocs, orderBy, query, setDoc, Timestamp, where, writeBatch,
  type QueryConstraint, type Firestore, type WhereFilterOp } from "firebase/firestore";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { queryContracts } from "./query-contracts.mjs";

const EMAIL = "owner@example.com";
const NOW = Date.parse("2026-10-07T08:00:00.000Z");
const DAY = 86400000;
const ts = (days: number) => Timestamp.fromMillis(NOW + days * DAY);
const parameters = { email: EMAIL, futureDate: "2026-11-06", pastBoundary: ts(-30), staleBoundary: ts(-60), now: ts(0), futureInstant: ts(30) };
const catalog = queryContracts(parameters);

function clientQuery(db: Firestore, spec: (typeof catalog)[number]) {
  const ref = spec.scope === "COLLECTION_GROUP" ? collectionGroup(db, spec.collection) : collection(db, spec.collection);
  const constraints: QueryConstraint[] = spec.filters.map(([field, op, value]) => where(field, op as WhereFilterOp, value));
  constraints.push(...spec.orderBy.map(([field, direction]) => orderBy(field, direction as "asc" | "desc")));
  return query(ref, ...constraints);
}

describe("documented preset candidate queries", () => {
  let env: RulesTestEnvironment;
  let db: Firestore;
  beforeAll(async () => {
    if (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8080") throw new Error("Query tests require the local emulator");
    env = await initializeTestEnvironment({ projectId: "taskify-local", firestore: { host: "127.0.0.1", port: 8080,
      rules: await readFile(new URL("./firestore.rules", import.meta.url), "utf8") } });
    db = env.authenticatedContext("owner", { email: EMAIL }).firestore();
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (context) => {
      const admin = context.firestore();
      const batch = writeBatch(admin);
      const base = { type: "task", title: "Query fixture", description_md: "", category_id: "personal", priority: false,
        lifecycle: { macro: "upcoming", micro: "planned" }, availability: "working",
        start: null, due: null, end: null, start_date: null, due_date: null, end_date: null,
        owner_email: EMAIL, executor_email: EMAIL, created_by_email: EMAIL, consultant_emails: [], informed_emails: [],
        parent_task_id: null, root_task_id: null, archived_at: null, deleted_at: null, purge_after: null, completed_at: null,
        created_at: ts(-1), updated_at: ts(-1) };
      const date = (value: string) => ({ date: value, has_time: false, time: null, timezone: null, instant: null });
      const fixtures: Record<string, Record<string, unknown>> = {
        overdue: { due_date: "2026-09-01", due: date("2026-09-01") },
        boundary: { due_date: "2026-11-06", due: date("2026-11-06") },
        beyond: { due_date: "2026-11-07", due: date("2026-11-07") },
        someday: {},
        old: { created_at: ts(-31), updated_at: ts(-61) },
        "plan-boundary": { created_at: ts(-30), updated_at: ts(-60) },
        waiting: { lifecycle: { macro: "active", micro: "waiting" }, created_at: ts(-100), updated_at: ts(-100) },
        blocked: { lifecycle: { macro: "active", micro: "blocked" } },
        hold: { lifecycle: { macro: "active", micro: "on_hold" } },
        done: { lifecycle: { macro: "completed", micro: "done" }, completed_at: ts(-30) },
        "done-old": { lifecycle: { macro: "completed", micro: "done" }, completed_at: ts(-31) },
        archived: { archived_at: ts(-30), availability: "archived" },
        "archived-old": { archived_at: ts(-31), availability: "archived" },
        deleted: { deleted_at: ts(-5), purge_after: ts(1), availability: "deleted" },
        "deleted-boundary": { deleted_at: ts(-30), purge_after: ts(2), availability: "deleted" },
        "deleted-tie": { deleted_at: ts(-5), purge_after: ts(2), availability: "deleted" },
        "deleted-old": { deleted_at: ts(-31), purge_after: ts(1), availability: "deleted" },
        expired: { deleted_at: ts(-1), purge_after: ts(0), availability: "deleted" },
        foreign: { owner_email: "other@example.com", executor_email: "other@example.com", created_by_email: "other@example.com", due_date: "2026-10-07", due: date("2026-10-07") },
      };
      for (const [id, patch] of Object.entries(fixtures)) batch.set(doc(admin, `tasks/${id}`), { ...base, ...patch });
      for (const [id, hidden_until, user_email] of [
        ["someday", ts(1), EMAIL], ["boundary", ts(30), EMAIL], ["beyond", ts(31), EMAIL],
        ["overdue", ts(0), EMAIL], ["foreign", ts(1), "other@example.com"],
      ] as const) batch.set(doc(admin, `tasks/${id}/states/${id === "foreign" ? "other" : "owner"}`),
        { task_id: id, user_email, hidden_until, created_at: ts(-1), updated_at: ts(-1) });
      for (const [id, user_email] of [["someday", EMAIL], ["foreign", "other@example.com"]]) {
        batch.set(doc(admin, `tasks/${id}/preferences/${id === "foreign" ? "other" : "owner"}`), {
          task_id: id, user_email, system_tags: { importance: null, urgency: null, dow: [], tod: [] }, created_at: ts(-1), updated_at: ts(-1),
        });
      }
      await batch.commit();
    });
  });
  afterAll(async () => { await env?.cleanup(); });

  const expected: Record<string, string[]> = {
    focus: ["overdue", "boundary"], resolve: ["waiting", "blocked", "hold"],
    "prioritize-dated": ["overdue", "boundary"],
    "prioritize-unspecified": ["someday", "old", "plan-boundary", "waiting", "blocked", "hold"],
    plan: ["someday", "plan-boundary", "blocked", "hold"],
    "follow-up": ["someday", "boundary"],
    "all-active": ["overdue", "boundary", "beyond", "someday", "plan-boundary", "blocked", "hold"],
    "all-active-include-stale": ["overdue", "boundary", "beyond", "someday", "old", "plan-boundary", "waiting", "blocked", "hold"],
    "recently-closed": ["done"], unarchive: ["archived"], recover: ["deleted", "deleted-tie", "deleted-boundary"],
    preferences: ["someday"], "active-hidden-state": ["someday", "boundary", "beyond"],
  };
  it.each(catalog)("retrieves the approved $name candidates under Rules", async (spec) => {
    const result = await assertSucceeds(getDocs(clientQuery(db, spec)));
    const ids = result.docs.map((record) => spec.scope === "COLLECTION_GROUP" ? record.get("task_id") : record.id);
    expect([...ids].sort()).toEqual([...expected[spec.name]].sort());
    if (spec.name === "recover") expect(ids).toEqual(expected.recover);
    if (["focus", "prioritize-dated", "follow-up"].includes(spec.name)) expect(ids).toEqual(expected[spec.name]);
  });
  it("keeps Prioritize's dated and Unspecified branches disjoint", async () => {
    const dated = await getDocs(clientQuery(db, catalog.find((item) => item.name === "prioritize-dated")!));
    const unspecified = await getDocs(clientQuery(db, catalog.find((item) => item.name === "prioritize-unspecified")!));
    const ids = [...dated.docs, ...unspecified.docs].map((record) => record.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("old");
    expect(ids).not.toContain("beyond");
  });
  it("expands Focus without introducing null Due or foreign/completed candidates", async () => {
    const expanded = queryContracts({ ...parameters, futureDate: "2026-11-07" })[0];
    expect((await getDocs(clientQuery(db, expanded))).docs.map((record) => record.id)).toEqual(["overdue", "boundary", "beyond"]);
  });
  it("expands Plan's extent while retaining unscheduled old work", async () => {
    const expanded = queryContracts({ ...parameters, pastBoundary: ts(-120) }).find((item) => item.name === "plan")!;
    const ids = (await getDocs(clientQuery(db, expanded))).docs.map((record) => record.id);
    expect(ids).toContain("old"); expect(ids).toContain("waiting"); expect(ids).not.toContain("done");
  });
  it("never includes expired recovery records when expanding history", async () => {
    const expanded = queryContracts({ ...parameters, pastBoundary: ts(-120) }).find((item) => item.name === "recover")!;
    const ids = (await getDocs(clientQuery(db, expanded))).docs.map((record) => record.id);
    expect(ids).toContain("deleted-old"); expect(ids).not.toContain("expired");
  });
  it.each(catalog)("denies $name without its identity predicate", async (spec) => {
    const unconstrained = { ...spec, filters: spec.filters.filter(([field]) => !["owner_email", "user_email"].includes(field)) };
    await assertFails(getDocs(clientQuery(db, unconstrained)));
  });
});

describe("index configuration contract (static, not a server query plan)", () => {
  it("loads eight unique composite definitions with the documented field order and scope", async () => {
    const config = JSON.parse(await readFile(new URL("./firestore.indexes.json", import.meta.url), "utf8"));
    expect(config.indexes).toHaveLength(8);
    const signatures = config.indexes.map((index: { collectionGroup: string; queryScope: string; fields: { fieldPath: string; order: string }[] }) =>
      `${index.collectionGroup}:${index.queryScope}:${index.fields.map((field) => `${field.fieldPath}=${field.order}`).join(",")}`);
    expect(new Set(signatures).size).toBe(8);
    expect(signatures).toContain("tasks:COLLECTION:owner_email=ASCENDING,availability=ASCENDING,deleted_at=DESCENDING,purge_after=ASCENDING");
    expect(signatures).toContain("states:COLLECTION_GROUP:user_email=ASCENDING,hidden_until=ASCENDING");
    expect(config.indexes.filter((index: { collectionGroup: string; fields: { fieldPath: string }[] }) =>
      index.collectionGroup === "tasks" && index.fields.map((field) => field.fieldPath).join(",") === "owner_email,availability,lifecycle.macro,due_date")).toHaveLength(1);
    const firebase = JSON.parse(await readFile(new URL("../../firebase.json", import.meta.url), "utf8"));
    expect(firebase.firestore.indexes).toBe("infrastructure/firebase/firestore.indexes.json");
  });
  it("enables preference collection-group equality indexing while preserving collection defaults", async () => {
    const config = JSON.parse(await readFile(new URL("./firestore.indexes.json", import.meta.url), "utf8"));
    const field = config.fieldOverrides.find((item: { collectionGroup: string; fieldPath: string }) =>
      item.collectionGroup === "preferences" && item.fieldPath === "user_email");
    expect(field.indexes).toEqual(expect.arrayContaining([
      { order: "ASCENDING", queryScope: "COLLECTION_GROUP" },
      { order: "ASCENDING", queryScope: "COLLECTION" },
      { order: "DESCENDING", queryScope: "COLLECTION" },
      { arrayConfig: "CONTAINS", queryScope: "COLLECTION" },
    ]));
    expect(config.indexes.some((item: { collectionGroup: string }) => item.collectionGroup === "preferences")).toBe(false);
  });
});

describe("Query Explain runner local validation", () => {
  const script = fileURLToPath(new URL("./explain-queries.mjs", import.meta.url));
  const args = ["--project", "taskify-local", "--owner", "Owner@Example.COM", "--today", "2026-10-07",
    "--now", "2026-10-07T08:00:00.000Z", "--dry-run"];
  function run(extra: string[] = [], overrides: Record<string, string> = {}) {
    return spawnSync(process.execPath, [script, ...args, ...extra], {
      encoding: "utf8", env: { ...process.env, FIRESTORE_EMULATOR_HOST: "", ...overrides }, timeout: 10000,
    });
  }
  it("prints all 13 query definitions without claiming server plan evidence", () => {
    const result = run();
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.status).toBe("dry-run; no server plan evidence");
    expect(report.analyze).toBe(false);
    expect(report.queries).toHaveLength(13);
    expect(report.queries[0].filters[0]).toEqual(["owner_email", "==", EMAIL]);
  });
  it("requires an explicit project instead of deriving one from credentials", () => {
    const result = spawnSync(process.execPath, [script, "--owner", EMAIL, "--today", "2026-10-07", "--dry-run"], {
      encoding: "utf8", env: { ...process.env, FIRESTORE_EMULATOR_HOST: "" }, timeout: 10000,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Explicit project, owner, and today arguments are required");
  });
  it("rejects attempts to run real Query Explain against an emulator", () => {
    const result = run([], { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Real Query Explain requires the Firestore service");
  });
  it.each([
    [["--today", "2026-02-30"], "today must be a valid"],
    [["--far-days", "0"], "far-days and stale-days must be positive integers"],
    [["--now", "2026-10-07T08:00:00+05:30"], "now must be a canonical"],
    [["--analyze"], "dry-run and analyze cannot be combined"],
  ])("rejects invalid local arguments %j before service access", (extra, expected) => {
    const result = run(extra as string[]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(expected as string);
  });
});
