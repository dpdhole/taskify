import { readFile } from "node:fs/promises";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, collectionGroup, deleteDoc, deleteField, doc, getDoc, getDocs, query,
  serverTimestamp, setDoc, Timestamp, updateDoc, where, writeBatch, type Firestore } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const EMAIL = "owner@example.com";
const OTHER = "other@example.com";
const TS = Timestamp.fromDate(new Date("2026-10-07T08:00:00Z"));
const tags = { importance: null, urgency: null, dow: [], tod: [] };
const task = {
  type: "task", title: "Task", description_md: "", category_id: "personal", priority: false,
  lifecycle: { macro: "upcoming", micro: "planned" }, availability: "working",
  start: null, due: null, end: null, start_date: null, due_date: null, end_date: null,
  owner_email: EMAIL, executor_email: EMAIL, created_by_email: EMAIL, consultant_emails: [], informed_emails: [],
  parent_task_id: null, root_task_id: null, archived_at: null, deleted_at: null, purge_after: null,
  completed_at: null, created_at: TS, updated_at: TS,
};
const profile = {
  uid: "owner", email: EMAIL, normalized_email: EMAIL, display_name: null, profile_picture_url: null,
  auth_provider: "password", timezone: "Asia/Kolkata", created_at: TS, updated_at: TS,
};
const category = {
  owner_email: EMAIL, name: "Personal", normalized_name: "personal", display_order: 0,
  is_default: false, archived_at: null, created_at: TS, updated_at: TS,
};
function preference(taskId = "owned", email = EMAIL) {
  return { task_id: taskId, user_email: email, system_tags: tags, created_at: TS, updated_at: TS };
}
const viewKeys = ["focus", "resolve", "prioritize", "plan", "follow_up", "all_active", "recently_closed", "unarchive", "recover"];
function view(viewKey = "focus") {
  const time = !["resolve", "all_active"].includes(viewKey);
  return { schema_version: 1, primary_organization: time ? "time" : "status",
    time_thresholds: time ? { near_days: 3, medium_days: 7, far_days: 15 } : null,
    stale_days: ["plan", "all_active"].includes(viewKey) ? 60 : null,
    filters: { category_ids: [], lifecycle_states: [], priority: null },
    sort: { field: "title", direction: "asc" }, remembered_at: serverTimestamp(), updated_at: serverTimestamp() };
}

