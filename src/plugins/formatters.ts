import type { FormatterMap } from "../core/types";

/**
 * Built-in formatters shipped with the free core.
 */
export const builtinFormatters: FormatterMap = {
  uppercase: (value) => String(value ?? "").toUpperCase(),
  lowercase: (value) => String(value ?? "").toLowerCase(),
  capitalize: (value) => {
    const str = String(value ?? "");
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
};
