# Changelog

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [0.1.0] — 2026-02-17

### Added

- Variable substitution: `{variable}`, `{object.property}` (dot-notation)
- Loop blocks: `{#items}...{/items}` with row duplication in Word tables
- Conditional blocks: `{#if condition}...{/if}` and `{#if condition}...{:else}...{/if}`
- Loop metadata: `{@index}`, `{@first}`, `{@last}`, `{.}` (current item)
- Built-in formatters: `uppercase`, `lowercase`, `capitalize`
- Custom formatter support via pipe syntax: `{name | uppercase}`
- Plugin system: `Mintdoc.use(plugin)` and `Mintdoc.addFormatters()`
- `.docx` support: `word/document.xml`, headers 1–3, footers 1–3
- XML run merging: handles Word's spell-checker splitting template tags across runs
- Table loop promotion: automatically moves loop tags outside `<w:tr>` for correct row duplication
- `Mintdoc` class (stateful, chainable) and standalone `render()` function
- `MintdocParseError` and `MintdocRenderError` with descriptive messages
- Node.js (CJS + ESM) and browser (ESM) build via tsup
- Full TypeScript typings included
