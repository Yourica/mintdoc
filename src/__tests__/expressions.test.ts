import { describe, it, expect } from "vitest";
import { resolveValue, isTruthy } from "../utils/expressions";

describe("resolveValue", () => {
  it("resolves a simple property", () => {
    expect(resolveValue("name", { name: "Alice" })).toBe("Alice");
  });

  it("resolves dot-notation paths", () => {
    const data = { company: { name: "Acme", address: { city: "Paris" } } };
    expect(resolveValue("company.name", data)).toBe("Acme");
    expect(resolveValue("company.address.city", data)).toBe("Paris");
  });

  it("returns undefined for missing paths", () => {
    expect(resolveValue("missing", { name: "Alice" })).toBeUndefined();
    expect(resolveValue("a.b.c", { a: {} })).toBeUndefined();
  });

  it("returns the data itself for '.'", () => {
    expect(resolveValue(".", 42)).toBe(42);
    expect(resolveValue(".", "hello")).toBe("hello");
  });

  it("returns undefined for null/undefined data", () => {
    expect(resolveValue("name", null)).toBeUndefined();
    expect(resolveValue("name", undefined)).toBeUndefined();
  });
});

describe("isTruthy", () => {
  it("treats non-empty values as truthy", () => {
    expect(isTruthy("hello")).toBe(true);
    expect(isTruthy(1)).toBe(true);
    expect(isTruthy(true)).toBe(true);
    expect(isTruthy([1])).toBe(true);
    expect(isTruthy({ a: 1 })).toBe(true);
  });

  it("treats falsy values as falsy", () => {
    expect(isTruthy(false)).toBe(false);
    expect(isTruthy(null)).toBe(false);
    expect(isTruthy(undefined)).toBe(false);
    expect(isTruthy(0)).toBe(false);
    expect(isTruthy("")).toBe(false);
  });

  it("treats empty arrays as falsy", () => {
    expect(isTruthy([])).toBe(false);
  });
});
