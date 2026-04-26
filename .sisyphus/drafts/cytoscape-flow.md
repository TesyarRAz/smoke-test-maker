# Draft: Cytoscape Flow Generator

## Requirement (confirmed)
- User provided exact HTML template with Cytoscape + dagre layout
- Template shows API sequence flow from login to approve with nodes and edges

## Technical Decisions
- Replace existing `generateFlowDiagramHtml` (SVG-based) with new Cytoscape implementation
- Use user's HTML as reference for styling and structure
- Keep compatible with existing caller `generateFlowHtml`

## Key Differences
- SVG → Canvas-based via Cytoscape
- Simple horizontal layout → dagre layout (LR direction)
- Basic styling → Color-coded by method (POST=green, PATCH=orange)
- Edge labels → taxi-style curved edges

## Scope Boundaries
- INCLUDE: Replace generateFlowDiagramHtml function
- EXCLUDE: Don't touch generateGraphml or other generators