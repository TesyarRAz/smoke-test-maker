# Fix HTML Display - Headers Width & Pretty Print JSON

## TL;DR
> Fix request/response headers display - min-width for name, wrap for value. Fix response/request body pretty print JSON using npm package.

---

## Context

### Issues (from user)
1. **Request headers**: Name column auto-width too small → too narrow
2. **Request headers**: Value column doesn't wrap → overflow horizontally  
3. **Request body**: Should pretty-print JSON (use pretty-print-json npm package)
4. **Response body**: Should use pretty-print-json npm package

### npm Package
User wants: https://www.npmjs.com/package/pretty-print-json

---

## TODOs

- [x] 1. **Install pretty-print-json** (DONE: npm install pretty-print-json)

- [x] 2. **Update HTML generator to use pretty-print-json**

  File: src/generator/html-generator.ts
  
  Add import (line 3):
  ```typescript
  import { prettyPrintJson } from 'pretty-print-json';
  ```

  Replace syntaxHighlightJson calls:
  - Line ~163: Changed to `prettyPrintJson.toHtml(resp.body)`
  - Line ~189: Changed to `prettyPrintJson.toHtml(parsed)`
  
  Removed syntaxHighlightJson function (was ~line 313)

- [x] 3. **Build and verify**

---

## Acceptance Criteria

- [x] Headers name has min-width (not too narrow) - DONE in previous session
- [x] Headers value wraps (no horizontal scroll) - DONE in previous session  
- [x] JSON body uses pretty-print-json npm package