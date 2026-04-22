# Add --strict Flag

## TL;DR
> When `--strict` flag is used, if any case has error from hurl/DB/process, output error details to stderr and exit with error.

## Problem
- User wants: when any case fails, show detailed error from stderr
- Currently: errors are stored but not prominently displayed

## Solution
Add `--strict` CLI flag that:
1. When enabled + any case fails → print error to stderr + exit with code 1
2. Similar to `--stop-on-failure` but shows detailed error

---

## TODOs

- [x] 1. Add --strict flag to CLI

  **File**: `src/cli.ts`
  
  **Change**: 
  - Add `strict: boolean` to CliOptions interface (line ~10)
  - Add option: `.option('--strict', 'Exit with error if any case fails')`
  - Parse to options (line ~69)

- [x] 2. Add strict to options passthrough

  **File**: `src/index.ts`
  
  **Change**: Add `strict` to CliOptions and ExecutionOptions interfaces

- [x] 3. Implement strict error handling

  **File**: `src/index.ts`
  
  **Change**: After processing all results, if strict=true and any failed:
  - Print error details to stderr
  - Exit with code 1

- [x] 4. Verify build passes
