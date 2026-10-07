import { createRequire } from "node:module";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, sendSignInLinkToEmail, signInWithEmailLink, signInWithCredential,
  GoogleAuthProvider, signOut } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions, httpsCallable } from "firebase/functions";
import { connectFirestoreEmulator, getFirestore, getDoc, doc } from "firebase/firestore";
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
    await db.collection("categories").doc("personal").set({ owner_email: EMAIL, archived_at: null });
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
});
