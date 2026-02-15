/**
 * Escape special characters for safe insertion into XML text nodes.
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Merge template tags that Word has split across multiple <w:t> runs.
 *
 * Word often breaks text like `{firstName}` into separate runs:
 *   <w:r><w:t>{first</w:t></w:r><w:r><w:t>Name}</w:t></w:r>
 *
 * This function detects unclosed `{` in a <w:t> element and pulls text from
 * subsequent <w:t> elements until the matching `}` is found, consolidating
 * the tag into a single <w:t>.
 */
export function mergeRuns(xml: string): string {
  // Collect every <w:t ...>...</w:t> with its position
  const wtRegex = /<w:t(\s[^>]*)?>([^]*?)<\/w:t>/g;

  interface WtMatch {
    fullMatch: string;
    attrs: string;
    content: string;
    index: number;
  }

  const matches: WtMatch[] = [];
  let m: RegExpExecArray | null;
  while ((m = wtRegex.exec(xml)) !== null) {
    matches.push({
      fullMatch: m[0],
      attrs: m[1] || "",
      content: m[2],
      index: m.index,
    });
  }

  if (matches.length === 0) return xml;

  // Track which matches need their content replaced
  const newContents: Map<number, string> = new Map();

  let i = 0;
  while (i < matches.length) {
    const content = newContents.get(i) ?? matches[i].content;
    const openCount = countChar(content, "{");
    const closeCount = countChar(content, "}");

    if (openCount > closeCount) {
      // Unclosed brace — pull text from the next <w:t> elements
      let merged = content;
      let j = i + 1;

      while (j < matches.length) {
        const nextContent = newContents.get(j) ?? matches[j].content;
        merged += nextContent;
        newContents.set(j, "");
        const opens = countChar(merged, "{");
        const closes = countChar(merged, "}");
        if (closes >= opens) break;
        j++;
      }

      newContents.set(i, merged);
    }

    i++;
  }

  // Rebuild the XML string with updated contents
  if (newContents.size === 0) return xml;

  let result = "";
  let cursor = 0;

  for (let k = 0; k < matches.length; k++) {
    const mt = matches[k];
    if (!newContents.has(k)) {
      // No change — copy everything up to and including this match
      result += xml.slice(cursor, mt.index + mt.fullMatch.length);
      cursor = mt.index + mt.fullMatch.length;
      continue;
    }

    // Copy everything before this match
    result += xml.slice(cursor, mt.index);

    // Write the updated <w:t> element
    const attrs = mt.attrs;
    const preserveSpace =
      attrs.includes('xml:space="preserve"') ? "" : ' xml:space="preserve"';
    result += `<w:t${attrs}${preserveSpace}>${newContents.get(k)}</w:t>`;
    cursor = mt.index + mt.fullMatch.length;
  }

  // Append any remaining XML after the last match
  result += xml.slice(cursor);

  return result;
}

/**
 * Promote loop tags that are inside table cells to wrap the entire table row.
 *
 * When a user writes a loop inside a table (e.g. {#items} in the first cell
 * and {/items} in the last cell), the tags need to wrap the whole <w:tr>
 * element so that entire rows are duplicated — not just cell contents.
 *
 * Before: <w:tr><w:tc>..{#items}{name}..</w:tc><w:tc>..{price}{/items}..</w:tc></w:tr>
 * After:  {#items}<w:tr><w:tc>..{name}..</w:tc><w:tc>..{price}..</w:tc></w:tr>{/items}
 */
export function promoteTableLoopTags(xml: string): string {
  // Match each table row (non-greedy — works for non-nested tables)
  const trRegex = /<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g;

  return xml.replace(trRegex, (rowXml) => {
    // Find loop open tags (exclude conditions: {#if ...})
    const openRegex = /\{#(?!if[\s}])([\w.]+)\}/g;
    const closeRegex = /\{\/(?!if\})([\w.]+)\}/g;

    const opens: string[] = [];
    const closes: string[] = [];

    let match;
    while ((match = openRegex.exec(rowXml)) !== null) opens.push(match[1]);
    while ((match = closeRegex.exec(rowXml)) !== null) closes.push(match[1]);

    // Only promote when a single loop wraps the row
    if (
      opens.length === 1 &&
      closes.length === 1 &&
      opens[0] === closes[0]
    ) {
      const name = opens[0];
      const cleaned = rowXml
        .replace(`{#${name}}`, "")
        .replace(`{/${name}}`, "");
      return `{#${name}}${cleaned}{/${name}}`;
    }

    return rowXml;
  });
}

function countChar(str: string, char: string): number {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === char) count++;
  }
  return count;
}
