# Fix JSON Response Indentation

## TL;DR

> **Problem**: JSON response in HTML doesn't show proper indentation/formatting
> **Fix**: Change CSS `white-space: pre-wrap` to `white-space: pre` to preserve line breaks
> **Scope**: `src/generator/html-generator.ts` line 92

---

## Context

### Issue
The `.json-response` CSS uses `white-space: pre-wrap` which can collapse whitespace. Need to use `white-space: pre` to preserve JSON indentation.

Current CSS at line 92:
```css
.json-response { ... white-space: pre-wrap; ... }
```

Should be:
```css
.json-response { ... white-space: pre; line-height: 1.6; ... }
```

---

## Work Objectives

### Must Fix
- [x] Change `white-space: pre-wrap` to `white-space: pre` in `.json-response` CSS
- [x] Add `line-height: 1.6` for better readability

### Must NOT Change
- JSON syntax highlighting colors
- Other CSS properties

---

## Verification

### Build Check
```bash
bun run build
```
Expected: Success

---

## Success Criteria

- [x] JSON response shows proper indentation
- [x] Line breaks preserved