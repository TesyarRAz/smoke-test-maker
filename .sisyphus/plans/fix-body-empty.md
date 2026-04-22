# Fix Empty Body Bug

## TL;DR
> Response body jadi kosong karena cara extract body dari hurl output salah.

## Problem
- hurl `--json` output tidak include body
- code extract body dari stdout.split() yang salah
- Hasil: body = ""

---

## TODOs

- [x] 1. Add --very-verbose flag to hurl executor args

  **File**: `src/executor/hurl-executor.ts`
  
  **Change**: Line 26 - add `--very-verbose` to args array

- [x] 2. Fix body extraction logic

  **File**: `src/executor/hurl-executor.ts`
  
  **Change**: Extract body from stderr verbose output with regex

- [x] 3. Verify fix works

  **Steps**:
  - npm run build
  - node dist/cli.js test/jsonplaceholder_get.hurl
  - Check output/case1.json - body should not be empty
