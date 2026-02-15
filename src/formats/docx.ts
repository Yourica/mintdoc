import type { FormatterMap } from "../core/types";
import { tokenize } from "../core/lexer";
import { parse } from "../core/parser";
import { render } from "../core/renderer";
import { mergeRuns, promoteTableLoopTags } from "../utils/xml";
import { openZip, getFile, setFile, generateZip } from "../utils/zip";

/**
 * Files inside the .docx archive that can contain template tags.
 * We process document.xml first, then headers/footers.
 */
const TEMPLATE_TARGETS = [
  "word/document.xml",
  // Headers & footers (Word uses numbered names)
  ...Array.from({ length: 3 }, (_, i) => `word/header${i + 1}.xml`),
  ...Array.from({ length: 3 }, (_, i) => `word/footer${i + 1}.xml`),
];

/**
 * Process a .docx template buffer with the given data.
 *
 * Pipeline:
 *   1. Open the docx (ZIP)
 *   2. For each XML target: merge split runs → tokenize → parse → render
 *   3. Re-package the ZIP and return a Buffer
 */
export function processDocx(
  buffer: Buffer | ArrayBuffer | Uint8Array,
  data: Record<string, unknown>,
  formatters: FormatterMap,
): Buffer {
  const zip = openZip(buffer);

  for (const target of TEMPLATE_TARGETS) {
    const xml = getFile(zip, target);
    if (xml === null) continue;

    const processed = processXml(xml, data, formatters);
    setFile(zip, target, processed);
  }

  return generateZip(zip);
}

/**
 * Run the full template pipeline on a raw XML string.
 */
function processXml(
  xml: string,
  data: Record<string, unknown>,
  formatters: FormatterMap,
): string {
  const merged = mergeRuns(xml);
  const promoted = promoteTableLoopTags(merged);
  const tokens = tokenize(promoted);
  const ast = parse(tokens);
  return render(ast, data, formatters);
}
