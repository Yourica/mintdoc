import { describe, it, expect } from "vitest";
import PizZip from "pizzip";
import { Mintdoc, render } from "../index";

/**
 * Helper: create a minimal .docx buffer with the given XML body content.
 * A .docx is a ZIP file containing at minimum:
 *   - [Content_Types].xml
 *   - word/document.xml
 *   - word/_rels/document.xml.rels
 *   - _rels/.rels
 */
function createDocx(bodyXml: string): Buffer {
  const zip = new PizZip();

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  mc:Ignorable="w14 wp14">
  <w:body>${bodyXml}</w:body>
</w:document>`;

  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`);

  zip.file("word/document.xml", documentXml);

  return zip.generate({ type: "nodebuffer" });
}

/** Extract the text content of word/document.xml from a docx buffer */
function extractDocumentXml(buffer: Buffer): string {
  const zip = new PizZip(buffer);
  return zip.file("word/document.xml")!.asText();
}

describe("Mintdoc integration", () => {
  it("replaces a simple variable in a .docx", () => {
    const docx = createDocx(
      '<w:p><w:r><w:t>{name}</w:t></w:r></w:p>',
    );
    const result = render(docx, { name: "Alice" });
    const xml = extractDocumentXml(result);
    expect(xml).toContain("Alice");
    expect(xml).not.toContain("{name}");
  });

  it("replaces multiple variables", () => {
    const docx = createDocx(
      '<w:p><w:r><w:t>{firstName} {lastName}</w:t></w:r></w:p>',
    );
    const result = render(docx, { firstName: "Alice", lastName: "Smith" });
    const xml = extractDocumentXml(result);
    expect(xml).toContain("Alice Smith");
  });

  it("handles dot-notation variables", () => {
    const docx = createDocx(
      '<w:p><w:r><w:t>{company.name}</w:t></w:r></w:p>',
    );
    const result = render(docx, { company: { name: "Acme Corp" } });
    const xml = extractDocumentXml(result);
    expect(xml).toContain("Acme Corp");
  });

  it("applies formatters", () => {
    const docx = createDocx(
      '<w:p><w:r><w:t>{name | uppercase}</w:t></w:r></w:p>',
    );
    const result = render(docx, { name: "alice" });
    const xml = extractDocumentXml(result);
    expect(xml).toContain("ALICE");
  });

  it("renders a loop", () => {
    const docx = createDocx(
      '<w:p><w:r><w:t>{#items}</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t>- {name}</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t>{/items}</w:t></w:r></w:p>',
    );
    const result = render(docx, {
      items: [{ name: "Widget" }, { name: "Gadget" }],
    });
    const xml = extractDocumentXml(result);
    expect(xml).toContain("- Widget");
    expect(xml).toContain("- Gadget");
    expect(xml).not.toContain("{#items}");
    expect(xml).not.toContain("{/items}");
  });

  it("renders a condition (true branch)", () => {
    const docx = createDocx(
      '<w:p><w:r><w:t>{#if premium}VIP{:else}Standard{/if}</w:t></w:r></w:p>',
    );
    const result = render(docx, { premium: true });
    const xml = extractDocumentXml(result);
    expect(xml).toContain("VIP");
    expect(xml).not.toContain("Standard");
  });

  it("renders a condition (false/else branch)", () => {
    const docx = createDocx(
      '<w:p><w:r><w:t>{#if premium}VIP{:else}Standard{/if}</w:t></w:r></w:p>',
    );
    const result = render(docx, { premium: false });
    const xml = extractDocumentXml(result);
    expect(xml).toContain("Standard");
    expect(xml).not.toContain("VIP");
  });

  it("handles merged split runs", () => {
    // Simulate Word splitting {firstName} across two runs
    const docx = createDocx(
      '<w:p><w:r><w:t>{first</w:t></w:r><w:r><w:t>Name}</w:t></w:r></w:p>',
    );
    const result = render(docx, { firstName: "Alice" });
    const xml = extractDocumentXml(result);
    expect(xml).toContain("Alice");
  });

  it("works with the Mintdoc class", () => {
    const docx = createDocx(
      '<w:p><w:r><w:t>{name | uppercase}</w:t></w:r></w:p>',
    );
    const doc = new Mintdoc();
    const result = doc.render(docx, { name: "alice" });
    const xml = extractDocumentXml(result);
    expect(xml).toContain("ALICE");
  });

  it("supports custom formatters via the class API", () => {
    const docx = createDocx(
      '<w:p><w:r><w:t>{name | reverse}</w:t></w:r></w:p>',
    );
    const doc = new Mintdoc();
    doc.addFormatters({
      reverse: (v) => String(v ?? "").split("").reverse().join(""),
    });
    const result = doc.render(docx, { name: "Alice" });
    const xml = extractDocumentXml(result);
    expect(xml).toContain("ecilA");
  });

  it("escapes XML special characters in values", () => {
    const docx = createDocx(
      '<w:p><w:r><w:t>{name}</w:t></w:r></w:p>',
    );
    const result = render(docx, { name: "A & B <C>" });
    const xml = extractDocumentXml(result);
    expect(xml).toContain("A &amp; B &lt;C&gt;");
  });
});
