# Fix show-header Filter Logic

## TL;DR
Fix filterHeaders behavior:
- No directive → no headers (empty)
- `# show-header:*` → all headers

---

## Context

### Issue
Current behavior: if no show-header directive → return all headers
Required behavior:
- No directive → return {} (empty)
- `# show-header:*` → return all headers (wildcard)
- `# show-header:Content-Type` → only Content-Type

---

## TODOs

- [x] 1. Update filterHeaders in output-generator.ts

  **What to do**: Modify filterHeaders function (line 5-17)
  
  Change:
  ```typescript
  if (!showHeaders || showHeaders.length === 0) {
    return headers;
  }
  ```
  
  To:
  ```typescript
  if (!showHeaders || showHeaders.length === 0) {
    return {};
  }
  if (showHeaders.includes('*')) {
    return headers;
  }
  ```

  **References**: src/generator/output-generator.ts:5-17

- [x] 2. Update generateOutput to always call filterHeaders

  **What to do**: Line 42 - remove conditional
  
  Change:
  ```typescript
  const filteredHeaders = options.showHeaders ? filterHeaders(headers, options.showHeaders) : headers;
  ```
  
  To:
  ```typescript
  const filteredHeaders = filterHeaders(headers, options.showHeaders);
  ```

  **References**: src/generator/output-generator.ts:42

- [x] 3. QA verification

  **What to do**: Build and test
  
  Steps:
  1. bun run build
  2. node dist/index.js test/scenario.hurl
  3. Check test/output/case1.json (should have Content-Type only)
  4. Check test/output/case3.json (should have all headers if wildcard, or empty otherwise)

---

## Verification Strategy

### Test Cases
- No show-header directive → {} (empty headers object)
- `# show-header:*` → all headers
- `# show-header:Content-Type` → only Content-Type
- `# show-header:Content-Type,Date` → both headers

---

## Done Criteria
- [x] No directive returns empty {}
- [x] Wildcard * returns all headers
- [x] Specific headers work as before
- [x] Build passes