import type { ASTNode, Token } from "./types";

/**
 * Parse a flat token list into an AST (tree of nodes).
 *
 * Structural tags ({#loop}, {#if}, {:else}, {/…}) define nesting.
 * Throws descriptive errors on mismatched or unclosed tags.
 */
export function parse(tokens: Token[]): ASTNode[] {
  const { nodes, index } = parseNodes(tokens, 0, null);

  if (index < tokens.length) {
    const unexpected = tokens[index];
    throw new MintdocParseError(
      `Unexpected closing tag "${(unexpected as { raw?: string }).raw ?? ""}" without a matching opening tag.`,
    );
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// Internal recursive descent parser
// ---------------------------------------------------------------------------

interface ParseResult {
  nodes: ASTNode[];
  index: number;
}

function parseNodes(
  tokens: Token[],
  start: number,
  closingTag: string | null,
): ParseResult {
  const nodes: ASTNode[] = [];
  let i = start;

  while (i < tokens.length) {
    const token = tokens[i];

    switch (token.type) {
      case "xml":
        nodes.push({ type: "text", content: token.content });
        i++;
        break;

      case "variable":
        nodes.push({
          type: "variable",
          name: token.name,
          formatters: token.formatters,
        });
        i++;
        break;

      case "loop-open": {
        const loopName = token.name;
        const children = parseNodes(tokens, i + 1, loopName);

        // Verify the closing tag matches
        const closer = tokens[children.index];
        if (!closer || closer.type !== "loop-close") {
          throw new MintdocParseError(
            `Unclosed loop "{#${loopName}}". Add a matching "{/${loopName}}" tag.`,
          );
        }
        if (closer.type === "loop-close" && closer.name !== loopName) {
          throw new MintdocParseError(
            `Mismatched loop tags: opened "{#${loopName}}" but closed with "{/${closer.name}}".`,
          );
        }

        nodes.push({ type: "loop", name: loopName, children: children.nodes });
        i = children.index + 1;
        break;
      }

      case "condition-open": {
        const expression = token.expression;
        const trueBranch = parseNodes(tokens, i + 1, "if");

        let trueChildren = trueBranch.nodes;
        let falseChildren: ASTNode[] = [];
        let endIndex = trueBranch.index;

        const next = tokens[endIndex];

        if (next && next.type === "condition-else") {
          // Parse the else branch
          const falseBranch = parseNodes(tokens, endIndex + 1, "if");
          falseChildren = falseBranch.nodes;
          endIndex = falseBranch.index;
        }

        const closerToken = tokens[endIndex];
        if (!closerToken || closerToken.type !== "condition-close") {
          throw new MintdocParseError(
            `Unclosed condition "{#if ${expression}}". Add a matching "{/if}" tag.`,
          );
        }

        nodes.push({
          type: "condition",
          expression,
          trueChildren,
          falseChildren,
        });
        i = endIndex + 1;
        break;
      }

      // Closing / else tokens signal the end of the current nesting level
      case "loop-close":
      case "condition-close":
      case "condition-else":
        return { nodes, index: i };

      default:
        i++;
    }
  }

  // If we expected a closing tag but reached end of tokens
  if (closingTag !== null) {
    throw new MintdocParseError(
      `Unexpected end of template. Missing closing tag for "{#${closingTag}}".`,
    );
  }

  return { nodes, index: i };
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class MintdocParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MintdocParseError";
  }
}
