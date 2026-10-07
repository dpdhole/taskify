import { describe, expect, it } from "vitest";
import { normalizeTaskDate } from "./task-dates.js";
import type { TaskDateInput } from "@taskify/api-contracts";
import { ApiError } from "../shared/errors.js";

describe("normalizeTaskDate", () => {
  it("preserves a valid date-only value without an instant", () => {
    const result = normalizeTaskDate({
      date: "2026-10-07",
      has_time: false,
      time: null,
      timezone: null,
    });

    expect(result).toEqual({
      date: "2026-10-07",
      has_time: false,
      time: null,
      timezone: null,
      instant: null,
    });
  });

  it("rejects an impossible calendar date", () => {
    expect(() =>
      normalizeTaskDate({
        date: "2026-02-30",
        has_time: false,
        time: null,
        timezone: null,
      }),
    ).toThrow("Invalid date");
  });

  it("requires time and timezone for timed values", () => {
    expect(() =>
      normalizeTaskDate({
        date: "2026-10-07",
        has_time: true,
        time: null,
        timezone: null,
      }),
    ).toThrow("Timed values require time and timezone");
  });

  it("converts a valid IANA-zoned local time to the corresponding instant", () => {
    const result = normalizeTaskDate({
      date: "2026-10-07",
      has_time: true,
      time: "13:40",
      timezone: "Asia/Kolkata",
    });

    expect(result.instant?.toDate().toISOString()).toBe("2026-10-07T08:10:00.000Z");
  });

  it.each([
    ["2026-01-15", "12:00", "2026-01-15T17:00:00.000Z"],
    ["2026-07-15", "12:00", "2026-07-15T16:00:00.000Z"],
    ["2026-03-08", "01:30", "2026-03-08T06:30:00.000Z"],
    ["2026-03-08", "03:30", "2026-03-08T07:30:00.000Z"],
  ])("normalizes New York %s %s across DST offsets", (date, time, instant) => {
    expect(normalizeTaskDate({ date, time, has_time: true, timezone: "America/New_York" })
      .instant?.toDate().toISOString()).toBe(instant);
  });

  it("rejects a nonexistent local time during the spring DST gap", () => {
    expect(() => normalizeTaskDate({ date: "2026-03-08", has_time: true,
      time: "02:30", timezone: "America/New_York" })).toThrow("Invalid or nonexistent local date/time");
  });

  it.each([
    { date: "2026-2-01", has_time: false, time: null, timezone: null },
    { date: "2026-10-07", has_time: false, time: "12:00", timezone: null },
    { date: "2026-10-07", has_time: false, time: null, timezone: "UTC" },
    { date: "2026-10-07", has_time: true, time: "24:00", timezone: "UTC" },
    { date: "2026-10-07", has_time: true, time: "12:60", timezone: "UTC" },
    { date: "2026-02-30", has_time: true, time: "12:00", timezone: "UTC" },
    { date: "2026-10-07", has_time: true, time: "12:00", timezone: "Not/AZone" },
  ])("rejects invalid date intent: %j", (input) => {
    expect(() => normalizeTaskDate(input)).toThrow();
  });

  it.each([undefined, null, 0, "false"])("requires a boolean has_time: %j", (has_time) => {
    expect(() => normalizeTaskDate({ date: "2026-10-07", has_time, time: null, timezone: null } as unknown as TaskDateInput)).toThrow();
  });

  it.each([
    null, [], false,
    { date: 20261007, has_time: false, time: null, timezone: null },
    { date: "2026-10-07", has_time: true, time: 1230, timezone: "UTC" },
    { date: "2026-10-07", has_time: true, time: "12:30", timezone: {} },
    { date: "2026-10-07", has_time: true, time: "12:30", timezone: "Not/AZone" },
    { date: "2026-10-07", has_time: true, time: "12:30", timezone: "+01:00" },
  ])("returns INVALID_ARGUMENT for malformed TaskDate values: %j", (input) => {
    expect(() => normalizeTaskDate(input as unknown as TaskDateInput)).toThrow(ApiError);
    try {
      normalizeTaskDate(input as unknown as TaskDateInput);
    } catch (error) {
      expect(error).toMatchObject({ code: "INVALID_ARGUMENT" });
    }
  });

  it("stores canonical date fields without carrying extra client fields", () => {
    const result = normalizeTaskDate({ date: "2026-10-07", has_time: false, time: null, timezone: null,
      instant: "spoof", unexpected: "untrusted" } as TaskDateInput);
    expect(result).toEqual({ date: "2026-10-07", has_time: false, time: null, timezone: null, instant: null });
  });
});
