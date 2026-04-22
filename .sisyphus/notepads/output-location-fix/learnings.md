## Learnings
- Derive default output directory from input file location using path.dirname and path.join.
- Import dirname and join from 'path' and preserve existing resolve usage for env handling.
- Implement nullish coalescing (??) to allow user-provided --output-dir to override the derived default.
- Ensure changes touch only src/cli.ts as required; no other files were modified.
