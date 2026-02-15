import { describe, it, expect } from "vitest";
import { tokenize } from "../core/lexer";
import { parse, MintdocParseError } from "../core/parser";

describe("parse", () => {
  it("parses plain text into a TextNode", () => {
    const tokens = tokenize("Hello world");
    const ast = parse(tokens);
    expect(ast).toEqual([{ type: "text", content: "Hello world" }]);
  });

  it("parses a variable", () => {
    const tokens = tokenize("{name}");
    const ast = parse(tokens);
    expect(ast).toEqual([
      { type: "variable", name: "name", formatters: [] },
    ]);
  });

  it("parses a loop with children", () => {
    const tokens = tokenize("{#items}{name}{/items}");
    const ast = parse(tokens);
    expect(ast).toHaveLength(1);
    expect(ast[0]).toMatchObject({ type: "loop", name: "items" });
    if (ast[0].type === "loop") {
      expect(ast[0].children).toEqual([
        { type: "variable", name: "name", formatters: [] },
      ]);
    }
  });

  it("parses a condition with true/false branches", () => {
    const tokens = tokenize("{#if active}yes{:else}no{/if}");
    const ast = parse(tokens);
    expect(ast).toHaveLength(1);
    if (ast[0].type === "condition") {
      expect(ast[0].expression).toBe("active");
      expect(ast[0].trueChildren).toEqual([
        { type: "text", content: "yes" },
      ]);
      expect(ast[0].falseChildren).toEqual([
        { type: "text", content: "no" },
      ]);
    }
  });

  it("parses a condition without else", () => {
    const tokens = tokenize("{#if active}yes{/if}");
    const ast = parse(tokens);
    if (ast[0].type === "condition") {
      expect(ast[0].trueChildren).toEqual([
        { type: "text", content: "yes" },
      ]);
      expect(ast[0].falseChildren).toEqual([]);
    }
  });

  it("parses nested loops", () => {
    const tokens = tokenize("{#groups}{#items}{name}{/items}{/groups}");
    const ast = parse(tokens);
    expect(ast[0]).toMatchObject({ type: "loop", name: "groups" });
    if (ast[0].type === "loop") {
      expect(ast[0].children[0]).toMatchObject({
        type: "loop",
        name: "items",
      });
    }
  });

  it("throws on unclosed loop", () => {
    const tokens = tokenize("{#items}{name}");
    expect(() => parse(tokens)).toThrow(MintdocParseError);
    expect(() => parse(tokens)).toThrow(/Missing closing tag/);
  });

  it("throws on mismatched loop tags", () => {
    const tokens = tokenize("{#items}{name}{/other}");
    expect(() => parse(tokens)).toThrow(MintdocParseError);
  });

  it("throws on unclosed condition", () => {
    const tokens = tokenize("{#if active}hello");
    expect(() => parse(tokens)).toThrow(MintdocParseError);
    expect(() => parse(tokens)).toThrow(/Missing closing tag/);
  });
});
