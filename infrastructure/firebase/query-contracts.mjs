// Verification tooling only: these are the documented candidate queries, not a client implementation.
export function queryContracts({ email, futureDate, pastBoundary, staleBoundary, now, futureInstant }) {
  const owner = ["owner_email", "==", email];
  const working = [owner, ["availability", "==", "working"]];
  const active = [...working, ["lifecycle.macro", "in", ["upcoming", "active"]]];
  const dated = [...active, ["due_date", "<=", futureDate]];
  const tasks = (name, filters, orderBy = []) => ({ name, collection: "tasks", scope: "COLLECTION", filters, orderBy });
  const group = (name, collection, filters, orderBy = []) => ({ name, collection, scope: "COLLECTION_GROUP", filters, orderBy });
  return [
    tasks("focus", dated, [["due_date", "asc"]]),
    tasks("resolve", [...working, ["lifecycle.micro", "in", ["waiting", "blocked", "on_hold"]]]),
    tasks("prioritize-dated", dated, [["due_date", "asc"]]),
    tasks("prioritize-unspecified", [...active, ["due_date", "==", null]]),
    tasks("plan", [...active, ["due_date", "==", null], ["created_at", ">=", pastBoundary]], [["created_at", "desc"]]),
    group("follow-up", "states", [["user_email", "==", email], ["hidden_until", ">", now], ["hidden_until", "<=", futureInstant]], [["hidden_until", "asc"]]),
    tasks("all-active", [...active, ["updated_at", ">=", staleBoundary]], [["updated_at", "desc"]]),
    tasks("all-active-include-stale", active, [["updated_at", "desc"]]),
    tasks("recently-closed", [...working, ["lifecycle.macro", "==", "completed"], ["completed_at", ">=", pastBoundary]], [["completed_at", "desc"]]),
    tasks("unarchive", [owner, ["availability", "==", "archived"], ["archived_at", ">=", pastBoundary]], [["archived_at", "desc"]]),
    tasks("recover", [owner, ["availability", "==", "deleted"], ["deleted_at", ">=", pastBoundary], ["purge_after", ">", now]], [["deleted_at", "desc"], ["purge_after", "asc"]]),
    group("preferences", "preferences", [["user_email", "==", email]]),
    group("active-hidden-state", "states", [["user_email", "==", email], ["hidden_until", ">", now]]),
  ];
}
