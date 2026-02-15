// ---------------------------------------------------------------------------
// Tokens — flat representation produced by the lexer
// ---------------------------------------------------------------------------

export interface XmlToken {
  type: "xml";
  content: string;
}

export interface VariableToken {
  type: "variable";
  name: string;
  formatters: string[];
  raw: string;
}

export interface LoopOpenToken {
  type: "loop-open";
  name: string;
  raw: string;
}

export interface LoopCloseToken {
  type: "loop-close";
  name: string;
  raw: string;
}

export interface ConditionOpenToken {
  type: "condition-open";
  expression: string;
  raw: string;
}

export interface ConditionElseToken {
  type: "condition-else";
  raw: string;
}

export interface ConditionCloseToken {
  type: "condition-close";
  raw: string;
}

export type Token =
  | XmlToken
  | VariableToken
  | LoopOpenToken
  | LoopCloseToken
  | ConditionOpenToken
  | ConditionElseToken
  | ConditionCloseToken;

// ---------------------------------------------------------------------------
// AST nodes — tree representation produced by the parser
// ---------------------------------------------------------------------------

export interface TextNode {
  type: "text";
  content: string;
}

export interface VariableNode {
  type: "variable";
  name: string;
  formatters: string[];
}

export interface LoopNode {
  type: "loop";
  name: string;
  children: ASTNode[];
}

export interface ConditionNode {
  type: "condition";
  expression: string;
  trueChildren: ASTNode[];
  falseChildren: ASTNode[];
}

export type ASTNode = TextNode | VariableNode | LoopNode | ConditionNode;

// ---------------------------------------------------------------------------
// Formatters & plugins
// ---------------------------------------------------------------------------

export type Formatter = (value: unknown) => unknown;
export type FormatterMap = Record<string, Formatter>;

export interface MintdocPlugin {
  name: string;
  formatters?: FormatterMap;
}

// ---------------------------------------------------------------------------
// Public API options
// ---------------------------------------------------------------------------

export interface RenderOptions {
  formatters?: FormatterMap;
  plugins?: MintdocPlugin[];
}
