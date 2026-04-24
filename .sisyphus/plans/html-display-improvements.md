# HTML Display Improvements

## TL;DR

> **Improvements**:
> 1. JSON response prettier (formatted JSON with syntax highlighting)
> 2. Single-row DB form: label beside value (not below)
> 3. Red theme: #EF202
>
> **Scope**: `src/generator/html-generator.ts`

---

## Context

### Current Issues
1. **JSON Response**: Not prettified - all on one line, hard to read
2. **Single-row DB form**: Label above value (vertical), user wants label beside value (horizontal)
3. **Theme**: Currently purple gradient (#667eea to #764ba2), user wants red #EF202

### User Requirements
- JSON responses should be syntax-highlighted/prettified
- Single-row DB form: horizontal layout (label | value), not vertical (label above value)
- Theme color: #EF202 (red)

---

## Work Objectives

### Must Fix
- [x] Prettify JSON responses in HTTP cards
- [x] Change single-row DB form to horizontal (label beside value, not above)
- [x] Change theme to red #EF202

### Must NOT Change
- Multi-row DB table behavior (keep as scrollable table)
- Display mode CSS (will override with new theme)
- HTTP card structure

---

## Technical Details

### JSON Prettify
In `generateHttpCard()`, change response body rendering:
- Current: `JSON.stringify(resp.body, null, 2)` - already has indent but needs CSS for syntax highlighting
- Add CSS classes for JSON syntax: keys, strings, numbers, booleans, null

### Single-Row Form Layout
In `generateDbCard()`, for `rowCount === 1`:
- Change from `.display-vertical` to `.display-horizontal`
- Current CSS (vertical):
  ```css
  .display-vertical .form-row { display: flex; flex-direction: column; }
  ```
- New CSS (horizontal):
  ```css
  .display-vertical .form-row { display: flex; flex-direction: row; align-items: center; gap: 12px; }
  ```

### Theme Color
Replace all purple gradient references with red #EF202:
- `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)` → `background: #EF202`
- Or use gradient: `linear-gradient(135deg, #EF202 0%, #B91C1C 100%)`

### Color Updates
Replace:
- `#667eea` → `#EF202`
- `#764ba2` → `#B91C1C` (darker red)
- `#007bff` → `#EF202` (for badges/accents)

---

## Verification

### Build Check
```bash
bun run build
```
Expected: Success

### Manual QA
1. Run test with JSON response - verify formatted
2. Run test with single-row DB - verify label beside value
3. Check header is red (#EF202)

---

## Success Criteria

- [x] JSON response is prettified with line breaks
- [x] Single-row DB form shows label beside value
- [x] Theme is red (#EF202)