import { describe, it, expect } from "vitest";
import { tokenize } from "../core/lexer";

describe("tokenize", () => {
  it("returns a single xml token for plain text", () => {
    const tokens = tokenize("<w:t>Hello</w:t>");
    expect(tokens).toEqual([{ type: "xml", content: "<w:t>Hello</w:t>" }]);
  });

  it("tokenizes a simple variable", () => {
    const tokens = tokenize("<w:t>{name}</w:t>");
    expect(tokens).toHaveLength(3);
    expect(tokens[0]).toEqual({ type: "xml", content: "<w:t>" });
    expect(tokens[1]).toEqual({
      type: "variable",
      name: "name",
      formatters: [],
      raw: "{name}",
    });
    expect(tokens[2]).toEqual({ type: "xml", content: "</w:t>" });
  });

  it("tokenizes a variable with formatters", () => {
    const tokens = tokenize("<w:t>{name | uppercase | capitalize}</w:t>");
    const varToken = tokens.find((t) => t.type === "variable");
    expect(varToken).toMatchObject({
      type: "variable",
      name: "name",
      formatters: ["uppercase", "capitalize"],
    });
  });

  it("tokenizes a loop open/close", () => {
    const tokens = tokenize("{#items}content{/items}");
    expect(tokens[0]).toMatchObject({ type: "loop-open", name: "items" });
    expect(tokens[2]).toMatchObject({ type: "loop-close", name: "items" });
  });

  it("tokenizes a condition with else", () => {
    const tokens = tokenize("{#if active}yes{:else}no{/if}");
    expect(tokens[0]).toMatchObject({
      type: "condition-open",
      expression: "active",
    });
    expect(tokens[2]).toMatchObject({ type: "condition-else" });
    expect(tokens[4]).toMatchObject({ type: "condition-close" });
  });

  it("tokenizes dot-notation variables", () => {
    const tokens = tokenize("{company.name}");
    expect(tokens[0]).toMatchObject({
      type: "variable",
      name: "company.name",
    });
  });
});
