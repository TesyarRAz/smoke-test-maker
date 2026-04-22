# Show DB Connection Error - Work Plan

## TL;DR

> **Quick Summary**: DB connection errors must be shown and stop execution immediately (default behavior, no strict flag needed).

> **Deliverables**:
> - DB connection errors displayed to console with clear message
> - Execution stops on first DB connection failure

> **Estimated Effort**: Short
> **Parallel Execution**: NO (sequential)
> **Critical Path**: index.ts → comment-processor.ts

---

## Context

### Original Issue
User: "nah ini ketika db nya ga konek itu harusnya muncul error dong"

### Requirement
- DB connection errors MUST be shown (default behavior)
- If DB cannot connect, show error and STOP execution
- No need for strict flag - this is the default

---

## Work Objectives

### Core Objective
When DB connection fails, display the error to the user and stop execution immediately.

### Concrete Deliverables
- [ ] Console shows DB connection error with clear message
- [ ] Execution stops when DB can't connect
- [ ] Error message includes which DB type failed

### Must Have
- DB error displayed to console (not silently ignored)
- Process stops immediately on DB failure

### Must NOT Have
- No silent continuation on DB error
- No partial output generation after DB failure

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO (existing project, no new tests needed)
- **Agent-Executed QA**: Run CLI with invalid DB DSN and verify error is shown

---

## Execution Strategy

### Tasks (sequential - small change)

```
Task 1: Update comment-processor.ts to throw error (don't catch)
Task 2: Update index.ts to catch and display DB error
Task 3: QA verification
```

---

## TODOs

- [x] 1. Update comment-processor.ts to throw error on DB failure

  **What to do**:
  - In `src/processor/comment-processor.ts`, lines 53-59
  - Instead of catching and returning error, throw the error
  - This ensures execution stops immediately

  Change:
  ```typescript
  } catch (error) {
    return {
      success: false,
      results,
      error: `Failed to process ${comment.dbType} query: ${error}`
    };
  }
  ```

  To:
  ```typescript
  } catch (error) {
    throw new Error(`DB connection error (${comment.dbType}): ${error}`);
  }
  ```

  **References**: src/processor/comment-processor.ts:53-59

- [x] 2. Update index.ts to catch and display DB error

  **What to do**:
  - In `src/index.ts`, lines 133-139
  - Change from logging error and continuing to throwing/stopping

  Change:
  ```typescript
  if (!dbResult.success) {
    console.error(`DB query failed for entry ${entry.index}: ${dbResult.error}`);
    databases.push(...dbResult.results);
  } else {
    databases.push(...dbResult.results);
  }
  ```

  To:
  ```typescript
  if (!dbResult.success) {
    throw new Error(dbResult.error);
  }
  ```

  **AND** wrap the processing in try-catch to display error clearly:
  ```typescript
  try {
    const dbResult = await processCustomComments(entry, mergedVariables);
    if (!dbResult.success) {
      throw new Error(dbResult.error);
    }
    databases.push(...dbResult.results);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
  ```

  **References**: src/index.ts:133-139

- [x] 3. QA verification

  **What to do**: Build and test

  Steps:
  1. bun run build
  2. Run with invalid DB DSN (e.g., wrong port)
  3. Verify error is shown and process stops

---

## Done Criteria

- [ ] DB connection error displayed to console
- [ ] Process exits with error code
- [ ] Build passes