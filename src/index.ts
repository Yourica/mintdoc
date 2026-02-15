import type { FormatterMap, MintdocPlugin, RenderOptions } from "./core/types";
import { processDocx } from "./formats/docx";
import { collectFormatters } from "./plugins/plugin-api";

export const VERSION = "0.1.0";

/**
 * Mintdoc — modern document templating engine.
 *
 * @example
 * ```ts
 * import { Mintdoc } from "mintdoc";
 *
 * const doc = new Mintdoc();
 * const output = doc.render(templateBuffer, { name: "Alice" });
 * ```
 */
export class Mintdoc {
  private plugins: MintdocPlugin[] = [];
  private extraFormatters: FormatterMap = {};

  /**
   * Register a plugin (adds formatters, tag handlers, etc.).
   */
  use(plugin: MintdocPlugin): this {
    this.plugins.push(plugin);
    return this;
  }

  /**
   * Register one or more custom formatters.
   */
  addFormatters(formatters: FormatterMap): this {
    Object.assign(this.extraFormatters, formatters);
    return this;
  }

  /**
   * Render a .docx template with the given data.
   *
   * @param template - The .docx file as a Buffer, ArrayBuffer or Uint8Array.
   * @param data     - The data object to inject into the template.
   * @returns A Buffer containing the rendered .docx file.
   */
  render(
    template: Buffer | ArrayBuffer | Uint8Array,
    data: Record<string, unknown>,
  ): Buffer {
    const formatters = collectFormatters(this.plugins, this.extraFormatters);
    return processDocx(template, data, formatters);
  }
}

/**
 * Shorthand: render a template without creating an instance.
 *
 * @example
 * ```ts
 * import { render } from "mintdoc";
 *
 * const output = render(templateBuffer, { name: "Alice" });
 * ```
 */
export function render(
  template: Buffer | ArrayBuffer | Uint8Array,
  data: Record<string, unknown>,
  options?: RenderOptions,
): Buffer {
  const formatters = collectFormatters(
    options?.plugins ?? [],
    options?.formatters,
  );
  return processDocx(template, data, formatters);
}

// Re-export public types
export type { MintdocPlugin, RenderOptions, FormatterMap } from "./core/types";
export { MintdocParseError } from "./core/parser";
export { MintdocRenderError } from "./core/renderer";
