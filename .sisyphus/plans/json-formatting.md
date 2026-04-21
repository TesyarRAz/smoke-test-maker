# JSON Response Formatting & Verbose Flag - Work Plan

## TL;DR

> **Quick Summary**: Add `--very-verbose` flag to hurl execution and format response body as pretty-printed JSON in case.json output files.

> **Deliverables**:
> - Response body formatted as readable JSON (pretty-printed)
> - Full response body included via `--very-verbose` flag

> **Estimated Effort**: Short
> **Parallel Execution**: NO - sequential (2 small tasks)
> **Critical Path**: Task 1 → Task 2

---

## Context

### Original Request
User wants two improvements:
1. Format HTTP response body in case.json to pretty-printed JSON (not raw string)
2. Use `--very-verbose` flag in hurl execution to include response body in JSON output

---

## Work Objectives

### Core Objective
Make HTTP response bodies readable in output JSON files by formatting them as pretty-printed JSON, and ensure full response data is captured via `--very-verbose` flag.

### Must Have
- Response body in case.json is pretty-printed JSON
- `--very-verbose` flag added to hurl execution

---

## Execution Strategy

### Tasks

- [x] 1. Add `--very-verbose` to hurl execution

  **What to do**:
  - Modify `src/executor/hurl-executor.ts` line 84
  - Change `['--json', '--test']` to `['--json', '--test', '--very-verbose']`

  **Verification**:
  - Build passes
  - Test run shows response body in output

- [x] 2. Format response body as pretty-printed JSON

  **What to do**:
  - Modify `src/generator/output-generator.ts`
  - Before storing response body, detect if it's valid JSON
  - If valid JSON, parse and re-serialize with `JSON.stringify(parsed, null, 2)`
  - If not valid JSON, keep as-is

  **Code to add** (in generateOutput or before writeOutputFile):
  ```typescript
  function formatBody(body: string): string {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  }
  ```

  **Verification**:
  - Build passes
  - case.json shows formatted JSON body (indented, readable)

---

## Verification Commands

```bash
npm run build
node dist/index.js test/jsonplaceholder_get.hurl
cat output/case1.json  # Should show formatted JSON body
```

---

## Success Criteria

- [x] `--very-verbose` flag added to hurl execution
- [x] Response body in case.json is pretty-printed JSON
- [x] Build passes
- [x] Test run produces readable output
