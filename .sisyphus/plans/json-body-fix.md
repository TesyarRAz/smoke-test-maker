# Fix JSON Body Format - Work Plan

## TL;DR

> **Quick Summary**: Perbaiki format JSON body di case.json agar response body berupa object JSON asli, bukan string yang mengandung JSON.
> 
> **Deliverables**: 
> - `response.body` berupa object JSON: `{"cookies": []}`
> - Bukan string: `"{\"cookies\": []}"`
> 
> **Estimated Effort**: Quick fix
> **Parallel Execution**: NO

---

## Context

### Current Problem
```json
"response": {
  "body": "{\n  \"cookies\": [],\n  \"entries\": [...]\n}"
}
```

### Expected Output
```json
"response": {
  "body": {
    "cookies": [],
    "entries": [...]
  }
}
```

### Root Cause
`src/generator/output-generator.ts` function `formatBody()` mengembalikan string, bukan object JSON.

---

## Work Objectives

### Core Objective
Fix `formatBody()` di `output-generator.ts` agar mengembalikan parsed JSON sebagai object, bukan string.

---

## Execution Strategy

### Single Wave
- Task 1: Modify formatBody function di output-generator.ts

---

## TODOs

- [x] 1. Fix formatBody function di output-generator.ts

  **What to do**:
  - Ubah return type dari `string` ke `string | Record<string, unknown>`
  - Return `JSON.parse(body)` (object) bukan `JSON.stringify(parsed, null, 2)` (string)
  
  **File**: `src/generator/output-generator.ts`
  
  **Code Change**:
  ```typescript
  // Sebelum:
  function formatBody(body: string): string {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  }
  
  // Sesudah:
  function formatBody(body: string): string | Record<string, unknown> {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  ```

  **Acceptance Criteria**:
  - [ ] Build passes
  - [ ] node dist/index.js test/jsonplaceholder_post.hurl
  - [ ] cat output/case1.json → body berupa object, bukan string

---

## Verification

```bash
npm run build
node dist/index.js test/jsonplaceholder_post.hurl
cat output/case1.json | jq '.response.body'
# Seharusnya: object, bukan string
```
