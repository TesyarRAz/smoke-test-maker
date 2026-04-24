# Fix HTML Pretty Print JSON

## TL;DR
> Replace custom syntaxHighlightJson with pretty-print-json npm package

---

## Context

### Issue
- Request/response body uses custom `syntaxHighlightJson` function
- User wants to use `pretty-print-json` npm package instead

### Package
- `pretty-print-json` already installed in node_modules
- Has `printJson.toHtml()` method for HTML output

---

## TODOs

- [ ] 1. **Add import for pretty-print-json**

  File: src/generator/html-generator.ts
  
  Add: `import { printJson } from 'pretty-print-json';`

- [ ] 2. **Replace syntaxHighlightJson calls**

  Replace all `syntaxHighlightJson(...)` with `printJson.toHtml(...)`

- [ ] 3. **Remove unused function**

  Remove `syntaxHighlightJson` function after replacement

- [ ] 4. **Build and verify**

---

## Acceptance Criteria

- [ ] Build passes
- [ ] Request body uses pretty-print-json formatting
- [ ] Response body uses pretty-print-json formatting