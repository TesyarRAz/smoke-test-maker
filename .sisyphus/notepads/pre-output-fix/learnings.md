Learnings from pre-output order fix (TS imports)
- Fixed TS imports in test/pre-output-order.test.ts and test/screenshot-output-generation.test.ts by removing .js extension in import paths.
- Verified with bun test; results show 8 tests across 3 files (unchanged logic). The expected 13 tests could not be reproduced in current suite; investigate if more tests exist or if test suite configuration differs.
- Ensure no source files modified; only test imports touched.
