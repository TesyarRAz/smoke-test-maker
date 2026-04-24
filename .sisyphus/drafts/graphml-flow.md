# Draft: GraphML Flow Visualization for Hurl Files

## Requirements
- [requirement]: Generate GraphML file showing flow between hurl entries
- [requirement]: Show capture-to-variable relationships (Entry N captures X → Entry N+1 uses {{X}})
- [requirement]: Directed edges from entry that captures to entry that uses

## Technical Details

### Entry Structure
- Each entry has: request, captures[], can use {{variable}}
- Captures: `capture.name` = variable name captured from response
- Variables used: in URL, headers, body via {{variable_name}}

### Flow Detection
1. Entry #1 captures `id` via capture definition
2. Entry #2 uses `{{id}}` in URL/query/body
3. Edge: Entry #1 → Entry #2 (labeled "id")

### GraphML Format
Nodes: each entry (with method, URL summary)
Edges: capture relationships (with captured variable name)

## Open Questions
- [question]: Output filename? (default: [hurl-file].graphml)
- [question]: CLI option? (--graphml or separate command)