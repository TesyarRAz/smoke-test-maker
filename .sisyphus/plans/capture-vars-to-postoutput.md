# Pass Captured Variables to Post-Output Queries

## TL;DR
> captured variables dari hurl `[Captures]` harus bisa digunakan di post-output queries.

## Problem
```hurl
[Captures]
id: jsonpath "$[0].id"
```
→ `id` di-capture dari response

```hurl  
# post-output:testdb:{dsn}|SELECT id FROM products WHERE id = '{{id}}'
```
→ `{{id}}` tidak kebaca karena capturedVars tidak di-pass

---

## TODOs

- [x] 1. Pass capturedVars to processCustomComments

  **File**: `src/index.ts`
  
  **Change**: Line ~114 - merge capturedVars dengan options.variables sebelum passed ke processCustomComments

  ```typescript
  // Sebelum:
  const dbResult = await processCustomComments(entry, options.variables);
  
  // Sesudah:
  const allVars = { ...options.variables, ...result.capturedVars };
  const dbResult = await processCustomComments(entry, allVars);
  ```

- [x] 2. Verify captured vars work in queries

  **Steps**:
  - Buat test hurl dengan capture + post-output
  - Run test
  - Verify post-output query dapat menggunakan captured var
