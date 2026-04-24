# Work Plan: GraphML Flow - Topological Layout

## TL;DR
> Add topological sorting to flow diagram - source nodes on left, targets on right based on capture→usage edges.

**Deliverables**: `src/generator/graphml-generator.ts` updated with topological layout
**Estimated Effort**: Quick
**Parallel Execution**: N/A (single task)

---

## Context

### Problem
Current layout is linear (entries[i] at position i). User wants graph-based layout:
- Entry capturing `postId` should be on LEFT
- Entry using `{{postId}}` should be on RIGHT
- Arrows show data flow direction

### Algorithm
1. Compute in-degree for each node (number of incoming edges)
2. Start with nodes that have in-degree 0 (root sources)
3. Compute X position based on layer (distance from sources)
4. Nodes with more dependencies are further right

---

## Task

- [x] 1. **Add topological layer calculation**

  **What to do**:
  - Add `index` field to `GraphNode` interface
  - Compute layer for each node based on longest path from source
  - Nodes with no incoming edges = layer 0
  - Node layer = max(incoming edge source layer) + 1

  ```typescript
  interface GraphNode {
    id: string;
    index: number;  // ADD THIS - entry index
    layer: number;  // ADD THIS - topological layer
    method: string;
    url: string;
  }
  ```

- [x] 2. **Sort nodes by layer in generateFlowHtml()**

  **What to do**:
  - Calculate layer for each node using BFS/DP
  - Sort nodes by layer (ascending)
  - Use sorted position for X coordinate

- [x] 3. **Verify edge routing with new positions**

  **What to do**:
  - Edges now connect non-adjacent nodes
  - Ensure SVG lines route correctly
  - Test with scenario.hurl

---

## Acceptance Criteria

- [x] Node at index 0 (POST captures) is LEFTMOST
- [x] Node using {{postId}} is RIGHT of capturing node
- [x] Edges don't overlap nodes
- [x] Build passes

---

## Commit Strategy

- [x] `feat(graphml): add topological layout for flow diagram`