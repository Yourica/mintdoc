import type { ASTNode, FormatterMap } from "./types";
import { resolveValue, isTruthy } from "../utils/expressions";
import { escapeXml } from "../utils/xml";

/**
 * Render an AST tree into a final XML string using the provided data
 * and formatters.
 */
export function render(
  nodes: ASTNode[],
  data: Record<string, unknown>,
  formatters: FormatterMap,
): string {
  let output = "";

  for (const node of nodes) {
    switch (node.type) {
      case "text":
        output += node.content;
        break;

      case "variable":
        output += renderVariable(node.name, node.formatters, data, formatters);
        break;

      case "loop":
        output += renderLoop(node.name, node.children, data, formatters);
        break;

      case "condition":
        output += renderCondition(
          node.expression,
          node.trueChildren,
          node.falseChildren,
          data,
          formatters,
        );
        break;
    }
  }

  return output;
}

// ---------------------------------------------------------------------------
// Node renderers
// ---------------------------------------------------------------------------

function renderVariable(
  name: string,
  fmtNames: string[],
  data: Record<string, unknown>,
  formatters: FormatterMap,
): string {
  let value = resolveValue(name, data);

  for (const fmtName of fmtNames) {
    const fn = formatters[fmtName];
    if (!fn) {
      throw new MintdocRenderError(
        `Unknown formatter "${fmtName}". Available formatters: ${Object.keys(formatters).join(", ") || "(none)"}`,
      );
    }
    value = fn(value);
  }

  if (value == null) return "";
  return escapeXml(String(value));
}

function renderLoop(
  name: string,
  children: ASTNode[],
  data: Record<string, unknown>,
  formatters: FormatterMap,
): string {
  const collection = resolveValue(name, data);

  if (!Array.isArray(collection)) {
    if (collection == null) return "";
    throw new MintdocRenderError(
      `Loop "{#${name}}" expects an array but received ${typeof collection}.`,
    );
  }

  let output = "";

  for (let i = 0; i < collection.length; i++) {
    const item = collection[i];
    const scope = createLoopScope(data, item, i, collection.length);
    output += render(children, scope, formatters);
  }

  return output;
}

function renderCondition(
  expression: string,
  trueChildren: ASTNode[],
  falseChildren: ASTNode[],
  data: Record<string, unknown>,
  formatters: FormatterMap,
): string {
  const value = resolveValue(expression, data);

  if (isTruthy(value)) {
    return render(trueChildren, data, formatters);
  }
  return render(falseChildren, data, formatters);
}

// ---------------------------------------------------------------------------
// Scope helpers
// ---------------------------------------------------------------------------

/**
 * Create a child scope for a loop iteration.
 *
 * - Parent data remains accessible (inner properties shadow outer ones).
 * - `.` refers to the current item.
 * - `@index` is the 0-based iteration index.
 * - `@first` / `@last` are booleans.
 */
function createLoopScope(
  parentData: Record<string, unknown>,
  item: unknown,
  index: number,
  length: number,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    ...parentData,
    ".": item,
    "@index": index,
    "@first": index === 0,
    "@last": index === length - 1,
  };

  if (item !== null && typeof item === "object" && !Array.isArray(item)) {
    Object.assign(base, item as Record<string, unknown>);
  }

  return base;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class MintdocRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MintdocRenderError";
  }
}