describe("Firestore Security Rules", () => {
  let env: RulesTestEnvironment;
  let owner: Firestore;
  let other: Firestore;
  let guest: Firestore;

  beforeAll(async () => {
    if (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8080") {
      throw new Error("Rules tests require the configured local Firestore emulator");
    }
    env = await initializeTestEnvironment({ projectId: "taskify-local", firestore: {
      host: "127.0.0.1", port: 8080, rules: await readFile(new URL("./firestore.rules", import.meta.url), "utf8"),
    } });
    owner = env.authenticatedContext("owner", { email: "Owner@Example.COM", firebase: { sign_in_provider: "password" } }).firestore();
    other = env.authenticatedContext("other", { email: OTHER, firebase: { sign_in_provider: "password" } }).firestore();
    guest = env.unauthenticatedContext().firestore();
  });

  beforeEach(async () => {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      const batch = writeBatch(db);
      const fixtures: Record<string, Record<string, unknown>> = {
        "users/owner": profile,
        "users/other": { ...profile, uid: "other", email: OTHER, normalized_email: OTHER },
        "categories/personal": category,
        "categories/second": { ...category, name: "Second", normalized_name: "second" },
        "categories/archived": { ...category, archived_at: TS },
        "categories/foreign": { ...category, owner_email: OTHER },
        "tasks/owned": task,
        "tasks/foreign": { ...task, owner_email: OTHER, executor_email: OTHER, created_by_email: OTHER },
        "tasks/deleted": { ...task, deleted_at: TS, availability: "deleted", purge_after: Timestamp.fromMillis(TS.toMillis() + 86400000) },
        "tasks/archived": { ...task, category_id: "archived", archived_at: TS, availability: "archived" },
        "tasks/owned/preferences/owner": preference(),
        "tasks/foreign/preferences/other": preference("foreign", OTHER),
        "tasks/owned/states/owner": { task_id: "owned", user_email: EMAIL, hidden_until: TS, created_at: TS, updated_at: TS },
        "tasks/foreign/states/other": { task_id: "foreign", user_email: OTHER, hidden_until: TS, created_at: TS, updated_at: TS },
        "tasks/owned/reminders/own": { task_id: "owned", user_email: EMAIL, remind_at: TS,
          delivery_state: "scheduled", delivered_at: null, created_at: TS, updated_at: TS },
        "tasks/owned/reminders/other": { task_id: "owned", user_email: OTHER, remind_at: TS,
          delivery_state: "scheduled", delivered_at: null, created_at: TS, updated_at: TS },
        "tasks/owned/threads/system_changes": { type: "system_changes", subject: "System Changes", created_by_email: EMAIL, created_at: TS, updated_at: TS },
        "tasks/owned/threads/system_changes/entries/entry": { type: "system_change", actor_email: EMAIL, occurred_at: TS,
          action: "start", previous_state: null, new_state: null, reason: null, changes: {} },
        "unknown/doc": { value: "secret" },
        "tasks/owned/unknown/doc": { value: "secret" },
      };
      for (const [path, data] of Object.entries(fixtures)) batch.set(doc(db, path), data);
      await batch.commit();
    });
  });
  afterAll(async () => { await env?.cleanup(); });

  describe("profiles", () => {
    it("allows own profile reads and denies foreign/unauthenticated reads", async () => {
      await assertSucceeds(getDoc(doc(owner, "users/owner")));
      await assertFails(getDoc(doc(other, "users/owner")));
      await assertFails(getDoc(doc(guest, "users/owner")));
    });
    it("allows display-name and timezone edits with server timestamps", async () => {
      await assertSucceeds(updateDoc(doc(owner, "users/owner"), { display_name: "Owner", timezone: "UTC", updated_at: serverTimestamp() }));
    });
    it.each(["uid", "email", "normalized_email", "auth_provider", "profile_picture_url", "created_at"])
      ("denies mutation of profile %s", async (field) => {
        const value = field == "created_at" ? Timestamp.fromMillis(0) : "forged";
        await assertFails(updateDoc(doc(owner, "users/owner"), { [field]: value, updated_at: serverTimestamp() }));
      });
    it("denies foreign edits, profile deletion, and stale update timestamps", async () => {
      await assertFails(updateDoc(doc(other, "users/owner"), { display_name: "Other", updated_at: serverTimestamp() }));
      await assertFails(deleteDoc(doc(owner, "users/owner")));
      await assertFails(updateDoc(doc(owner, "users/owner"), { display_name: "Owner", updated_at: TS }));
    });
    it("allows profile creation matching authenticated UID/email/provider", async () => {
      await env.withSecurityRulesDisabled(async (context) => { await deleteDoc(doc(context.firestore(), "users/owner")); });
      await assertSucceeds(setDoc(doc(owner, "users/owner"), { ...profile, email: "Owner@Example.COM",
        created_at: serverTimestamp(), updated_at: serverTimestamp() }));
    });
    it.each([
      { uid: "other" }, { email: OTHER }, { normalized_email: OTHER }, { auth_provider: "google.com" },
      { profile_picture_url: "https://example.com/forged.png" }, { extra: "forged" }, { created_at: TS },
    ])("denies profile creation with forged identity/provenance %j", async (patch) => {
      await env.withSecurityRulesDisabled(async (context) => { await deleteDoc(doc(context.firestore(), "users/owner")); });
      await assertFails(setDoc(doc(owner, "users/owner"), { ...profile, email: "Owner@Example.COM",
        created_at: serverTimestamp(), updated_at: serverTimestamp(), ...patch }));
    });
    it("allows only the authenticated social-provider picture on creation", async () => {
      const social = env.authenticatedContext("social", { email: "social@example.com", picture: "https://example.com/provider.png",
        firebase: { sign_in_provider: "google.com" } }).firestore();
      const data = { ...profile, uid: "social", email: "social@example.com", normalized_email: "social@example.com",
        auth_provider: "google.com", profile_picture_url: "https://example.com/provider.png",
        created_at: serverTimestamp(), updated_at: serverTimestamp() };
      await assertFails(setDoc(doc(social, "users/social"), { ...data, profile_picture_url: "https://example.com/forged.png" }));
      await assertSucceeds(setDoc(doc(social, "users/social"), data));
    });
    it.each([{ timezone: "" }, { timezone: "invalid zone" }, { timezone: 123 }, { display_name: 123 }, { extra: true }])
      ("denies malformed editable profile values %j", async (patch) => {
        await assertFails(updateDoc(doc(owner, "users/owner"), { ...patch, updated_at: serverTimestamp() }));
      });
    it("enforces only the approved timezone shape, not registry membership", async () => {
      await assertSucceeds(updateDoc(doc(owner, "users/owner"), { timezone: "Not/AZone", updated_at: serverTimestamp() }));
    });
    it("denies anonymous/foreign profile creation and missing required fields", async () => {
      const data = { ...profile, created_at: serverTimestamp(), updated_at: serverTimestamp() };
      await assertFails(setDoc(doc(other, "users/new"), data));
      await assertFails(setDoc(doc(guest, "users/new"), data));
      await env.withSecurityRulesDisabled(async (context) => { await deleteDoc(doc(context.firestore(), "users/owner")); });
      await assertFails(setDoc(doc(owner, "users/owner"), { uid: "owner", email: EMAIL }));
    });
  });

  describe("Categories", () => {
    it("isolates reads by owner and accepts identity-constrained queries", async () => {
      await assertSucceeds(getDoc(doc(owner, "categories/personal")));
      await assertFails(getDoc(doc(other, "categories/personal")));
      await assertFails(getDoc(doc(guest, "categories/personal")));
      await assertSucceeds(getDocs(query(collection(owner, "categories"), where("owner_email", "==", EMAIL))));
      await assertFails(getDocs(collection(owner, "categories")));
    });
    it("allows reorder only with server updated_at", async () => {
      await assertSucceeds(updateDoc(doc(owner, "categories/personal"), { display_order: 5, updated_at: serverTimestamp() }));
      await assertFails(updateDoc(doc(owner, "categories/personal"), { display_order: 6, updated_at: TS }));
      await assertFails(updateDoc(doc(owner, "categories/personal"), { display_order: "6", updated_at: serverTimestamp() }));
    });
    it.each(["owner_email", "name", "normalized_name", "is_default", "archived_at", "created_at"])
      ("denies protected Category %s changes", async (field) => {
        await assertFails(updateDoc(doc(owner, "categories/personal"), { [field]: "forged", updated_at: serverTimestamp() }));
      });
    it("denies Category create/delete, foreign edits, and mixed protected reorder", async () => {
      await assertFails(setDoc(doc(owner, "categories/new"), { ...category, created_at: serverTimestamp(), updated_at: serverTimestamp() }));
      await assertFails(deleteDoc(doc(owner, "categories/personal")));
      await assertFails(updateDoc(doc(other, "categories/personal"), { display_order: 2, updated_at: serverTimestamp() }));
      await assertFails(updateDoc(doc(owner, "categories/personal"), { display_order: 2, name: "Changed", updated_at: serverTimestamp() }));
    });
  });

  describe("Tasks", () => {
    it("allows owner-only reads and owner-constrained queries", async () => {
      await assertSucceeds(getDoc(doc(owner, "tasks/owned")));
      await assertFails(getDoc(doc(other, "tasks/owned")));
      await assertFails(getDoc(doc(guest, "tasks/owned")));
      await assertSucceeds(getDocs(query(collection(owner, "tasks"), where("owner_email", "==", EMAIL))));
      await assertFails(getDocs(collection(owner, "tasks")));
    });
    it.each([ { title: "Edited" }, { description_md: "Markdown" }, { priority: true }, { category_id: "second" }, {} ])
      ("allows ordinary edits %j with server updated_at", async (patch) => {
        await assertSucceeds(updateDoc(doc(owner, "tasks/owned"), { ...patch, updated_at: serverTimestamp() }));
      });
    it("denies Task/subtask creation and physical deletion", async () => {
      await assertFails(setDoc(doc(owner, "tasks/new"), { ...task, created_at: serverTimestamp(), updated_at: serverTimestamp() }));
      await assertFails(setDoc(doc(owner, "tasks/child"), { ...task, parent_task_id: "owned", root_task_id: "owned" }));
      await assertFails(deleteDoc(doc(owner, "tasks/owned")));
    });
    it.each([
      ["type", "event"], ["start", { date: "2026-10-08", has_time: false, time: null, timezone: null, instant: null }],
      ["due", {}], ["end", {}], ["start_date", "2026-10-08"], ["due_date", "2026-10-08"], ["end_date", "2026-10-08"],
      ["lifecycle", { macro: "completed", micro: "done" }], ["availability", "archived"],
      ["owner_email", OTHER], ["executor_email", OTHER], ["created_by_email", OTHER],
      ["consultant_emails", [OTHER]], ["informed_emails", [OTHER]],
      ["parent_task_id", "foreign"], ["root_task_id", "foreign"],
      ["archived_at", TS], ["deleted_at", TS], ["purge_after", TS], ["completed_at", TS], ["created_at", "forged"],
    ])("denies protected Task field %s even in a mixed edit", async (field, value) => {
      await assertFails(updateDoc(doc(owner, "tasks/owned"), { [field as string]: value, title: "Also edited", updated_at: serverTimestamp() }));
    });
    it.each([ { title: "   " }, { description_md: 1 }, { priority: "yes" }, { extra: true }, { title: deleteField() }, { updated_at: TS } ])
      ("denies malformed ordinary edits %j", async (patch) => {
        await assertFails(updateDoc(doc(owner, "tasks/owned"), { updated_at: serverTimestamp(), ...patch }));
      });
    it("denies foreign and deleted-task edits", async () => {
      await assertFails(updateDoc(doc(other, "tasks/owned"), { title: "Foreign", updated_at: serverTimestamp() }));
      await assertFails(updateDoc(doc(owner, "tasks/deleted"), { title: "Deleted", updated_at: serverTimestamp() }));
    });
    it.each(["archived", "foreign", "missing"])("denies assignment to %s Category", async (category_id) => {
      await assertFails(updateDoc(doc(owner, "tasks/owned"), { category_id, updated_at: serverTimestamp() }));
    });
    it("allows an unchanged archived Category reference", async () => {
      await assertSucceeds(updateDoc(doc(owner, "tasks/archived"), { title: "Still valid", updated_at: serverTimestamp() }));
    });
  });

  describe("personal preferences", () => {
    it("allows own read/create/update/delete with canonical identity and server timestamps", async () => {
      await assertSucceeds(getDoc(doc(owner, "tasks/owned/preferences/owner")));
      await assertSucceeds(deleteDoc(doc(owner, "tasks/owned/preferences/owner")));
      await assertSucceeds(setDoc(doc(owner, "tasks/owned/preferences/owner"), { ...preference(), created_at: serverTimestamp(), updated_at: serverTimestamp() }));
      await assertSucceeds(updateDoc(doc(owner, "tasks/owned/preferences/owner"), { system_tags: { ...tags, importance: "important", dow: ["mon", "sun"] }, updated_at: serverTimestamp() }));
    });
    it("denies other UID writes, foreign/absent Task access and anonymous access", async () => {
      await assertFails(getDoc(doc(other, "tasks/owned/preferences/owner")));
      await assertFails(getDoc(doc(guest, "tasks/owned/preferences/owner")));
      for (const path of ["tasks/owned/preferences/other", "tasks/foreign/preferences/owner", "tasks/missing/preferences/owner"]) {
        await assertFails(setDoc(doc(owner, path), { ...preference(path.split("/")[1]), created_at: serverTimestamp(), updated_at: serverTimestamp() }));
      }
    });
    it.each(["task_id", "user_email", "created_at"])("denies preference %s identity/metadata mutation", async (field) => {
      await assertFails(updateDoc(doc(owner, "tasks/owned/preferences/owner"), { [field]: "forged", updated_at: serverTimestamp() }));
    });
    it.each([
      { ...tags, importance: "high" }, { ...tags, urgency: false }, { ...tags, dow: ["monday"] },
      { ...tags, tod: ["morning"] }, { ...tags, dow: ["mon", "mon"] }, { ...tags, tod: ["night", "night"] },
      { ...tags, dow: ["mon", "tue", "wed", "thu", "fri", "sat", "sun", "mon"] },
      { ...tags, tod: ["early_morning", "midmorning", "afternoon", "evening", "night", "night"] },
      { ...tags, extra: true }, { importance: null, urgency: null, dow: [] }, { ...tags, dow: "mon" },
    ])("denies invalid complete tag maps %j", async (system_tags) => {
      await assertFails(updateDoc(doc(owner, "tasks/owned/preferences/owner"), { system_tags, updated_at: serverTimestamp() }));
    });
    it("preserves explicit negative versus unclassified tags", async () => {
      await assertSucceeds(updateDoc(doc(owner, "tasks/owned/preferences/owner"), { system_tags: { ...tags, importance: "not_important", urgency: "not_urgent" }, updated_at: serverTimestamp() }));
      expect((await getDoc(doc(owner, "tasks/owned/preferences/owner"))).get("system_tags.importance")).toBe("not_important");
    });
    it("denies bad preference creation identity, missing fields and client timestamps", async () => {
      await assertSucceeds(deleteDoc(doc(owner, "tasks/owned/preferences/owner")));
      const data = { ...preference(), created_at: serverTimestamp(), updated_at: serverTimestamp() };
      for (const patch of [{ user_email: OTHER }, { task_id: "foreign" }, { created_at: TS }, { updated_at: TS }, { extra: true }]) {
        await assertFails(setDoc(doc(owner, "tasks/owned/preferences/owner"), { ...data, ...patch }));
      }
      await assertFails(setDoc(doc(owner, "tasks/owned/preferences/owner"), { task_id: "owned", user_email: EMAIL }));
    });
    it("denies preference field deletion and updates without a server timestamp", async () => {
      await assertFails(updateDoc(doc(owner, "tasks/owned/preferences/owner"), { system_tags: tags, updated_at: TS }));
      await assertFails(updateDoc(doc(owner, "tasks/owned/preferences/owner"), { system_tags: deleteField(), updated_at: serverTimestamp() }));
    });
  });

  describe("backend-owned personal state and reminders", () => {
    it.each(["tasks/owned/states/owner", "tasks/owned/reminders/own"])("isolates reads of %s", async (path) => {
      await assertSucceeds(getDoc(doc(owner, path)));
      await assertFails(getDoc(doc(other, path)));
      await assertFails(getDoc(doc(guest, path)));
    });
    it("denies a foreign reminder even to the Task owner", async () => {
      await assertFails(getDoc(doc(owner, "tasks/owned/reminders/other")));
    });
    it.each(["tasks/owned/states/owner", "tasks/owned/reminders/own"])("denies all direct mutations of %s", async (path) => {
      await assertFails(setDoc(doc(owner, `${path}-new`), { ...preference(), hidden_until: TS, remind_at: TS }));
      await assertFails(updateDoc(doc(owner, path), { delivery_state: "delivered", hidden_until: TS, updated_at: serverTimestamp() }));
      await assertFails(deleteDoc(doc(owner, path)));
    });
    it("denies direct gets of own private records under foreign Tasks and mismatched UIDs", async () => {
      const paths = ["tasks/foreign/states/owner", "tasks/foreign/reminders/own",
        "tasks/foreign/preferences/owner", "tasks/owned/states/other", "tasks/owned/preferences/other"];
      await env.withSecurityRulesDisabled(async (context) => {
        const batch = writeBatch(context.firestore());
        for (const path of paths) batch.set(doc(context.firestore(), path), { ...preference(path.split("/")[1]), hidden_until: TS });
        await batch.commit();
      });
      for (const path of paths) await assertFails(getDoc(doc(owner, path)));
    });
  });

  describe("System Changes", () => {
    it.each(["tasks/owned/threads/system_changes", "tasks/owned/threads/system_changes/entries/entry"])
      ("allows owner reads and denies every ordinary mutation of %s", async (path) => {
        await assertSucceeds(getDoc(doc(owner, path)));
        await assertFails(getDoc(doc(other, path)));
        await assertFails(getDoc(doc(guest, path)));
        await assertFails(setDoc(doc(owner, `${path}-new`), { type: "system_change" }));
        await assertFails(updateDoc(doc(owner, path), { updated_at: serverTimestamp() }));
        await assertFails(deleteDoc(doc(owner, path)));
      });
  });

  describe("remembered view preferences", () => {
    it.each(viewKeys)("accepts an approved complete %s snapshot and own Reset", async (key) => {
      const ref = doc(owner, `users/owner/view_preferences/${key}`);
      await assertSucceeds(setDoc(ref, view(key)));
      await assertSucceeds(getDoc(ref));
      await assertFails(getDoc(doc(other, ref.path)));
      await assertFails(getDoc(doc(guest, ref.path)));
      await assertFails(setDoc(doc(other, ref.path), view(key)));
      await assertFails(deleteDoc(doc(other, ref.path)));
      await assertSucceeds(setDoc(ref, { ...view(key), sort: { field: "priority", direction: "desc" } }));
      await assertSucceeds(deleteDoc(ref));
    });
    it.each(viewKeys)("permits Category and Status organization for %s", async (key) => {
      for (const primary_organization of ["category", "status"]) {
        await assertSucceeds(setDoc(doc(owner, `users/owner/view_preferences/${key}`), {
          ...view(key), primary_organization, time_thresholds: null,
          filters: { category_ids: ["personal", "archived"], lifecycle_states: [], priority: false },
        }));
      }
    });
    it.each([
      ["resolve", { primary_organization: "time", time_thresholds: { near_days: 1, medium_days: 2, far_days: 3 } }],
      ["all_active", { primary_organization: "time", time_thresholds: { near_days: 1, medium_days: 2, far_days: 3 } }],
      ["resolve", { time_thresholds: { near_days: 1, medium_days: 2, far_days: 3 } }],
      ["all_active", { time_thresholds: { near_days: 1, medium_days: 2, far_days: 3 } }],
      ["focus", { stale_days: 60 }], ["resolve", { stale_days: 60 }], ["prioritize", { stale_days: 60 }],
      ["follow_up", { stale_days: 60 }], ["recently_closed", { stale_days: 60 }], ["unarchive", { stale_days: 60 }], ["recover", { stale_days: 60 }],
      ["plan", { sort: { field: "due", direction: "asc" } }],
      ["plan", { stale_days: 0 }], ["all_active", { stale_days: -1 }],
      ["focus", { time_thresholds: null }],
    ])("denies unsupported capabilities for %s: %j", async (key, patch) => {
      await assertFails(setDoc(doc(owner, `users/owner/view_preferences/${key}`), { ...view(key as string), ...(patch as object) }));
    });
    it.each([
      { schema_version: 2 }, { primary_organization: "other" }, { extra: true },
      { remembered_at: TS }, { updated_at: TS },
      { time_thresholds: { near_days: 0, medium_days: 2, far_days: 3 } },
      { time_thresholds: { near_days: 2, medium_days: 2, far_days: 3 } },
      { time_thresholds: { near_days: 1, medium_days: 3, far_days: 2 } },
      { time_thresholds: { near_days: 1.5, medium_days: 2, far_days: 3 } },
      { time_thresholds: { near_days: 1, medium_days: 2, far_days: 3, extra: true } },
      { filters: { category_ids: ["foreign"], lifecycle_states: [], priority: null } },
      { filters: { category_ids: ["missing"], lifecycle_states: [], priority: null } },
      { filters: { category_ids: ["personal", "personal"], lifecycle_states: [], priority: null } },
      { filters: { category_ids: [], lifecycle_states: ["done"], priority: null } },
      { filters: { category_ids: [], lifecycle_states: ["planned", "planned"], priority: null } },
      { filters: { category_ids: [], lifecycle_states: [], priority: "high" } },
      { filters: { category_ids: [], lifecycle_states: [], priority: null, dow: ["mon"] } },
      { sort: { field: "unknown", direction: "asc" } }, { sort: { field: "title", direction: "up" } },
    ])("denies malformed full snapshots %j", async (patch) => {
      await assertFails(setDoc(doc(owner, "users/owner/view_preferences/focus"), { ...view(), ...patch }));
    });
    it("denies unknown presets and incomplete snapshots", async () => {
      await assertFails(setDoc(doc(owner, "users/owner/view_preferences/custom"), view()));
      await assertFails(setDoc(doc(owner, "users/owner/view_preferences/focus"), { schema_version: 1 }));
    });
    it("accepts 10 owned Category filters and rejects 11", async () => {
      const ids = Array.from({ length: 11 }, (_, index) => `cat-${index}`);
      await env.withSecurityRulesDisabled(async (context) => {
        const batch = writeBatch(context.firestore());
        for (const id of ids) batch.set(doc(context.firestore(), `categories/${id}`), category);
        await batch.commit();
      });
      for (const [count, assertion] of [[10, assertSucceeds], [11, assertFails]] as const) {
        await assertion(setDoc(doc(owner, "users/owner/view_preferences/focus"), { ...view(),
          filters: { category_ids: ids.slice(0, count), lifecycle_states: [], priority: null } }));
      }
    });
    it.each([
      ["resolve", "waiting"], ["recently_closed", "done"], ["focus", "planned"],
      ["unarchive", "done"], ["recover", "on_hold"], ["follow_up", "cancelled"],
    ])("accepts the approved %s lifecycle filter %s", async (key, state) => {
      await assertSucceeds(setDoc(doc(owner, `users/owner/view_preferences/${key}`), { ...view(key),
        filters: { category_ids: [], lifecycle_states: [state], priority: null } }));
    });
    it.each([["resolve", "planned"], ["recently_closed", "in_progress"], ["all_active", "done"], ["recover", "unknown"]])
      ("denies unsupported %s lifecycle filter %s", async (key, state) => {
        await assertFails(setDoc(doc(owner, `users/owner/view_preferences/${key}`), { ...view(key),
          filters: { category_ids: [], lifecycle_states: [state], priority: null } }));
      });
  });

  describe("collection groups and default deny", () => {
    it.each(["preferences", "states"])("applies the approved identity-only list exception to orphan %s records", async (name) => {
      await env.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), `tasks/missing/${name}/owner`), {
          ...preference("missing"), hidden_until: TS,
        });
      });
      await assertFails(getDoc(doc(owner, `tasks/missing/${name}/owner`)));
      const result = await assertSucceeds(getDocs(query(collectionGroup(owner, name), where("user_email", "==", EMAIL))));
      expect(result.size).toBe(2);
    });
    it.each(["preferences", "states"])("allows identity-constrained %s collection-group reads", async (name) => {
      const result = await assertSucceeds(getDocs(query(collectionGroup(owner, name), where("user_email", "==", EMAIL))));
      expect(result.size).toBe(1);
      expect(result.docs[0].get("user_email")).toBe(EMAIL);
    });
    it.each(["preferences", "states"])("denies unconstrained, foreign and anonymous %s queries", async (name) => {
      await assertFails(getDocs(collectionGroup(owner, name)));
      await assertFails(getDocs(query(collectionGroup(owner, name), where("user_email", "==", OTHER))));
      await assertFails(getDocs(query(collectionGroup(guest, name), where("user_email", "==", EMAIL))));
    });
    it("allows the approved bounded active Hide Until state query", async () => {
      const result = await assertSucceeds(getDocs(query(collectionGroup(owner, "states"),
        where("user_email", "==", EMAIL), where("hidden_until", ">", Timestamp.fromMillis(TS.toMillis() - 1)),
        where("hidden_until", "<=", Timestamp.fromMillis(TS.toMillis() + 86400000)))));
      expect(result.size).toBe(1);
    });
    it.each(["unknown/doc", "tasks/owned/unknown/doc", "users/owner/unknown/doc"])("denies unmatched path %s", async (path) => {
      await assertFails(getDoc(doc(owner, path)));
      await assertFails(setDoc(doc(owner, path), { value: "new" }));
      await assertFails(deleteDoc(doc(owner, path)));
    });
  });
});
