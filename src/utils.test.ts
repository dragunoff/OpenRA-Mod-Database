import { describe, it, expect } from "vitest";
import { sortByKeys } from "./utils.js";

describe("sortByKeys", () => {
  it("returns empty object for empty input", () => {
    expect(sortByKeys({})).toEqual({});
  });

  it("returns single key unchanged", () => {
    expect(sortByKeys({ b: 1 })).toEqual({ b: 1 });
  });

  it("sorts keys alphabetically", () => {
    expect(sortByKeys({ c: 3, a: 1, b: 2 })).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("preserves already-sorted keys", () => {
    expect(sortByKeys({ a: 1, b: 2, c: 3 })).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("handles string values", () => {
    expect(sortByKeys({ z: "last", a: "first" })).toEqual({
      a: "first",
      z: "last",
    });
  });
});
