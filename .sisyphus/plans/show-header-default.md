# Fix: Show-Header Default to Host

## TL;DR

> **Problem**: When `--show-header` is not specified, no headers are shown in the output.
>
> **Fix**: Default to show "Host" header when `showHeaders` is empty/undefined.
>
> **Scope**: Single function change in `src/generator/output-generator.ts`

---

## Context

### Current Behavior
In `src/generator/output-generator.ts:5-8`:
```typescript
export function filterHeaders(headers: Record<string, string>, showHeaders?: string[]): Record<string, string> {
  if (!showHeaders || showHeaders.length === 0) {
    return {};  // Returns empty - no headers shown!
  }
  // ...
}
```

If user doesn't specify `# show-header:` in hurl file, no headers appear in output.

### Desired Behavior
- No `# show-header:` specified → show "Host" header by default
- `# show-header:Content-Type` → show only Content-Type (override default)
- `# show-header:Host,Content-Type` → show multiple headers

---

## Work Objectives

### Must Fix
- [x] Modify `filterHeaders()` to default to `["Host"]` when showHeaders is empty

### Must NOT Change
- [x] Don't change wildcard behavior (`*` shows all headers)
- [x] Don't change specific header filtering

---

## Technical Details

### Where to Change

In `src/generator/output-generator.ts`, function `filterHeaders()`:

```typescript
// BEFORE:
if (!showHeaders || showHeaders.length === 0) {
  return {};
}

// AFTER:
if (!showHeaders || showHeaders.length === 0) {
  return filterHeadersByNames(headers, ['Host']);
}
```

Or inline:
```typescript
if (!showHeaders || showHeaders.length === 0) {
  // Default to Host header
  const allowed = new Set(['host']);
  const filtered: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (allowed.has(name.toLowerCase())) {
      filtered[name] = value;
    }
  }
  return filtered;
}
```

### Case Insensitivity
The existing code already handles case-insensitive matching (line 16: `allowed.has(name.toLowerCaseCase())`). Use the same pattern for default: `['host']`.

---

## Verification

### Build Check
```bash
bun run build
```
Expected: Success

### Manual Test
1. Run a test WITHOUT `# show-header:` directive
2. Check output - should show "Host" header

---

## Success Criteria

- [x] When showHeaders empty → Host header appears in output
- [x] When showHeaders specified → uses specified headers (no regression)
- [x] Build passes