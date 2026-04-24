# Work Plan: GraphML Node ID Format Change

## TL;DR
> Change GraphML node IDs from numeric (`n0`, `n1`) to request format (`POST https://google.com`)

**Deliverables**: Modified `src/generator/graphml-generator.ts`
**Estimated Effort**: Quick
**Parallel Execution**: N/A (single task)

---

## Context

### Request
User wants GraphML node IDs to use the request format instead of numeric indices:
- **Before**: `n0`, `n1`, `n2`
- **After**: `POST https://google.com`, `GET https://api.example.com`

---

## Task

- [x] 1. **Update GraphML generator to use request-based node IDs**

  **What to do**:
  - Modify `generateGraphml()` function in `src/generator/graphml-generator.ts`
  - Create node ID from: `${method} ${url}` (with XML escaping)
  - Update edge source/target to use same format

  **Before**:
  ```typescript
  const id = entry.index;
  // node id="n0"
  // edge source="n0" target="n1"
  ```

  **After**:
  ```typescript
  const id = `${entry.request.method} ${entry.request.url}`;
  // node id="POST https://google.com"
  // edge source="POST https://google.com" target="GET https://api.example.com"
  ```

  **Required Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file change, straightforward modification

  **Acceptance Criteria**:
  - [x] GraphML output shows full request as node ID
  - [x] Edge references use same format
  - [x] XML valid (special chars escaped in IDs)

---

## Final Verification

- [x] Generate GraphML and verify node IDs are readable format
- [x] Verify build passes

---

## Commit Strategy

- [x] `feat(graphml): use request format for node IDs`

---

## Success Criteria

```bash
bun run src/index.ts test/scenario.hurl --graphml
# Expected: node id="POST https://google.com" in output
```