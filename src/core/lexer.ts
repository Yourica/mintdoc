import type { Token } from "./types";

/**
 * Tokenize an XML string that has already been through run-merging.
 *
 * Splits the XML into a flat list of tokens:
 *   - `xml`             — raw XML content (not a template tag)
 *   - `variable`        — {varName} or {varName | formatter}
 *   - `loop-open`       — {#collection}
 *   - `loop-close`      — {/collection}
 *   - `condition-open`  — {#if expression}
 *   - `condition-else`  — {:else}
 *   - `condition-close` — {/if}
 */
export function tokenize(xml: string): Token[] {
  const tokens: Token[] = [];
  const tagRegex = /\{([^}]+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(xml)) !== null) {
    // Push any XML content before this tag
    if (match.index > lastIndex) {
      tokens.push({ type: "xml", content: xml.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    const inner = match[1].trim();
    tokens.push(classifyTag(inner, raw));

    lastIndex = match.index + match[0].length;
  }

  // Push any remaining XML after the last tag
  if (lastIndex < xml.length) {
    tokens.push({ type: "xml", content: xml.slice(lastIndex) });
  }

  return tokens;
}

/**
 * Classify the inner content of a template tag into the correct token type.
 */
function classifyTag(inner: string, raw: string): Token {
  // {:else}
  if (inner === ":else") {
    return { type: "condition-else", raw };
  }

  // {/if}
  if (inner === "/if") {
    return { type: "condition-close", raw };
  }

  // {/collection}
  if (inner.startsWith("/")) {
    return { type: "loop-close", name: inner.slice(1).trim(), raw };
  }

  // {#if expression}
  if (inner.startsWith("#if ")) {
    return { type: "condition-open", expression: inner.slice(4).trim(), raw };
  }

  // {#collection}
  if (inner.startsWith("#")) {
    return { type: "loop-open", name: inner.slice(1).trim(), raw };
  }

  // {variable | formatter1 | formatter2}
  const parts = inner.split("|").map((p) => p.trim());
  const name = parts[0];
  const formatters = parts.slice(1);

  return { type: "variable", name, formatters, raw };
}
