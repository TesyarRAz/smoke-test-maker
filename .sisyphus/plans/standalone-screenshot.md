# Work Plan: Standalone Screenshot Without Pre/Post Output

## TL;DR
> Allow `screenshot` action to work independently without requiring pre-output/post-output.
> Screenshot should capture state directly without needing query.

**Deliverables**: Parser and processor changes for standalone screenshot
**Estimated Effort**: Quick
**Parallel Execution**: N/A

---

## Context

### Problem
Current implementation requires pre-output or post-output before screenshot:
- `> pre-output:postgresdb:{{DB_URL}}|SELECT ...` (runs query first)
- `# screenshot:postgresdb:{{DB_URL}}|SELECT ...` (runs query first)

User wants standalone screenshot that doesn't need query:
- `> screenshot:postgresdb:{{DB_URL}}` (no query - just capture screenshot)

### Current Code

**Parser** (src/parser/hurl-parser.ts:7):
```typescript
const CUSTOM_COMMENT_REGEX = /(?:#|>)\s*(output|screenshot|pre-output|post-output):(postgresdb|mysql|mongodb|testdb):(\{[^}]+\}|[^|]+)\|(.+)$/;
```
- Requires action, dbType, dsnVariable, AND query (the `|(.+)$` part)

---

## Task

- [ ] 1. **Update CUSTOM_COMMENT_REGEX to make query optional for screenshot**

  **What to do**:
  - Change regex to make query optional when action is `screenshot`
  - New regex pattern:
  ```typescript
  const CUSTOM_COMMENT_REGEX = /(?:#|>)\s*(output|screenshot|pre-output|post-output):(postgresdb|mysql|mongodb|testdb):(\{[^}]+\}|[^|]+)(\|(.+))?$/;
  ```
  - The `(\|(.+))?` makes the query optional

- [ ] 2. **Update type to allow undefined query**

  **What to do** (src/types/hurl.ts:43):
  ```typescript
  export interface CustomComment {
    action: 'output' | 'screenshot' | 'pre-output' | 'post-output';
    dbType: 'postgresdb' | 'mysql' | 'mongodb' | 'testdb';
    dsnVariable: string;
    query?: string;  // Optional for screenshot
  }
  ```

- [ ] 3. **Update processor to handle screenshot without query**

  **What to do** (src/processor/comment-processor.ts):
  - When action is `screenshot` and query is empty/undefined, still process the screenshot
  - Skip database execution, just capture screenshot

---

## Acceptance Criteria

- [ ] `> screenshot:postgresdb:{{DB_URL}}` works (no query needed)
- [ ] `> screenshot:mysql:{{DB_URL}}|SELECT 1` still works (with query)
- [ ] Build passes

---

## Commit Strategy

- [ ] `feat(screenshot): allow standalone screenshot without query`