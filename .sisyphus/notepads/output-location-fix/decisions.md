## Decisions
- Default output directory derived from input file's directory: join(dirname(inputFile), 'output').
- If user passes --output-dir, use that value (nullish coalescing ensures user-provided value overrides default).
- Changes restricted to src/cli.ts; no other files modified to satisfy scope.
