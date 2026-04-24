# Draft: show-header Default to Host

## Requirements (confirmed)
- [requirement]: When `--show-header` is not specified (empty/undefined), default to show "Host" header
- [requirement]: User can still override with specific header names like `--show-header Content-Type`
- [requirement]: Support comma-separated multiple headers: "Host,Content-Type"

## Technical Findings

### Current Implementation
1. **Parser** (`src/parser/hurl-parser.ts:171-177`): Parses `# show-header:` directive, stores in `entry.showHeaders[]`
2. **Output Generator** (`src/generator/output-generator.ts:5-21`): `filterHeaders()` function:
   - If `showHeaders` is empty/undefined → returns `{}` (no headers shown!)
   - If includes `*` → returns ALL headers
   - Otherwise filters to specified headers
3. **Entry Type** (`src/types/hurl.ts:56`): `showHeaders?: string[]` - optional array

### Root Cause
In `output-generator.ts:6-8`:
```typescript
if (!showHeaders || showHeaders.length === 0) {
  return {};  // Returns empty when not specified!
}
```

### Fix Location
`src/generator/output-generator.ts` - function `filterHeaders()`

## Scope
- IN: Add default "Host" when showHeaders is empty
- OUT: Don't change other behavior (wildcard *, specific headers)

## Open Questions
- [question]: Should fallback be case-insensitive? (host vs Host) - YES, match existing pattern