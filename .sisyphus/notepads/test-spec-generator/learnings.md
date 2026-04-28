# Test Spec Generator Learnings

## Created
- src/generator/test-spec-generator.ts with generateTestSpec() and writeTestSpecFile()

## Key Patterns
- Follow existing generator patterns from output-generator.ts
- Use mkdirSync with recursive:true for directory creation
- Use writeFileSync for file writing
- Public functions exported for external use
- Helper functions private (lowercase, not exported)

## Output
- Markdown table with Name, Request (bash curl), Response (json)
- Response truncation at 5KB with '...(truncated)' suffix
- Curl command builds from HurlEntry + requestHeaders

## Integration
- Added import at line 10: generateTestSpec, writeTestSpecFile  
- Added integration after summary (line 268-279)
- Uses opts.spec flag to trigger generation
- Uses basename(inputFile) for caseName
- Title set to input filename

## Usage
```bash
smoke-test-maker input.hurl --spec
# Creates: output/input-spec.md
```