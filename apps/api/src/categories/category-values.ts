import { Timestamp } from "firebase-admin/firestore";
import { ApiError } from "../shared/errors.js";

export const DEFAULT_CATEGORY_NAMES = [
  "Family", "Finance", "Friends", "Growth", "Hobbies", "Household", "Leisure",
  "Partner", "Self", "Social", "Spirituality", "Wellness", "Work",
] as const;

const characters = new Intl.Segmenter("en", { granularity: "grapheme" });
const malformedUnicode = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u;

export function normalizeCategoryName(value: unknown): { name: string; normalized_name: string } {
  if (typeof value !== "string") throw new ApiError("INVALID_ARGUMENT");
  const name = value.trim().normalize("NFC");
  // Reject unpaired surrogates: they cannot be preserved in UTF-8 Firestore names/guard keys.
  if (!name || malformedUnicode.test(name) || [...characters.segment(name)].length > 15) {
    throw new ApiError("INVALID_ARGUMENT");
  }
  return { name, normalized_name: name.toLowerCase() };
}

export function compareCodePoints(left: string, right: string): number {
  const a = Array.from(left, (character) => character.codePointAt(0)!);
  const b = Array.from(right, (character) => character.codePointAt(0)!);
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i]! < b[i]! ? -1 : 1;
  }
  return a.length - b.length;
}

export function requestObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError("INVALID_ARGUMENT");
  return value as Record<string, unknown>;
}

export function emptyRequest(value: unknown): void {
  if (Object.keys(requestObject(value)).length) throw new ApiError("INVALID_ARGUMENT");
}

export function categoryId(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.includes("/") ||
      value === "." || value === ".." || /^__.*__$/.test(value) || malformedUnicode.test(value) ||
      Buffer.byteLength(value, "utf8") > 1500) throw new ApiError("INVALID_ARGUMENT");
  return value;
}

/** Lossless ISO UTC transport, including timestamps from direct client serverTimestamp writes. */
export function categoryTimestamp(value: Timestamp): string {
  return new Date(value.seconds * 1000).toISOString().replace(/\.\d{3}Z$/, `.${String(value.nanoseconds).padStart(9, "0")}Z`);
}

export function expectedTimestamp(value: unknown): Timestamp {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{9}Z$/.test(value)) {
    throw new ApiError("INVALID_ARGUMENT");
  }
  const seconds = Date.parse(value.slice(0, 19) + ".000Z") / 1000;
  if (!Number.isFinite(seconds)) throw new ApiError("INVALID_ARGUMENT");
  let result: Timestamp;
  try { result = new Timestamp(seconds, Number(value.slice(20, 29))); }
  catch { throw new ApiError("INVALID_ARGUMENT"); }
  if (categoryTimestamp(result) !== value) throw new ApiError("INVALID_ARGUMENT");
  return result;
}
