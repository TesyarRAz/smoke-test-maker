# Generate GraphML Flow Diagram for Hurl Files

## TL;DR

> **Feature**: Generate GraphML file visualizing flow between hurl entries
> 
> **Shows**: Capture → variable dependencies between entries (unidirectional)
> 
> **Output**: .graphml file that can be opened in yEd, Graphviz, etc.

---

## Context

### Use Case
User wants to visualize data flow in .hurl files:
- Entry #1 (POST /posts) captures `postId` from response
- Entry #2 (GET /posts/{{postId}}) uses captured `postId`
- Graph shows: Entry #1 → Entry #2 (labeled "postId")

### Captures Syntax
```
[Captures]
postId: jsonpath("$.id")
```

### Variable Usage
```
GET {{BASE_URL}}/posts/{{postId}}
# or in DB query:
# post-output:testdb:{{dsn}}|SELECT * FROM posts WHERE id = '{{postId}}'
```

---

## Work Objectives

### Must Have
- [x] Parse hurl file to extract all captures per entry
- [x] Parse hurl entries to find {{variable}} usage
- [x] Build directed edges: entry(captures) → entry(uses)
- [x] Generate valid GraphML XML
- [x] Add CLI option --graphml to index.ts
- [x] Connect generator to CLI and output to stdout

### Must NOT Change
- [x] Existing functionality (run, output generation)
- [x] Parser behavior

---

## Technical Details

### Input
- HurlEntry: { index, request, captures[], rawContent }
- captures: { name, query }[]

### Detection Logic

**Extract captures per entry**:
```typescript
for (const entry of entries) {
  const capturedVars = entry.captures?.map(c => c.name) || [];
  // Store: entryIndex -> [capturedVars]
}
```

**Find variable usage** (in URL, headers, body):
```typescript
// Find all {{varName}} patterns
const varRegex = /\{\{(\w+)\}\}/g;
const usedVars = [];
let match;
while (match = varRegex.exec(text)) {
  usedVars.push(match[1]);
}
```

**Build edges**:
```
For each capture (entry A, varName):
  For each usage (entry B, varName):
    Add edge: A → B (label: varName)
```

### GraphML Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.org/graphml">
  <key id="method" for="node" attr.name="method"/>
  <key id="url" for="node" attr.name="url"/>
  <graph id="G" edgedefault="directed">
    <node id="0"><data key="method">POST</data><data key="url">/posts</data></node>
    <node id="1"><data key="method">GET</data><data key="url">/posts/{{postId}}</data></node>
    <edge id="0-1" source="0" target="1"><data key="label">postId</data></edge>
  </graph>
</graphml>
```

### CLI Option
```bash
# Option 1: Separate command
smoke-test-maker graphml test.hurl

# Option 2: Flag
smoke-test-maker run test.hurl --graphml
```

---

## Implementation Plan

### Step 1: Add CLI option
- `src/index.ts` - add `--graphml` flag
- Optional: generate-graphml command

### Step 2: Create generator
- `src/generator/graphml-generator.ts`
- Function: `generateGraphml(entries: HurlEntry[])`
- Returns: GraphML XML string

### Step 3: Parse variable usage
- Extract from: request.url, request.headers, request.body
- Also from: customComments[].query (DB queries)

### Step 4: Output file
- Write to: {hurl-file}.graphml or --output flag

---

## Verification

### Test Case
Create test file:
```
# test-flow.hurl
POST {{BASE_URL}}/posts
Content-Type: application/json

{"title":"test","userId":1}
[Captures]
postId: jsonpath("$.id")

GET {{BASE_URL}}/posts/{{postId}}
```

Expected GraphML:
- Node 0: POST /posts
- Node 1: GET /posts/{{postId}}
- Edge: 0 → 1 (label: "postId")

### Build
```
bun run build
```

---

## Success Criteria

- [x] --graphml flag generates .graphml file
- [x] Edges show capture → usage relationships
- [x] Build passes
- [x] GraphML valid (opens in yEd/Graphviz)