import { describe, it, expect } from "vitest";
import { mergeRuns, escapeXml, promoteTableLoopTags } from "../utils/xml";

describe("escapeXml", () => {
  it("escapes &, <, >, \", '", () => {
    expect(escapeXml('A & B < C > D " E \' F')).toBe(
      "A &amp; B &lt; C &gt; D &quot; E &apos; F",
    );
  });

  it("returns the same string when nothing to escape", () => {
    expect(escapeXml("hello world")).toBe("hello world");
  });
});

describe("mergeRuns", () => {
  it("does nothing when tags are not split", () => {
    const xml = '<w:r><w:t>{name}</w:t></w:r>';
    expect(mergeRuns(xml)).toBe(xml);
  });

  it("merges a tag split across two runs", () => {
    const xml =
      '<w:r><w:t>{fir</w:t></w:r><w:r><w:t>stName}</w:t></w:r>';
    const result = mergeRuns(xml);
    // The first <w:t> should contain the full tag, second should be empty
    expect(result).toContain("{firstName}");
    expect(result).toMatch(/<w:t[^>]*><\/w:t>/);
  });

  it("merges a tag split across three runs", () => {
    const xml =
      '<w:r><w:t>{</w:t></w:r><w:r><w:t>first</w:t></w:r><w:r><w:t>Name}</w:t></w:r>';
    const result = mergeRuns(xml);
    expect(result).toContain("{firstName}");
  });

  it("preserves non-split tags", () => {
    const xml =
      '<w:r><w:t>{name}</w:t></w:r><w:r><w:t>{age}</w:t></w:r>';
    const result = mergeRuns(xml);
    expect(result).toContain("{name}");
    expect(result).toContain("{age}");
  });

  it("handles mixed split and non-split tags", () => {
    const xml =
      '<w:r><w:t>{ok}</w:t></w:r><w:r><w:t>{spl</w:t></w:r><w:r><w:t>it}</w:t></w:r>';
    const result = mergeRuns(xml);
    expect(result).toContain("{ok}");
    expect(result).toContain("{split}");
  });
});

describe("promoteTableLoopTags", () => {
  it("moves loop tags outside the table row", () => {
    const xml =
      '<w:tr><w:tc><w:p><w:r><w:t>{#items}{name}</w:t></w:r></w:p></w:tc>' +
      '<w:tc><w:p><w:r><w:t>{price}{/items}</w:t></w:r></w:p></w:tc></w:tr>';
    const result = promoteTableLoopTags(xml);
    expect(result).toMatch(/^\{#items\}<w:tr>/);
    expect(result).toMatch(/<\/w:tr>\{\/items\}$/);
    // Loop tags removed from inside the row
    const insideRow = result.replace(/^\{#items\}/, "").replace(/\{\/items\}$/, "");
    expect(insideRow).not.toContain("{#items}");
    expect(insideRow).not.toContain("{/items}");
    // But {name} and {price} should remain inside
    expect(result).toContain("{name}");
    expect(result).toContain("{price}");
  });

  it("does not touch rows without loop tags", () => {
    const xml =
      '<w:tr><w:tc><w:p><w:r><w:t>{name}</w:t></w:r></w:p></w:tc></w:tr>';
    expect(promoteTableLoopTags(xml)).toBe(xml);
  });

  it("does not promote condition tags", () => {
    const xml =
      '<w:tr><w:tc><w:p><w:r><w:t>{#if active}yes{/if}</w:t></w:r></w:p></w:tc></w:tr>';
    expect(promoteTableLoopTags(xml)).toBe(xml);
  });

  it("preserves header rows", () => {
    const xml =
      '<w:tr><w:tc><w:p><w:r><w:t>Header</w:t></w:r></w:p></w:tc></w:tr>' +
      '<w:tr><w:tc><w:p><w:r><w:t>{#items}{name}{/items}</w:t></w:r></w:p></w:tc></w:tr>';
    const result = promoteTableLoopTags(xml);
    expect(result).toContain("<w:tr><w:tc><w:p><w:r><w:t>Header</w:t>");
    expect(result).toMatch(/\{#items\}<w:tr>/);
  });
});
