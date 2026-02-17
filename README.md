# Mintdoc

**Mint perfect documents from templates.**

A modern, lightweight document templating engine for `.docx` files. Generate Word documents from templates and data — in Node.js or the browser.

[![npm version](https://img.shields.io/npm/v/mintdoc)](https://www.npmjs.com/package/mintdoc)
[![license](https://img.shields.io/npm/l/mintdoc)](./LICENSE)

---

## Features

- **Variables** — `{firstName}`, `{company.name}` (dot-notation)
- **Loops** — `{#items}...{/items}` with automatic table row duplication
- **Conditions** — `{#if premium}...{:else}...{/if}`
- **Formatters** — `{name | uppercase}` with built-in and custom formatters
- **Loop metadata** — `{@index}`, `{@first}`, `{@last}`, `{.}`
- **Headers & footers** — template tags work everywhere in the document
- **TypeScript** — full typings included
- **Zero server dependency** — works in Node.js and the browser

---

## Installation

```bash
npm install mintdoc
```

---

## Quick Start

```ts
import { Mintdoc } from "mintdoc";
import { readFileSync, writeFileSync } from "fs";

const doc = new Mintdoc();
const template = readFileSync("template.docx");

const output = doc.render(template, {
  firstName: "Alice",
  company: { name: "Acme Corp" },
  premium: true,
  items: [
    { name: "Widget", price: "10 €" },
    { name: "Gadget", price: "20 €" },
  ],
});

writeFileSync("output.docx", output);
```

Or use the shorthand function for simple cases:

```ts
import { render } from "mintdoc";

const output = render(template, { name: "Alice" });
```

---

## Template Syntax

Create your template in Word, then use these tags in your document:

| Syntax | Description |
|---|---|
| `{variable}` | Simple variable |
| `{object.property}` | Dot-notation path |
| `{variable \| formatter}` | Apply a formatter |
| `{#items}...{/items}` | Loop over an array |
| `{#if condition}...{/if}` | Conditional block |
| `{#if condition}...{:else}...{/if}` | Conditional with else |

### Loop Metadata

Inside a loop, these special variables are available:

| Variable | Description |
|---|---|
| `{@index}` | Current iteration index (0-based) |
| `{@first}` | `true` on the first iteration |
| `{@last}` | `true` on the last iteration |
| `{.}` | Current item (for primitive arrays) |

```
{#items}
  {name} — item {#if @first}(first){/if}{#if @last}(last){/if}
{/items}
```

### Table Row Duplication

Place a loop around a table row to duplicate it for each item:

```
| {#items}{name} | {price}{/items} |
```

Mintdoc automatically detects loop tags inside table cells and wraps the entire row — no manual configuration needed.

---

## Built-in Formatters

| Formatter | Example | Output |
|---|---|---|
| `uppercase` | `{name \| uppercase}` | `ALICE` |
| `lowercase` | `{name \| lowercase}` | `alice` |
| `capitalize` | `{name \| capitalize}` | `Alice` |

Formatters can be chained: `{name | lowercase | capitalize}`

---

## Custom Formatters

Register your own formatters with `addFormatters()`:

```ts
const doc = new Mintdoc().addFormatters({
  date: (value) => new Date(String(value)).toLocaleDateString("en-US"),
  euros: (value) => `${value} €`,
  truncate: (value) => String(value).slice(0, 50),
});
```

Then use them in your template:

```
Invoice date: {createdAt | date}
Total: {amount | euros}
```

---

## Plugin System

Mintdoc has an open plugin API. Register plugins using `use()`:

```ts
import { Mintdoc } from "mintdoc";
import { imagePlugin } from "@mintdoc/pro"; // Pro module (coming soon)

const doc = new Mintdoc().use(imagePlugin);
```

Plugins can add formatters and new tag types. Third-party plugins can use the same API.

---

## Error Handling

Mintdoc throws typed errors for clear debugging:

```ts
import { Mintdoc, MintdocParseError, MintdocRenderError } from "mintdoc";

try {
  const output = doc.render(template, data);
} catch (e) {
  if (e instanceof MintdocParseError) {
    // Malformed template (unclosed tag, mismatched tags…)
    console.error("Template error:", e.message);
  } else if (e instanceof MintdocRenderError) {
    // Data mismatch (unknown formatter, loop on non-array…)
    console.error("Render error:", e.message);
  }
}
```

---

## API Reference

### `new Mintdoc()`

Creates a reusable instance. Configure once, render multiple times.

| Method | Description |
|---|---|
| `.use(plugin)` | Register a plugin |
| `.addFormatters(map)` | Register custom formatters |
| `.render(template, data)` | Render a `.docx` template |

All methods are chainable:

```ts
const doc = new Mintdoc()
  .use(myPlugin)
  .addFormatters({ date: (v) => new Date(String(v)).toLocaleDateString() });
```

### `render(template, data, options?)`

Shorthand function — no instance required.

```ts
import { render } from "mintdoc";

const output = render(template, data, {
  formatters: { date: (v) => new Date(String(v)).toLocaleDateString() },
});
```

---

## Browser Usage

Mintdoc works in the browser. Pass an `ArrayBuffer` instead of a `Buffer`:

```ts
import { render } from "mintdoc";

const response = await fetch("/templates/invoice.docx");
const template = await response.arrayBuffer();
const output = render(template, { name: "Alice" });
```

---

## License

MIT — see [LICENSE](./LICENSE).

---

> **Pro modules** — images, charts, dynamic tables, Excel, PowerPoint — coming soon at [mintdoc.dev](https://mintdoc.dev).
