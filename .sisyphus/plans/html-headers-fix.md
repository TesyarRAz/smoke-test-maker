# Fix HTML Display - Headers Width & Pretty Print JSON

## TL;DR
> Fix request/response headers display - min-width for name, wrap for value. Fix response/request body pretty print JSON.

---

## Context

### Issues
1. **Request headers**: Name column auto-width too small → too narrow
2. **Request headers**: Value column doesn't wrap → overflow horizontally
3. **Request body**: Should pretty-print JSON
4. **Response body**: Already pretty-prints but verify

---

## TODOs

- [ ] 1. **Add min-width to headers name column**

  Fix: src/generator/html-generator.ts CSS
  - .cookies-table td:first-child { min-width: 150px; }

- [ ] 2. **Add word-wrap to headers value column**

  Fix: .cookies-table td:last-child { word-wrap: break-word; }
  
- [ ] 3. **Add pretty-print JSON for request body**

  Already has JSON parsing - verify working

- [ ] 4. **Build and test**

---

## Acceptance Criteria

- [ ] Headers name has min-width (not too narrow)
- [ ] Headers value wraps (no horizontal scroll)
- [ ] JSON body is pretty-printed