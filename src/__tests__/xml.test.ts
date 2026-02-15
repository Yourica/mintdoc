import { describe, it, expect } from "vitest";
import { mergeRuns, escapeXml } from "../utils/xml";

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
