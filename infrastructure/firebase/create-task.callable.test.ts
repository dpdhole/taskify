import { createRequire } from "node:module";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, sendSignInLinkToEmail, signInWithEmailLink, signInWithCredential,
  GoogleAuthProvider, signOut } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions, httpsCallable } from "firebase/functions";
import { connectFirestoreEmulator, getFirestore, getDoc, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { createHash } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const PROJECT = "demo-taskify";
const AUTH = "http://127.0.0.1:9099";
const HTTP = `http://127.0.0.1:5001/${PROJECT}/us-central1/createTask`;
const EMAIL = "owner@example.com";
const require = createRequire(new URL("../../apps/api/package.json", import.meta.url));
const { initializeApp: initializeAdminApp, deleteApp: deleteAdminApp } = require("firebase-admin/app");
const { getFirestore: getAdminFirestore } = require("firebase-admin/firestore");

describe("createTask callable HTTP transport", () => {
  let owner: FirebaseApp;
  let guest: FirebaseApp;
  let adminApp: ReturnType<typeof initializeAdminApp>;
  let db: ReturnType<typeof getAdminFirestore>;
  const request = { title: "  HTTP task  ", description_md: "", category_id: "personal" };
  const call = (app: FirebaseApp, data: unknown) => httpsCallable(getFunctions(app), "createTask")(data);

  beforeAll(async () => {
    if (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8080" || process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9099") {
      throw new Error("Callable tests require local Firestore and Auth emulators");
    }
    const hub = await (await fetch("http://127.0.0.1:4400/emulators")).json();
    for (const [name, port] of [["auth", 9099], ["functions", 5001], ["firestore", 8080]] as const) {
      expect(hub[name]?.port).toBe(port);
    }
    function client(name: string) {
      const app = initializeApp({ projectId: PROJECT, apiKey: "demo-taskify-key", authDomain: `${PROJECT}.firebaseapp.com` }, name);
      connectAuthEmulator(getAuth(app), AUTH, { disableWarnings: true });
      connectFunctionsEmulator(getFunctions(app), "127.0.0.1", 5001);
      connectFirestoreEmulator(getFirestore(app), "127.0.0.1", 8080);
      return app;
    }
    owner = client("callable-owner"); guest = client("callable-guest");
    adminApp = initializeAdminApp({ projectId: PROJECT }, "callable-fixtures");
    db = getAdminFirestore(adminApp);
  });
  beforeEach(async () => {
    await Promise.all([signOut(getAuth(owner)), signOut(getAuth(guest))]);
    const clear = await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
    if (!clear.ok) throw new Error("Failed to clear local Firestore fixtures");
    const clearAuth = await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
    if (!clearAuth.ok) throw new Error("Failed to clear local Auth fixtures");
    await db.collection("categories").doc("personal").set({ owner_email: EMAIL, name: "Personal", normalized_name: "personal",
      display_order: 0, is_default: false, archived_at: null, created_at: new Date(), updated_at: new Date() });
  });
  afterAll(async () => {
    if (db) await db.terminate();
    if (adminApp) await deleteAdminApp(adminApp);
    await Promise.all([owner, guest].filter(Boolean).map((app) => deleteApp(app)));
  });

  async function emailLinkLogin() {
    await sendSignInLinkToEmail(getAuth(owner), "Owner@Example.COM", { url: "http://localhost", handleCodeInApp: true });
    const codes = await (await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/oobCodes`)).json();
    const code = codes.oobCodes.find((value: { email: string }) => value.email.toLowerCase() === EMAIL);
    expect(code?.oobLink).toBeTruthy();
    await signInWithEmailLink(getAuth(owner), "Owner@Example.COM", code.oobLink);
    expect(await getAuth(owner).currentUser?.getIdToken()).toBeTruthy();
  }
  async function emptyWrites() {
    expect((await db.collection("tasks").get()).empty).toBe(true);
    expect((await db.collectionGroup("threads").get()).empty).toBe(true);
  }

  it("uses the SDK email-link sign-in token and persists the canonical Task/thread", async () => {
    await emailLinkLogin();
    const { data } = await call(owner, request) as { data: { task_id: string; updated_at: string } };
    expect(data.task_id).toBeTruthy();
    const task = await getDoc(doc(getFirestore(owner), `tasks/${data.task_id}`));
    expect(task.data()).toMatchObject({ title: "HTTP task", owner_email: EMAIL, executor_email: EMAIL,
      created_by_email: EMAIL, lifecycle: { macro: "upcoming", micro: "planned" }, availability: "working" });
    expect(task.get("updated_at").toDate().toISOString()).toBe(data.updated_at);
    const thread = await getDoc(doc(getFirestore(owner), `tasks/${data.task_id}/threads/system_changes`));
    expect(thread.data()).toMatchObject({ type: "system_changes", subject: "System Changes", created_by_email: EMAIL });
  });
  it("accepts an Auth-emulator Google-provider token through the SDK", async () => {
    // Provider credential is explicitly a local emulator fixture, not real Google OAuth verification.
    await signInWithCredential(getAuth(owner), GoogleAuthProvider.credential(JSON.stringify({ sub: "google-owner",
      email: "Owner@Example.COM", email_verified: true })));
    const result = await call(owner, request) as { data: { task_id: string } };
    expect((await db.collection("tasks").doc(result.data.task_id).get()).get("owner_email")).toBe(EMAIL);
  });
  it("denies unauthenticated SDK calls without writes", async () => {
    await expect(call(guest, request)).rejects.toMatchObject({ code: "functions/unauthenticated", details: { code: "UNAUTHENTICATED" } });
    await emptyWrites();
  });
  it("ignores spoofed identity/protected state and derives timed date projections", async () => {
    await emailLinkLogin();
    const result = await call(owner, { ...request, owner_email: "spoof@example.com", created_by_email: "spoof@example.com",
      lifecycle: { macro: "completed", micro: "done" }, availability: "deleted", due_date: "2099-01-01",
      due: { date: "2026-10-07", has_time: true, time: "13:40", timezone: "Asia/Kolkata" } }) as { data: { task_id: string } };
    const task = await db.collection("tasks").doc(result.data.task_id).get();
    expect(task.data()).toMatchObject({ owner_email: EMAIL, created_by_email: EMAIL, availability: "working",
      lifecycle: { macro: "upcoming", micro: "planned" }, due_date: "2026-10-07" });
    expect(task.get("due.instant").toDate().toISOString()).toBe("2026-10-07T08:10:00.000Z");
  });
  it.each([null, {}, { ...request, title: 123 }, { ...request, priority: "yes" }, { ...request, start: false },
    { ...request, due: { date: "2026-10-07", has_time: 0, time: null, timezone: null } }])
    ("returns stable INVALID_ARGUMENT over the SDK for %j", async (input) => {
      await emailLinkLogin();
      await expect(call(owner, input)).rejects.toMatchObject({ code: "functions/invalid-argument", details: { code: "INVALID_ARGUMENT" } });
      await emptyWrites();
    });
  it.each(["missing", "foreign", "archived"])("rejects %s Category over the callable boundary", async (category) => {
    await emailLinkLogin();
    if (category !== "missing") await db.collection("categories").doc(category).set({
      owner_email: category === "foreign" ? "other@example.com" : EMAIL, archived_at: category === "archived" ? new Date() : null,
    });
    await expect(call(owner, { ...request, category_id: category })).rejects.toMatchObject({ code: "functions/invalid-argument", details: { code: "INVALID_ARGUMENT" } });
    await emptyWrites();
  });
  it("rejects a malformed callable HTTP envelope before applying business writes", async () => {
    await emailLinkLogin();
    const token = await getAuth(owner).currentUser!.getIdToken();
    const response = await fetch(HTTP, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ wrong: request }) });
    expect(response.status).toBe(400);
    expect((await response.json()).error.status).toBe("INVALID_ARGUMENT");
    await emptyWrites();
  });
  it("rejects an invalid bearer token before applying business writes", async () => {
    const response = await fetch(HTTP, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer invalid-token" }, body: JSON.stringify({ data: request }) });
    expect(response.status).toBe(401);
    expect((await response.json()).error.status).toBe("UNAUTHENTICATED");
    await emptyWrites();
  });

  const namedCall = <T>(name: string, data: unknown) => httpsCallable<unknown, T>(getFunctions(owner), name)(data).then((response) => response.data);
  type Mutation = { category_id: string; updated_at: string };
  type Reset = { changed_count: number; categories: Array<Mutation & { display_order: number }> };
  const precise = (value: { seconds: number; nanoseconds: number }) =>
    new Date(value.seconds * 1000).toISOString().replace(/\.\d{3}Z$/, `.${String(value.nanoseconds).padStart(9, "0")}Z`);

  it("creates a Category through HTTP, then creates a Task using its stable ID", async () => {
    await emailLinkLogin();
    const category = await namedCall<Mutation>("createCategory", { name: "  Cafe\u0301  ", owner_email: "spoof@example.com", is_default: true });
    const stored = await getDoc(doc(getFirestore(owner), `categories/${category.category_id}`));
    expect(stored.data()).toMatchObject({ name: "Café", normalized_name: "café", owner_email: EMAIL, display_order: 1, is_default: false });
    expect(category.updated_at).toBe(precise(stored.get("updated_at")));
    const task = await namedCall<{ task_id: string }>("createTask", { ...request, category_id: category.category_id });
    expect((await getDoc(doc(getFirestore(owner), `tasks/${task.task_id}`))).get("category_id")).toBe(category.category_id);
  });
  it("returns stable duplicate errors for active and archived names without reactivation", async () => {
    await emailLinkLogin();
    const category = await namedCall<Mutation>("createCategory", { name: "Custom" });
    await expect(namedCall("createCategory", { name: "CUSTOM" })).rejects.toMatchObject({
      code: "functions/already-exists", details: { code: "DUPLICATE_ARGUMENT" },
    });
    const archived = await namedCall<Mutation>("setCategoryArchived", { category_id: category.category_id, archived: true, expected_updated_at: category.updated_at });
    await expect(namedCall("createCategory", { name: "Custom" })).rejects.toMatchObject({
      code: "functions/already-exists", details: { code: "DUPLICATE_ARGUMENT" },
    });
    expect((await db.collection("categories").doc(category.category_id).get()).get("archived_at")).not.toBeNull();
    await expect(namedCall("renameCategory", { category_id: "personal", name: "CUSTOM", expected_updated_at: precise((await db.collection("categories").doc("personal").get()).get("updated_at")) }))
      .rejects.toMatchObject({ details: { code: "DUPLICATE_ARGUMENT" } });
    await namedCall("setCategoryArchived", { category_id: category.category_id, archived: false, expected_updated_at: archived.updated_at });
    expect((await db.collection("categories").doc(category.category_id).get()).get("archived_at")).toBeNull();
  });
  it("preserves matching-state timestamps and rejects stale tokens, including client server-time reorders", async () => {
    await emailLinkLogin();
    const category = await namedCall<Mutation>("createCategory", { name: "Custom" });
    await expect(namedCall("renameCategory", { category_id: category.category_id, name: " Custom ", expected_updated_at: category.updated_at })).resolves.toEqual(category);
    const renamed = await namedCall<Mutation>("renameCategory", { category_id: category.category_id, name: "CUSTOM", expected_updated_at: category.updated_at });
    await expect(namedCall("renameCategory", { category_id: category.category_id, name: "CUSTOM", expected_updated_at: category.updated_at }))
      .rejects.toMatchObject({ code: "functions/aborted", details: { code: "CONFLICT" } });
    const ref = doc(getFirestore(owner), `categories/${category.category_id}`);
    await updateDoc(ref, { display_order: 99, updated_at: serverTimestamp() });
    await expect(namedCall("setCategoryArchived", { category_id: category.category_id, archived: false, expected_updated_at: renamed.updated_at }))
      .rejects.toMatchObject({ details: { code: "CONFLICT" } });
    const current = precise((await getDoc(ref)).get("updated_at"));
    await expect(namedCall("setCategoryArchived", { category_id: category.category_id, archived: false, expected_updated_at: current }))
      .resolves.toEqual({ category_id: category.category_id, updated_at: current });
  });
  it("completes registration idempotently and protects default names/archive state over HTTP", async () => {
    await emailLinkLogin();
    await db.collection("categories").doc("personal").delete();
    const registered = await namedCall<{ category_ids: string[] }>("completeRegistration", {});
    expect(registered.category_ids).toHaveLength(13);
    await expect(namedCall("completeRegistration", {})).resolves.toEqual(registered);
    const first = await db.collection("categories").doc(registered.category_ids[0]!).get();
    const input = { category_id: first.id, expected_updated_at: precise(first.get("updated_at")) };
    await expect(namedCall("renameCategory", { ...input, name: "Changed" })).rejects.toMatchObject({ details: { code: "INVALID_ARGUMENT" } });
    await expect(namedCall("setCategoryArchived", { ...input, archived: true })).rejects.toMatchObject({ details: { code: "INVALID_ARGUMENT" } });
    await expect(namedCall("renameCategory", { ...input, name: first.get("name") })).resolves.toMatchObject({ updated_at: input.expected_updated_at });
    await expect(namedCall<Reset>("resetCategoryOrder", {})).resolves.toMatchObject({ changed_count: 0, categories: expect.any(Array) });
    expect((await db.collection("categories").get()).size).toBe(13);
  });
  it("returns alphabetical Reset IDs/order/precise timestamps, preserving archived entries and existing Task references", async () => {
    await emailLinkLogin();
    const zulu = await namedCall<Mutation>("createCategory", { name: "Zulu" });
    const alpha = await namedCall<Mutation>("createCategory", { name: "Alpha" });
    const task = await namedCall<{ task_id: string }>("createTask", { ...request, category_id: alpha.category_id });
    await namedCall("setCategoryArchived", { category_id: alpha.category_id, archived: true, expected_updated_at: alpha.updated_at });
    const result = await namedCall<Reset>("resetCategoryOrder", {});
    expect(Object.keys(result).sort()).toEqual(["categories", "changed_count"]);
    expect(result.changed_count).toBe(3);
    expect(result.categories.map((entry) => [entry.category_id, entry.display_order])).toEqual([[alpha.category_id, 0], ["personal", 1], [zulu.category_id, 2]]);
    for (const entry of result.categories) {
      expect(Object.keys(entry).sort()).toEqual(["category_id", "display_order", "updated_at"]);
      expect(entry.updated_at).toBe(precise((await db.collection("categories").doc(entry.category_id).get()).get("updated_at")));
    }
    expect((await db.collection("categories").doc(alpha.category_id).get()).get("archived_at")).not.toBeNull();
    expect((await db.collection("tasks").doc(task.task_id).get()).get("category_id")).toBe(alpha.category_id);
    await expect(namedCall<Reset>("resetCategoryOrder", {})).resolves.toEqual({ ...result, changed_count: 0 });
  });
  it.each(["createCategory", "renameCategory", "setCategoryArchived", "resetCategoryOrder", "completeRegistration"])
    ("denies unauthenticated %s HTTP calls", async (name) => {
      await expect(httpsCallable(getFunctions(guest), name)({})).rejects.toMatchObject({ code: "functions/unauthenticated", details: { code: "UNAUTHENTICATED" } });
      expect((await db.collection("categories").get()).size).toBe(1);
      expect((await db.collection("category_owner_metadata").get()).empty).toBe(true);
    });
  it("hides foreign/missing targets and rejects malformed Category requests over HTTP", async () => {
    await emailLinkLogin();
    await db.collection("categories").doc("foreign").set({ owner_email: "other@example.com" });
    for (const category_id of ["foreign", "missing", "nested/path"]) {
      await expect(namedCall("renameCategory", { category_id, name: "Changed", expected_updated_at: "2026-10-07T00:00:00.000000000Z" }))
        .rejects.toMatchObject({ details: { code: "INVALID_ARGUMENT" } });
    }
    for (const [name, input] of [["createCategory", { name: "a".repeat(16) }], ["renameCategory", {}],
      ["setCategoryArchived", { archived: "true" }], ["resetCategoryOrder", { owner_email: "spoof@example.com" }], ["completeRegistration", null]] as const) {
      await expect(namedCall(name, input)).rejects.toMatchObject({ details: { code: "INVALID_ARGUMENT" } });
    }
    expect((await db.collection("categories").get()).size).toBe(2);
  });
  it("keeps guards/registration metadata private and denies direct protected Category writes", async () => {
    await emailLinkLogin();
    const created = await namedCall<Mutation>("createCategory", { name: "Custom" });
    const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
    for (const path of [`category_name_guards/${hash([EMAIL, "custom"])}`, `category_owner_metadata/${hash(EMAIL)}`]) {
      const ref = doc(getFirestore(owner), path);
      await expect(getDoc(ref)).rejects.toMatchObject({ code: "permission-denied" });
      await expect(setDoc(ref, { owner_email: EMAIL })).rejects.toMatchObject({ code: "permission-denied" });
    }
    await expect(updateDoc(doc(getFirestore(owner), `categories/${created.category_id}`), { name: "Bypass", updated_at: serverTimestamp() }))
      .rejects.toMatchObject({ code: "permission-denied" });
  });
  it("accepts a 15-grapheme Unicode name over HTTP and permits ordinary client reorder", async () => {
    await emailLinkLogin();
    const name = "👩‍👩‍👧‍👦".repeat(15);
    const created = await namedCall<Mutation>("createCategory", { name });
    const ref = doc(getFirestore(owner), `categories/${created.category_id}`);
    await updateDoc(ref, { display_order: 25, updated_at: serverTimestamp() });
    const stored = await getDoc(ref);
    expect(stored.get("name")).toBe(name);
    expect(stored.get("display_order")).toBe(25);
    await expect(namedCall("renameCategory", { category_id: created.category_id, name, expected_updated_at: precise(stored.get("updated_at")) }))
      .resolves.toEqual({ category_id: created.category_id, updated_at: precise(stored.get("updated_at")) });
  });
});
