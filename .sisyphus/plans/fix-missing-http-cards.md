# Fix: Missing HTTP Response Cards in HTML Generator

## TL;DR

> **Problem**: HTTP response cards are missing from HTML output because `generateHttpCard()` function exists but is never called.
>
> **Fix**: Add loop to call `generateHttpCard()` for each HTTP response in the data array.
>
> **Scope**: Single file change in `src/generator/html-generator.ts`

---

## Context

### Bug Description
In `html-generator.ts`, the function `generateHttpCard()` exists (lines 136-211) but is never invoked. The HTML generation loop has empty comments where HTTP cards should be rendered:

```typescript
// Database outputs (pre-output)
for (const d of items) { ... }

// HTTP responses
// <-- EMPTY! Missing: generateHttpCard() calls

// Database outputs (post-output)
for (const d of items) { ... }
```

### Root Cause
When implementing display modes, the developer likely removed or never added the HTTP response card generation loop.

### Impact
- HTTP request/response data doesn't appear in HTML output
- Users only see database results
- The visual feedback for API tests is broken

---

## Work Objectives

### Must Fix
- [x] Add HTTP response card generation loop in `generateHtml()` function
- [x] Pass correct parameters to `generateHttpCard()`: response data, request details, card number, URL, method

### Must NOT Change
- Database card generation (works correctly)
- Display mode CSS (works correctly)
- Existing function signatures

---

## Technical Details

### Where to Add Code

In `src/generator/html-generator.ts`, after line 108 (pre-output loop) and before line 113 (post-output loop):

```typescript
// HTTP responses
for (const d of items) {
  if (d.httpResponse) {
    html += generateHttpCard(
      d.httpResponse, 
      d.requestBody, 
      cardNum++, 
      d.requestUrl || '', 
      d.requestMethod || 'GET'
    );
  }
}
```

### Parameters for `generateHttpCard()`
- `httpResponse`: `HttpResponseData` - from `d.httpResponse`
- `requestBody`: `string | undefined` - from `d.requestBody`
- `cardNum`: `number` - incrementing counter
- `url`: `string` - from `d.requestUrl`
- `method`: `string` - from `d.requestMethod`

---

## Verification

### Build Check
```bash
bun run build
```
Expected: Success (TypeScript compiles without errors)

### Manual QA
Run a test that generates HTML output and verify:
1. HTTP cards appear with method badge (GET/POST/etc)
2. URL is displayed
3. Status code shown
4. Response body rendered
5. Response headers in tab

---

## Success Criteria

- [x] `generateHttpCard()` is called for each HTTP response
- [x] HTTP cards show: method, URL, status, body, headers
- [x] Build passes
- [x] No regression in database card display