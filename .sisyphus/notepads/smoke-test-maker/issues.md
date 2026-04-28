2026-04-28: Blockers and notable issues encountered during Vitest setup.
- Blockers:
  - LSP diagnostics verification could not be run due to missingBiome LSP server in this environment.
- Known issues:
  - No tests existed prior to setup; need to add at least one example test to validate config.
- Mitigations:
  - Rely on bun test output for quick feedback; plan to add a minimal test file next.
