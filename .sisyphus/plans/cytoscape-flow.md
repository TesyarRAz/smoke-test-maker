# Cytoscape Flow Generator Replacement

## TL;DR

> **Objective**: Replace SVG-based flow diagram with Cytoscape.js version using user's HTML template
> **Scope**: Replace single function in graphml-generator.ts
> **Delivery**: Cytoscape-powered interactive flow chart with dagre layout

---

## Context

### User Request
User provided complete HTML template with Cytoscape.js + dagre for rendering API sequence flow.

### Technical Approach
Reference user's HTML for styling and JavaScript. Key elements:
- Cytoscape 3.26.0 + cytoscape-dagre extension
- Dagre layout with LR direction (horizontal flow)
- Node styling: POST=green, PATCH=orange borders
- Edge styling: taxi-curved lines with labels

---

## Work Objectives

### Must Have
- [x] Replace `generateFlowDiagramHtml` function with Cytoscape version
- [x] Use dagre layout (rankDir: LR)
- [x] Same node/edge data input (from existing function parameters)

### Must NOT Have
- [x] Don't touch generateGraphml function
- [x] Don't change function signature (maintain API compatibility)

---

## Verification Strategy

- [x] Generated HTML loads Cytoscape + dagre from CDN
- [x] Nodes render with proper method colors (POST=green, PATCH=orange)
- [x] Edges use taxi/curved style
- [x] Layout flows left-to-right

---

## Acceptance Criteria

Function signature remains: `generateFlowDiagramHtml(nodes: GraphNode[], links: GraphLink[]): string`

Returns HTML string with:
- [x] Cytoscape loaded from CDN
- [x] Dagre layout working
- [x] Nodes and edges rendered correctly