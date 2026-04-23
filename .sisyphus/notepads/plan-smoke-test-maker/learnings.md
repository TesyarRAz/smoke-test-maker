## Learnings

- Fixed variable capture propagation bug in smoke-test-maker by introducing an accumulator for variables across entries.
- Updated hurl-executor.ts to pass accumulated variables to each entry and merge newly captured vars back into the accumulator after every entry.
- Verification: ensured TypeScript builds with bun run build.
