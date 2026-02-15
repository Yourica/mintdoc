import type { MintdocPlugin, FormatterMap } from "../core/types";
import { builtinFormatters } from "./formatters";

/**
 * Collect all formatters from registered plugins, merged on top of builtins.
 */
export function collectFormatters(
  plugins: MintdocPlugin[],
  extraFormatters?: FormatterMap,
): FormatterMap {
  const merged: FormatterMap = { ...builtinFormatters };

  for (const plugin of plugins) {
    if (plugin.formatters) {
      Object.assign(merged, plugin.formatters);
    }
  }

  if (extraFormatters) {
    Object.assign(merged, extraFormatters);
  }

  return merged;
}
