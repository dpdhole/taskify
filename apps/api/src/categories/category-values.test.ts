import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import { categoryId, categoryTimestamp, compareCodePoints, emptyRequest, expectedTimestamp, normalizeCategoryName } from "./category-values.js";

describe("Category value contracts", () => {
  it("trims/NFC-normalizes while retaining punctuation, accents, internal whitespace and display casing", () => {
    expect(normalizeCategoryName("  Cafe\u0301  & Me!  ")).toEqual({ name: "Café  & Me!", normalized_name: "café  & me!" });
    expect(normalizeCategoryName("İ").normalized_name).toBe("i\u0307");
    expect(normalizeCategoryName("Straße").normalized_name).toBe("straße");
  });
  it("counts grapheme clusters, including combined emoji, instead of UTF-16 units/code points", () => {
    const family = "👩‍👩‍👧‍👦";
    expect(normalizeCategoryName(family.repeat(15)).name).toBe(family.repeat(15));
    expect(() => normalizeCategoryName(family.repeat(16))).toThrow("INVALID_ARGUMENT");
    expect(normalizeCategoryName("a\u0301".repeat(15)).name).toBe("á".repeat(15));
  });
  it.each([undefined, null, 5, {}, [], "", " \n ", "a".repeat(16), "\uD800", "\uDC00"])
    ("rejects malformed/empty/overlength display names: %j", (value) => {
      expect(() => normalizeCategoryName(value)).toThrow("INVALID_ARGUMENT");
    });
  it("compares Unicode code points without locale or UTF-16 surrogate ordering", () => {
    expect(["😀", "\uE000", "é", "z", "a"].sort(compareCodePoints)).toEqual(["a", "z", "é", "\uE000", "😀"]);
    expect(compareCodePoints("a", "aa")).toBeLessThan(0);
    expect(compareCodePoints("aa", "aa")).toBe(0);
  });
  it.each([new Timestamp(0, 123456000), new Timestamp(-1, 999999000), new Timestamp(1791360000, 123456789),
    new Timestamp(-62135596800, 0), new Timestamp(253402300799, 999999000)])
    ("round-trips precise timestamp %j", (timestamp) => {
      expect(expectedTimestamp(categoryTimestamp(timestamp)).isEqual(timestamp)).toBe(true);
    });
  it("distinguishes values within the same millisecond", () => {
    const first = new Timestamp(1791360000, 123456000);
    const second = new Timestamp(first.seconds, 123457000);
    expect(first.toDate().getTime()).toBe(second.toDate().getTime());
    expect(expectedTimestamp(categoryTimestamp(first)).isEqual(second)).toBe(false);
  });
  it.each([null, 0, "bad", "2026-02-30T00:00:00.000000000Z", "2026-10-07T00:00:00.000Z",
    "2026-10-07T00:00:00.000000000+00:00", "0000-01-01T00:00:00.000000000Z"])
    ("rejects malformed/noncanonical Category tokens: %j", (value) => {
      expect(() => expectedTimestamp(value)).toThrow("INVALID_ARGUMENT");
    });
  it.each([null, {}, "", " ", "a/b", ".", "..", "__reserved__", "\uD800", "a".repeat(1501)])
    ("rejects invalid Category IDs: %j", (id) => expect(() => categoryId(id)).toThrow("INVALID_ARGUMENT"));
  it("allows stable Unicode IDs and requires genuinely empty request objects", () => {
    expect(categoryId("自分")).toBe("自分");
    expect(() => emptyRequest({})).not.toThrow();
    for (const value of [null, [], false, { owner_email: "spoof@example.com" }]) {
      expect(() => emptyRequest(value)).toThrow("INVALID_ARGUMENT");
    }
  });
});
