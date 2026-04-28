2026-04-28: Vitest + Bun chosen for test infra.
- Rationale:
  - Quick bootstrap with TypeScript support and minimal config
- Key decisions:
  - Test files will live under test/**/*.test.ts
  - Vitest config enables globals to simplify tests
- Alternatives considered:
  - Jest: heavier, slower bootstrap
- Outcome:
  - Infra scaffold in place; ready for test creation.
