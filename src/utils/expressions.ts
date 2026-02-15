/**
 * Resolve a dot-notation path against a data object.
 *
 * Examples:
 *   resolveValue("name", { name: "Alice" })           → "Alice"
 *   resolveValue("company.name", { company: { name: "Acme" } }) → "Acme"
 *   resolveValue(".", currentItem)                     → currentItem
 */
export function resolveValue(path: string, data: unknown): unknown {
  if (data == null || typeof data !== "object") {
    return path === "." ? data : undefined;
  }

  // "." resolves to the special scope key set by loop iterations
  if (path === ".") {
    const record = data as Record<string, unknown>;
    return "." in record ? record["."] : data;
  }

  const parts = path.split(".");
  let current: unknown = data;

  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Evaluate whether a value is "truthy" in the template sense.
 *
 * - `false`, `null`, `undefined`, `0`, `""` → false
 * - Empty arrays `[]` → false
 * - Everything else → true
 */
export function isTruthy(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}
