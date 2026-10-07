import { createRequire } from "node:module";
import { parseArgs } from "node:util";
import { queryContracts } from "./query-contracts.mjs";

const { values } = parseArgs({ options: {
  project: { type: "string" }, database: { type: "string", default: "(default)" }, owner: { type: "string" },
  today: { type: "string" }, now: { type: "string", default: new Date().toISOString() },
  "far-days": { type: "string", default: "15" }, "stale-days": { type: "string", default: "60" },
  analyze: { type: "boolean", default: false }, "dry-run": { type: "boolean", default: false },
  help: { type: "boolean", default: false },
} });

if (values.help) {
  console.log("Usage: pnpm firestore:explain --project PROJECT --owner EMAIL --today YYYY-MM-DD [--database ID] [--now ISO_UTC] [--far-days 15] [--stale-days 60] [--dry-run] [--analyze]");
  console.log("Defaults to plan-only explain (analyze=false). Never seeds, writes, deploys indexes, or changes Rules. Real Explain uses IAM Application Default Credentials; Firebase CLI sign-in is not sufficient. The today argument must reflect the owner's stored timezone. Dry-run only prints query definitions.");
  process.exit(0);
}

if (process.env.FIRESTORE_EMULATOR_HOST) throw new Error("Real Query Explain requires the Firestore service; unset FIRESTORE_EMULATOR_HOST. Use the emulator query suite separately.");
if (!values.project || !values.owner?.trim() || !values.today) throw new Error("Explicit project, owner, and today arguments are required");
const today = new Date(`${values.today}T00:00:00.000Z`);
const now = new Date(values.now);
if (!/^\d{4}-\d{2}-\d{2}$/.test(values.today) || !Number.isFinite(today.getTime()) || today.toISOString().slice(0, 10) !== values.today) throw new Error("today must be a valid YYYY-MM-DD date in the owner's stored timezone");
if (!Number.isFinite(now.getTime()) || now.toISOString() !== values.now) throw new Error("now must be a canonical ISO-8601 UTC timestamp");
const farDays = Number(values["far-days"]);
const staleDays = Number(values["stale-days"]);
if (![farDays, staleDays].every((value) => Number.isSafeInteger(value) && value > 0)) throw new Error("far-days and stale-days must be positive integers");
if (values["dry-run"] && values.analyze) throw new Error("dry-run and analyze cannot be combined");

// Resolve existing backend dependencies from their approved package boundary.
// This script is verification tooling; it adds no client/backend business operation.
const apiRequire = createRequire(new URL("../../apps/api/package.json", import.meta.url));
const { initializeApp, applicationDefault, deleteApp } = apiRequire("firebase-admin/app");
const { getFirestore, Timestamp } = apiRequire("firebase-admin/firestore");
const horizon = Math.max(30, 2 * farDays);
const day = 86400000;
const future = new Date(today.getTime() + horizon * day);
if (!Number.isFinite(future.getTime())) throw new Error("far-days creates an invalid date horizon");
const catalog = queryContracts({ email: values.owner.trim().toLowerCase(), futureDate: future.toISOString().slice(0, 10),
  pastBoundary: Timestamp.fromMillis(now.getTime() - horizon * day), staleBoundary: Timestamp.fromMillis(now.getTime() - staleDays * day),
  now: Timestamp.fromDate(now), futureInstant: Timestamp.fromMillis(now.getTime() + horizon * day) });
const parameters = { ownerEmail: values.owner.trim().toLowerCase(), today: values.today, now: values.now,
  farDays, staleDays, horizonDays: horizon };

if (values["dry-run"]) {
  console.log(JSON.stringify({ status: "dry-run; no server plan evidence", project: values.project, database: values.database,
    analyze: false, parameters, queries: catalog }, null, 2));
} else {
  const app = initializeApp({ projectId: values.project, credential: applicationDefault() }, "taskify-query-explain");
  const db = getFirestore(app, values.database);
  const report = { project: values.project, database: values.database, analyze: values.analyze, parameters,
    generatedAt: new Date().toISOString(), queries: [] };
  try {
    for (const spec of catalog) {
      let q = spec.scope === "COLLECTION_GROUP" ? db.collectionGroup(spec.collection) : db.collection(spec.collection);
      for (const [field, op, value] of spec.filters) q = q.where(field, op, value);
      for (const [field, direction] of spec.orderBy) q = q.orderBy(field, direction);
      try {
        const { metrics } = await q.explain({ analyze: values.analyze });
        report.queries.push({ ...spec, status: "explained", metrics });
      } catch (error) {
        report.queries.push({ ...spec, status: "failed", code: error.code ?? null, message: error.message });
        process.exitCode = 1;
      }
    }
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await db.terminate();
    await deleteApp(app);
  }
}
