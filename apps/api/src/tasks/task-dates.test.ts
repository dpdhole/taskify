import { describe, expect, it } from "vitest";
import { normalizeTaskDate } from "./task-dates.js";

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
});
