# Fix Capture Propagation - Variables Not Propagating to Subsequent Entries

## TL;DR

> **Quick Summary**: Fix bug where captured variables from HTTP responses only available for current entry, not propagated to subsequent entries. Need global accumulator to persist captures across all entries.
> 
> **Deliverables**: Modified `src/index.ts` execution loop with accumulatedVariables, test verification script
> - [x] Updated index.ts with global accumulator for captured variables
> - [x] Test script verifying variable propagation works
> 
> **Estimated Effort**: Short (1-2 hours)
> **Parallel Execution**: NO (sequential fix)
> **Critical Path**: Understand flow → Modify accumulator → Test

---

## Context

### Original Request
User has .hurl file with sequential entries:
1. Entry #1 (PATCH approve): captures `incomeStatementId`
2. Entry #2 (POST create): captures `pendingIncomeStatementId`  
3. Entry #3 (PUT edit): pre-output query uses `{{incomeStatementId}}` - variable empty because captures from previous entries not propagated

### Problem
In `index.ts` line 134:
```typescript
const mergedVariables = { ...options.variables, ...result.capturedVars };
```
This only merges **current entry's** captures, not accumulated from previous entries.

---

## Work Objectives

### Core Objective
Create global accumulatedVariables that persists across ALL entries so pre-output/post-output queries can use captured variables from previous HTTP entries.

### Concrete Deliverables
- Modified `src/index.ts` with accumulatedVariables tracking
- Test verification script

### Definition of Done
- [x] Entry #1 capture accessible in Entry #3's pre-output query

### Must Have
- Captured variables propagate forward to subsequent entries
- Initial variables remain base (not overwritten when empty captures)

### Must NOT Have (Guardrails)
- No new capture types
- No variable transformation logic
- No scope levels (global/session/local)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES - existing test files
- **Manual test**: Use existing .hurl test file with captures
- **QA**: Run smoke-test-maker with sample file, verify pre-output query uses correct captured value

---

## Execution Strategy

### Sequential (Single Fix)
```
Task 1: Modify index.ts execution loop to accumulate captures
└── Task 2: Test with sample hurl file
```

### Dependency Matrix
- 1 → 2

---

## TODOs

- [x] 1. Modify index.ts - Add accumulatedVariables tracking in execution loop

  **What to do**:
  - In `src/index.ts`, around line 119-134, create global `accumulatedVars` that persists across entries
  - Initialize with `options.variables` (initial values from CLI/.env)
  - After each entry executes, merge its `capturedVars` into `accumulatedVars`
  - Pass `accumulatedVars` to subsequent entry execution (via updating execOptions.variables in the loop)
  - Use `accumulatedVars` (not just current entry's captures) for pre-output/post-output query resolution

  **Code Change Location**: `src/index.ts` execution loop (lines 119-183)

  **Implementation**:
  ```typescript
  // Line ~119: Initialize accumulator with initial variables
  let accumulatedVars = { ...options.variables };
  
  // In the loop - pass accumulated vars to each entry execution
  const execOptions: ExecutionOptions = {
    ...options,
    variables: accumulatedVars  // Use accumulated for current entry execution
  };
  
  // After entry execution - merge captures into accumulator
  accumulatedVars = { ...accumulatedVars, ...result.capturedVars };
  
  // Line 134 for pre-output/post-output - use accumulatedVars
  const mergedVariables = { ...accumulatedVars };
  ```

  **Must NOT do**:
  - Don't lose initial options.variables when merging
  - Don't clear accumulator between entries

  **References**:
  - `src/index.ts:134` - current bug location (only merges current entry)
  - `src/executor/hurl-executor.ts:29-31` - how variables passed to hurl
  - `src/resolver/variable-resolver.ts` - variable resolution pattern

  **Acceptance Criteria**:
  - [x] Captured variables from Entry #1 available in Entry #2's URL
  - [x] Captured variables from Entry #1 and #2 available in Entry #3's pre-output query
  - [x] Initial CLI variables remain as base (not lost)

  **QA Scenarios**:

  ```
  Scenario: Capture propagation - Entry #1 to Entry #3 pre-output
    Tool: Bash
    Preconditions: .hurl file with 3 entries as provided by user
    Steps:
      1. Run: bun run src/index.ts test/scenario_prepost.hurl --env test/.env
      2. Check output for pre-output query executing with resolved variable
    Expected Result: pre-output query executes with actual incomeStatementId value, not {{incomeStatementId}}
    Evidence: .sisyphus/evidence/capture-propagation-test.txt (output showing resolved variable)
  ```

- [x] 2. Test verification - Run with sample file to confirm fix

  **What to do**:
  - Create test .hurl file with sequential captures
  - Run smoke-test-maker and verify pre-output query uses correct captured value
  - Verify no placeholder {{variable}} remains in query

  **Acceptance Criteria**:
  - [x] No {{variable}} placeholders in executed pre-output queries
  - [x] DB query returns correct row based on captured ID

  **QA Scenarios**:

  ```
  Scenario: Verify variable resolves correctly in pre-output
    Tool: Bash
    Preconditions: Fix applied to index.ts
    Steps:
      1. Run: bun run src/index.ts test/scenario_prepost.hurl --env test/.env
      2. Grep output for "{{incomeStatementId}}" - should NOT appear
      3. Grep for resolved ID value in query
    Expected Result: Variable resolved, no {{ }} placeholders in executed query
    Evidence: .sisyphus/evidence/variable-resolution-verified.txt
  ```

---

## Final Verification Wave

- [x] F1. Code review - Verify accumulator correctly implemented
- [x] F2. Manual test - Run with user's .hurl file

---

## Success Criteria

### Verification Commands
```bash
# After fix - verify no {{...}} in executed queries
grep "{{" output/case3*.html | wc -l  # Should be 0
```

### Final Checklist
- [x] All captured variables propagate to subsequent entries
- [x] Initial variables preserved as base
- [x] No placeholder leakage in executed queries