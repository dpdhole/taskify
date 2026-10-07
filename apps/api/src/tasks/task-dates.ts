import { TZDate } from "@date-fns/tz";
import type { TaskDateInput } from "@taskify/api-contracts";
import { Timestamp } from "firebase-admin/firestore";
import { ApiError } from "../shared/errors.js";

export interface StoredTaskDate {
  date: string;
  has_time: boolean;
  time: string | null;
  timezone: string | null;
  instant: Timestamp | null;
}

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^(\d{2}):(\d{2})$/;

export function normalizeTaskDate(input: TaskDateInput): StoredTaskDate {
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      typeof input.date !== "string" || typeof input.has_time !== "boolean" ||
      (input.time !== null && typeof input.time !== "string") ||
      (input.timezone !== null && typeof input.timezone !== "string")) {
    throw new ApiError("INVALID_ARGUMENT", "Invalid TaskDate input");
  }

  const dateMatch = DATE.exec(input.date);
  if (!dateMatch) throw new ApiError("INVALID_ARGUMENT", "Invalid date");

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);

  if (!input.has_time) {
    if (input.time !== null || input.timezone !== null) {
      throw new ApiError("INVALID_ARGUMENT", "Date-only values cannot include time or timezone");
    }
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      throw new ApiError("INVALID_ARGUMENT", "Invalid date");
    }
    return { date: input.date, has_time: false, time: null, timezone: null, instant: null };
  }

  const timeMatch = input.time ? TIME.exec(input.time) : null;
  if (!timeMatch || !input.timezone) {
    throw new ApiError("INVALID_ARGUMENT", "Timed values require time and timezone");
  }

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour > 23 || minute > 59) throw new ApiError("INVALID_ARGUMENT", "Invalid time");

  let local: TZDate;
  try {
    // Intl validates timezone identifiers before TZDate's lazy getters are used.
    if (/^[+-]/.test(input.timezone)) throw new RangeError("Expected an IANA timezone");
    new Intl.DateTimeFormat("en-US", { timeZone: input.timezone });
    local = new TZDate(year, month - 1, day, hour, minute, input.timezone);
  } catch {
    throw new ApiError("INVALID_ARGUMENT", "Invalid timezone");
  }

  if (local.getFullYear() !== year || local.getMonth() !== month - 1 || local.getDate() !== day ||
      local.getHours() !== hour || local.getMinutes() !== minute) {
    throw new ApiError("INVALID_ARGUMENT", "Invalid or nonexistent local date/time");
  }

  return { date: input.date, has_time: true, time: input.time, timezone: input.timezone,
    instant: Timestamp.fromMillis(local.getTime()) };
}
