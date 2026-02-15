import { describe, it, expect } from "vitest";
import { tokenize } from "../core/lexer";
import { parse } from "../core/parser";
import { render, MintdocRenderError } from "../core/renderer";
import { builtinFormatters } from "../plugins/formatters";

function renderTemplate(
  template: string,
  data: Record<string, unknown>,
): string {
  const tokens = tokenize(template);
  const ast = parse(tokens);
  return render(ast, data, builtinFormatters);
}

describe("render", () => {
  describe("variables", () => {
    it("replaces a simple variable", () => {
      expect(renderTemplate("{name}", { name: "Alice" })).toBe("Alice");
    });

    it("replaces a dot-notation variable", () => {
      const data = { company: { name: "Acme" } };
      expect(renderTemplate("{company.name}", data)).toBe("Acme");
    });

    it("renders empty string for undefined values", () => {
      expect(renderTemplate("{missing}", {})).toBe("");
    });

    it("escapes XML special characters", () => {
      expect(renderTemplate("{name}", { name: "A & B <C>" })).toBe(
        "A &amp; B &lt;C&gt;",
      );
    });

    it("preserves surrounding XML", () => {
      expect(
        renderTemplate("<w:t>{name}</w:t>", { name: "Alice" }),
      ).toBe("<w:t>Alice</w:t>");
    });
  });

  describe("formatters", () => {
    it("applies uppercase", () => {
      expect(renderTemplate("{name | uppercase}", { name: "alice" })).toBe(
        "ALICE",
      );
    });

    it("applies lowercase", () => {
      expect(renderTemplate("{name | lowercase}", { name: "ALICE" })).toBe(
        "alice",
      );
    });

    it("applies capitalize", () => {
      expect(
        renderTemplate("{name | capitalize}", { name: "alice" }),
      ).toBe("Alice");
    });

    it("chains formatters", () => {
      expect(
        renderTemplate("{name | lowercase | capitalize}", { name: "aLICE" }),
      ).toBe("Alice");
    });

    it("throws on unknown formatter", () => {
      const tokens = tokenize("{name | unknown}");
      const ast = parse(tokens);
      expect(() => render(ast, { name: "test" }, builtinFormatters)).toThrow(
        MintdocRenderError,
      );
    });
  });

  describe("loops", () => {
    it("renders a simple loop", () => {
      const result = renderTemplate("{#items}{name},{/items}", {
        items: [{ name: "A" }, { name: "B" }, { name: "C" }],
      });
      expect(result).toBe("A,B,C,");
    });

    it("renders an empty loop", () => {
      expect(renderTemplate("{#items}{name}{/items}", { items: [] })).toBe(
        "",
      );
    });

    it("renders nothing for null collection", () => {
      expect(
        renderTemplate("{#items}{name}{/items}", { items: null }),
      ).toBe("");
    });

    it("provides @index, @first, @last in loop scope", () => {
      const result = renderTemplate(
        "{#items}{@index}{#if @first}F{/if}{#if @last}L{/if},{/items}",
        { items: [{ n: "a" }, { n: "b" }, { n: "c" }] },
      );
      expect(result).toBe("0F,1,2L,");
    });

    it("preserves parent scope in loop", () => {
      const result = renderTemplate("{#items}{title}: {name},{/items}", {
        title: "Mr",
        items: [{ name: "A" }, { name: "B" }],
      });
      expect(result).toBe("Mr: A,Mr: B,");
    });

    it("supports nested loops", () => {
      const result = renderTemplate(
        "{#groups}{#items}{name}{/items}|{/groups}",
        {
          groups: [
            { items: [{ name: "A" }, { name: "B" }] },
            { items: [{ name: "C" }] },
          ],
        },
      );
      expect(result).toBe("AB|C|");
    });

    it("supports loops with primitive items via '.'", () => {
      const result = renderTemplate("{#tags}{.},{/tags}", {
        tags: ["one", "two", "three"],
      });
      expect(result).toBe("one,two,three,");
    });
  });

  describe("conditions", () => {
    it("renders true branch when truthy", () => {
      expect(
        renderTemplate("{#if active}ON{/if}", { active: true }),
      ).toBe("ON");
    });

    it("renders nothing when falsy (no else)", () => {
      expect(
        renderTemplate("{#if active}ON{/if}", { active: false }),
      ).toBe("");
    });

    it("renders else branch when falsy", () => {
      expect(
        renderTemplate("{#if active}ON{:else}OFF{/if}", { active: false }),
      ).toBe("OFF");
    });

    it("treats empty array as falsy", () => {
      expect(
        renderTemplate("{#if items}yes{:else}no{/if}", { items: [] }),
      ).toBe("no");
    });

    it("treats non-empty array as truthy", () => {
      expect(
        renderTemplate("{#if items}yes{:else}no{/if}", { items: [1] }),
      ).toBe("yes");
    });
  });
});
